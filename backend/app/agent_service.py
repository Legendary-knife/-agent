from datetime import datetime
from uuid import uuid4

from backend.app.data import KNOWLEDGE_DOCUMENTS, SCENARIOS, TOOL_DEFINITIONS
from backend.app.models import AgentRun, AgentRunRequest, AgentTraceStep, ScenarioId


CONFIDENCE_BY_SCENARIO: dict[ScenarioId, int] = {
    "knowledge": 86,
    "sales": 82,
    "supply": 89,
}


def get_scenario(scenario_id: ScenarioId) -> dict:
    for scenario in SCENARIOS:
        if scenario["id"] == scenario_id:
            return scenario
    raise ValueError(f"Unknown scenario: {scenario_id}")


def retrieve_documents(scenario_id: ScenarioId, prompt: str) -> list[dict]:
    scenario = get_scenario(scenario_id)
    normalized_prompt = prompt.lower()
    scenario_terms = set(str(tag).lower() for tag in scenario["tags"])
    preferred_scopes: dict[ScenarioId, set[str]] = {
        "knowledge": {"policy", "product"},
        "sales": {"sales", "product"},
        "supply": {"supply", "product"},
    }

    scored_documents: list[tuple[int, dict]] = []
    for document in KNOWLEDGE_DOCUMENTS:
        keywords = set(str(keyword).lower() for keyword in document["keywords"])
        scope_score = 2 if document["scope"] in preferred_scopes[scenario_id] else 0
        keyword_score = sum(3 for keyword in keywords if keyword and keyword in normalized_prompt)
        tag_score = sum(1 for term in scenario_terms if term and term in normalized_prompt)
        scored_documents.append((scope_score + keyword_score + tag_score, document))

    return [
        document
        for _, document in sorted(scored_documents, key=lambda item: item[0], reverse=True)
        if _ > 0
    ][:2]


def infer_focus(prompt: str) -> str:
    if any(keyword in prompt for keyword in ["账期", "授信", "回款", "渠道"]):
        return "账期审批"
    if any(keyword in prompt for keyword in ["德国", "客户", "开发信", "外贸", "销售"]):
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


def build_answer(scenario_id: ScenarioId, prompt: str, citations: list[str], selected_tools: list[dict]) -> str:
    focus = infer_focus(prompt)
    citation_text = "、".join(citations) if citations else "当前知识库"
    tool_text = "、".join(tool["name"] for tool in selected_tools)

    if scenario_id == "knowledge":
        if focus == "账期审批":
            conclusion = (
                "可以申请账期，但需要先通过渠道等级、历史回款、区域负责人和财务风控四项校验。"
                "建议把近 12 个月采购额、信用证明、合同主体和预计回款周期放进审批材料。"
            )
        elif focus == "产品资料":
            conclusion = (
                "这类问题应优先查产品手册，再补充政策约束。建议输出产品参数、适用场景、合规限制和可对外表述，"
                "避免只给一句泛泛结论。"
            )
        else:
            conclusion = (
                "这类问题适合走知识库问答链路：先按业务词召回资料，再用 rerank 过滤弱相关片段，"
                "最后给出带来源的回答。"
            )
    elif scenario_id == "sales":
        if focus == "客户开发":
            conclusion = (
                "建议先把客户分为技术验证型线索，用可靠性、交付稳定性和欧盟合规资料切入。"
                "开发信不要急着报价，先约一次 20 分钟技术交流，并把 CRM 跟进动作写回销售节奏。"
            )
        else:
            conclusion = (
                "销售场景应先补齐客户画像，再决定话术。当前更适合生成客户分级、触达理由和下一步跟进任务，"
                "而不是直接生成报价。"
            )
    else:
        if focus == "库存采购":
            conclusion = (
                "存在供应风险时，需要同时看未交付订单、现货、在途和安全库存。"
                "如果缺口仍未覆盖，建议生成采购审批摘要，并把订单金额、库存缺口和供应商交期写清楚。"
            )
        else:
            conclusion = (
                "供应链问题应先判断它是订单风险、库存风险还是交期风险，再选择 ERP/WMS 工具读取数据，"
                "最后生成可审批的行动建议。"
            )

    return f"针对这次问题「{prompt}」，系统识别为「{focus}」。{conclusion}本次依据：{citation_text}；调用工具：{tool_text}。"


def create_agent_run(request: AgentRunRequest) -> AgentRun:
    scenario = get_scenario(request.scenario_id)
    retrieved_documents = retrieve_documents(request.scenario_id, request.prompt)
    selected_tools = select_tools(request.scenario_id, request.prompt)
    citations = [f"{document['title']} / {document['scope']}" for document in retrieved_documents]
    has_high_risk_tool = any(tool["riskLevel"] == "high" for tool in selected_tools)
    focus = infer_focus(request.prompt)
    answer = build_answer(request.scenario_id, request.prompt, citations, selected_tools)

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
            detail=f"命中 {len(retrieved_documents)} 份知识资料，按「{focus}」相关词召回后执行 rerank。",
            kind="rag",
            status="done",
            evidence="；".join(citations),
        ),
        AgentTraceStep(
            id="tool",
            title="工具调用",
            detail=f"调用 {', '.join(tool['name'] for tool in selected_tools)}，读取模拟业务数据。",
            kind="tool",
            status="done",
            evidence="；".join(tool["schema"] for tool in selected_tools),
        ),
        AgentTraceStep(
            id="approval",
            title="安全校验",
            detail="高风险工具只生成审批草稿，不直接修改 ERP、CRM 或库存数据。",
            kind="approval",
            status="needs_approval" if has_high_risk_tool else "done",
            evidence="权限白名单、敏感操作二次确认、trace 留存",
        ),
        AgentTraceStep(
            id="answer",
            title="生成结论",
            detail="输出本次问题对应的业务建议、引用来源和下一步动作。",
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
        confidence=CONFIDENCE_BY_SCENARIO[request.scenario_id],
        citations=citations,
        usedTools=[tool["name"] for tool in selected_tools],
        trace=trace,
        createdAt=datetime.now().strftime("%H:%M:%S"),
    )
