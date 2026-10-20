from datetime import datetime
from uuid import uuid4

from backend.app.data import KNOWLEDGE_DOCUMENTS, SCENARIOS, TOOL_DEFINITIONS
from backend.app.models import AgentRun, AgentRunRequest, AgentTraceStep, ScenarioId


ANSWER_BY_SCENARIO: dict[ScenarioId, str] = {
    "knowledge": (
        "可以申请账期，但需要先通过渠道等级、历史回款、区域负责人和财务风控四项校验。"
        "建议把客户近 12 个月采购额、信用证明、合同主体和预计回款周期放进审批材料，"
        "并由海外销售负责人发起。"
    ),
    "sales": (
        "建议把德国汽车零部件客户分为技术验证型线索，先用可靠性、交付稳定性和欧盟合规资料切入。"
        "开发信应避免直接报价，先约 20 分钟技术交流，并附上 A100 控制器在供应链追踪场景的案例。"
    ),
    "supply": (
        "存在缺货风险。A100 控制器本周未交付 1,280 件，华东仓现货 420 件、在途 300 件，"
        "低于 900 件安全库存。建议补采 700-900 件，并把未交付订单金额、库存缺口和供应商交期作为审批理由。"
    ),
}

TOOL_IDS_BY_SCENARIO: dict[ScenarioId, list[str]] = {
    "knowledge": ["approval_report"],
    "sales": ["crm_lookup", "email_draft"],
    "supply": ["erp_order_check", "wms_inventory_check", "approval_report"],
}

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
    query_terms = set(prompt.lower().replace("，", " ").replace("？", " ").split())
    scenario_terms = set(str(tag).lower() for tag in scenario["tags"])

    scored_documents: list[tuple[int, dict]] = []
    for document in KNOWLEDGE_DOCUMENTS:
        keywords = set(str(keyword).lower() for keyword in document["keywords"])
        scope_score = 2 if document["scope"] in {scenario_id, "product", "policy"} else 0
        keyword_score = len(keywords & query_terms) + len(keywords & scenario_terms)
        scored_documents.append((scope_score + keyword_score, document))

    return [
        document
        for _, document in sorted(scored_documents, key=lambda item: item[0], reverse=True)
        if _ > 0
    ][:2]


def select_tools(scenario_id: ScenarioId) -> list[dict]:
    tool_ids = set(TOOL_IDS_BY_SCENARIO[scenario_id])
    return [tool for tool in TOOL_DEFINITIONS if tool["id"] in tool_ids and tool["enabled"]]


def create_agent_run(request: AgentRunRequest) -> AgentRun:
    scenario = get_scenario(request.scenario_id)
    retrieved_documents = retrieve_documents(request.scenario_id, request.prompt)
    selected_tools = select_tools(request.scenario_id)
    citations = [f"{document['title']} / {document['scope']}" for document in retrieved_documents]
    has_high_risk_tool = any(tool["riskLevel"] == "high" for tool in selected_tools)

    trace = [
        AgentTraceStep(
            id="plan",
            title="任务拆解",
            detail=f"识别场景为「{scenario['name']}」，拆成检索、工具调用、结论生成三步。",
            kind="plan",
            status="done",
            evidence=request.prompt,
        ),
        AgentTraceStep(
            id="rag",
            title="RAG 检索",
            detail=f"命中 {len(retrieved_documents)} 份知识资料，按关键词召回后执行 rerank。",
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
            detail="输出业务建议、引用来源和下一步动作，便于面试现场演示闭环。",
            kind="answer",
            status="done",
            evidence=ANSWER_BY_SCENARIO[request.scenario_id],
        ),
    ]

    return AgentRun(
        id=f"run-{request.scenario_id}-{uuid4().hex[:8]}",
        scenarioId=request.scenario_id,
        userPrompt=request.prompt,
        answer=ANSWER_BY_SCENARIO[request.scenario_id],
        confidence=CONFIDENCE_BY_SCENARIO[request.scenario_id],
        citations=citations,
        usedTools=[tool["name"] for tool in selected_tools],
        trace=trace,
        createdAt=datetime.now().strftime("%H:%M:%S"),
    )
