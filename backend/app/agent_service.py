from datetime import datetime
from uuid import uuid4

import httpx

from backend.app.config import get_settings
from backend.app.data import BUSINESS_RECORDS, SCENARIOS, TOOL_DEFINITIONS
from backend.app.llm_client import LLMNotConfiguredError, generate_answer
from backend.app.models import AgentRun, AgentRunRequest, AgentTraceStep, ScenarioId
from backend.app.storage import search_chunks


CONFIDENCE_BY_SCENARIO: dict[ScenarioId, int] = {
    "knowledge": 78,
    "sales": 76,
    "supply": 80,
}


def get_scenario(scenario_id: ScenarioId) -> dict:
    for scenario in SCENARIOS:
        if scenario["id"] == scenario_id:
            return scenario
    raise ValueError(f"Unknown scenario: {scenario_id}")


def infer_focus(prompt: str) -> str:
    if any(keyword in prompt for keyword in ["工单", "售后", "sla", "响应", "处理方案"]):
        return "售后支持"
    if any(keyword in prompt for keyword in ["账期", "授信", "回款", "渠道"]):
        return "账期审批"
    if any(keyword in prompt for keyword in ["德国", "客户", "开发信", "外贸", "销售", "邮件"]):
        return "客户开发"
    if any(keyword in prompt for keyword in ["库存", "缺货", "补采", "采购", "交付"]):
        return "库存采购"
    if any(keyword in prompt for keyword in ["产品", "参数", "A100", "合规"]):
        return "产品资料"
    return "通用问答"


def select_tools(scenario_id: ScenarioId, prompt: str) -> list[dict]:
    focus = infer_focus(prompt)
    tool_ids_by_scenario: dict[ScenarioId, list[str]] = {
        "knowledge": ["knowledge_search"],
        "sales": ["knowledge_search", "crm_lookup"],
        "supply": ["knowledge_search", "erp_order_check", "wms_inventory_check"],
    }
    tool_ids = set(tool_ids_by_scenario[scenario_id])
    if focus in {"账期审批", "库存采购"} or any(keyword in prompt for keyword in ["审批", "建议", "理由"]):
        tool_ids.add("approval_report")
    if focus == "客户开发" or any(keyword in prompt for keyword in ["邮件", "开发信", "英文"]):
        tool_ids.add("email_draft")

    return [tool for tool in TOOL_DEFINITIONS if tool["id"] in tool_ids and tool["enabled"]]


def build_context_blocks(chunks: list[dict]) -> list[str]:
    return [
        (
            f"[来源 {index + 1}] {chunk['documentTitle']} / chunk {chunk['chunkIndex']} "
            f"(score={chunk['score']})\n{chunk['content']}"
        )
        for index, chunk in enumerate(chunks)
    ]


def unique_chunks(chunks: list[dict]) -> list[dict]:
    seen: set[tuple[str, int, str]] = set()
    deduped: list[dict] = []
    for chunk in chunks:
        key = (chunk["documentTitle"], chunk["chunkIndex"], chunk["content"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(chunk)
    return deduped


def build_business_context() -> str:
    lines = [
        f"{record['source']} - {record['title']}：{record['status']}，负责人 {record['owner']}，{record['value']}"
        for record in BUSINESS_RECORDS
    ]
    return "\n".join(lines)


def build_retrieval_only_answer(prompt: str, chunks: list[dict], llm_error: str) -> str:
    if not chunks:
        return (
            f"问题「{prompt}」没有检索到可用知识片段。"
            "请先上传相关文档，或补充更明确的业务关键词。"
            f"另外，当前无法生成模型回答：{llm_error}"
        )

    evidence = "；".join(
        f"{chunk['documentTitle']} chunk {chunk['chunkIndex']}，score={chunk['score']}"
        for chunk in chunks[:3]
    )
    return (
        f"已完成真实知识库检索，但当前无法调用大模型生成最终回答：{llm_error}"
        f" 可先查看这些命中的依据：{evidence}。"
        "配置 LLM 后，系统会把这些片段和业务数据一起交给模型生成结论。"
    )


def calculate_confidence(scenario_id: ScenarioId, chunks: list[dict], llm_configured: bool) -> int:
    retrieval_score = min(sum(chunk["score"] for chunk in chunks[:3]) * 18, 14)
    llm_bonus = 8 if llm_configured else 0
    return min(95, int(CONFIDENCE_BY_SCENARIO[scenario_id] + retrieval_score + llm_bonus))


async def create_agent_run(request: AgentRunRequest) -> AgentRun:
    settings = get_settings()
    scenario = get_scenario(request.scenario_id)
    focus = infer_focus(request.prompt)
    selected_tools = select_tools(request.scenario_id, request.prompt)
    retrieved_chunks = unique_chunks(search_chunks(request.prompt, settings.rag_top_k * 2))[: settings.rag_top_k]
    context_blocks = build_context_blocks(retrieved_chunks)
    if BUSINESS_RECORDS:
        context_blocks.append(f"[业务系统数据]\n{build_business_context()}")

    has_high_risk_tool = any(tool["riskLevel"] == "high" for tool in selected_tools)
    llm_error = ""

    try:
        answer = await generate_answer(settings, request.prompt, context_blocks)
        answer_source = "LLM 已生成"
    except LLMNotConfiguredError as error:
        llm_error = str(error)
        answer = build_retrieval_only_answer(request.prompt, retrieved_chunks, llm_error)
        answer_source = "仅检索，未生成"
    except httpx.HTTPError as error:
        llm_error = f"模型接口调用失败：{error}"
        answer = build_retrieval_only_answer(request.prompt, retrieved_chunks, llm_error)
        answer_source = "模型调用失败"

    citations = [
        f"{chunk['documentTitle']} / chunk {chunk['chunkIndex']} / score {chunk['score']}"
        for chunk in retrieved_chunks
    ]

    trace = [
        AgentTraceStep(
            id="plan",
            title="任务拆解",
            detail=f"识别场景为「{scenario['name']}」，本次重点是「{focus}」。",
            kind="plan",
            status="done",
            evidence=request.prompt,
        ),
        AgentTraceStep(
            id="rag",
            title="RAG 检索",
            detail=f"从 SQLite 知识库检索到 {len(retrieved_chunks)} 个 chunk，按向量相似度排序。",
            kind="rag",
            status="done",
            evidence="；".join(citations) or "未命中知识片段",
        ),
        AgentTraceStep(
            id="tool",
            title="工具调用",
            detail=f"选择 {', '.join(tool['name'] for tool in selected_tools)}，并注入业务系统上下文。",
            kind="tool",
            status="done",
            evidence="；".join(tool["schema"] for tool in selected_tools),
        ),
        AgentTraceStep(
            id="approval",
            title="安全校验",
            detail="高风险工具只生成建议或审批草稿，不直接修改 ERP、CRM 或库存数据。",
            kind="approval",
            status="needs_approval" if has_high_risk_tool else "done",
            evidence="权限白名单、敏感操作二次确认、trace 留存",
        ),
        AgentTraceStep(
            id="answer",
            title="生成结论",
            detail=f"{answer_source}。输出本次问题对应的业务建议、引用来源和下一步动作。",
            kind="answer",
            status="done",
            evidence=answer,
        ),
    ]

    return AgentRun(
        id=f"run-{request.scenario_id}-{uuid4().hex[:8]}",
        scenarioId=request.scenario_id,
        userPrompt=request.prompt,
        answer=answer,
        confidence=calculate_confidence(request.scenario_id, retrieved_chunks, settings.llm_configured),
        citations=citations,
        usedTools=[tool["name"] for tool in selected_tools],
        trace=trace,
        createdAt=datetime.now().strftime("%H:%M:%S"),
    )
