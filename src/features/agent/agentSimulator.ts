import { knowledgeDocuments, toolDefinitions } from '@/services/demoData'
import type { AgentRun, AgentTraceStep, Scenario, ScenarioId } from '@/types/workbench'

const answerByScenario: Record<ScenarioId, string> = {
  knowledge:
    '可以申请账期，但需要先通过渠道等级、历史回款、区域负责人和财务风控四项校验。建议把客户近 12 个月采购额、信用证明、合同主体和预计回款周期放进审批材料，并由海外销售负责人发起。',
  sales:
    '建议把德国汽车零部件客户分为技术验证型线索，先用可靠性、交付稳定性和欧盟合规资料切入。开发信应避免直接报价，先约 20 分钟技术交流，并附上 A100 控制器在供应链追踪场景的案例。',
  supply:
    '存在缺货风险。A100 控制器本周未交付 1,280 件，华东仓现货 420 件、在途 300 件，低于 900 件安全库存。建议补采 700-900 件，并把未交付订单金额、库存缺口和供应商交期作为审批理由。',
}

const citationByScenario: Record<ScenarioId, string[]> = {
  knowledge: ['海外渠道商账期政策 / 第 3.2 节', '欧洲客户开发话术库 / 渠道准入'],
  sales: ['欧洲客户开发话术库 / 德国市场', 'A100 控制器产品手册 / 合规参数'],
  supply: ['供应商交期与安全库存表 / A100', 'A100 控制器产品手册 / 交付约束'],
}

const toolByScenario: Record<ScenarioId, string[]> = {
  knowledge: ['approval_report'],
  sales: ['crm_lookup', 'email_draft'],
  supply: ['erp_order_check', 'wms_inventory_check', 'approval_report'],
}

function createTrace(scenario: Scenario, prompt: string): AgentTraceStep[] {
  const selectedTools = toolDefinitions.filter((tool) => toolByScenario[scenario.id].includes(tool.id))
  const selectedDocs = knowledgeDocuments
    .filter((document) => citationByScenario[scenario.id].some((citation) => citation.includes(document.title)))
    .slice(0, 2)

  return [
    {
      id: 'plan',
      title: '任务拆解',
      detail: `识别场景为「${scenario.name}」，把问题拆成检索、工具调用、结论生成三步。`,
      kind: 'plan',
      status: 'done',
      evidence: prompt,
    },
    {
      id: 'rag',
      title: 'RAG 检索',
      detail: `命中 ${selectedDocs.length || 2} 份知识资料，使用语义检索 + rerank 过滤弱相关片段。`,
      kind: 'rag',
      status: 'done',
      evidence: citationByScenario[scenario.id].join('；'),
    },
    {
      id: 'tool',
      title: '工具调用',
      detail: `调用 ${selectedTools.map((tool) => tool.name).join('、')}，读取模拟业务数据。`,
      kind: 'tool',
      status: 'done',
      evidence: selectedTools.map((tool) => tool.schema).join('；'),
    },
    {
      id: 'approval',
      title: '安全校验',
      detail: '高风险工具只生成审批草稿，不直接修改 ERP、CRM 或库存数据。',
      kind: 'approval',
      status: selectedTools.some((tool) => tool.riskLevel === 'high') ? 'needs_approval' : 'done',
      evidence: '权限白名单、敏感操作二次确认、trace 留存',
    },
    {
      id: 'answer',
      title: '生成结论',
      detail: '输出业务建议、引用来源和下一步动作，便于面试现场演示闭环。',
      kind: 'answer',
      status: 'done',
      evidence: answerByScenario[scenario.id],
    },
  ]
}

export function runAgentScenario(scenario: Scenario, prompt: string): AgentRun {
  const usedTools = toolDefinitions
    .filter((tool) => toolByScenario[scenario.id].includes(tool.id))
    .map((tool) => tool.name)

  return {
    id: `run-${scenario.id}-${Date.now()}`,
    scenarioId: scenario.id,
    userPrompt: prompt,
    answer: answerByScenario[scenario.id],
    confidence: scenario.id === 'knowledge' ? 86 : scenario.id === 'sales' ? 82 : 89,
    citations: citationByScenario[scenario.id],
    usedTools,
    trace: createTrace(scenario, prompt),
    createdAt: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  }
}

export function estimateReadiness(run: AgentRun | null): number {
  if (!run) {
    return 64
  }

  const traceScore = run.trace.every((step) => step.status === 'done' || step.status === 'needs_approval') ? 18 : 0
  const citationScore = Math.min(run.citations.length * 6, 12)
  const toolScore = Math.min(run.usedTools.length * 5, 15)

  return Math.min(100, run.confidence + traceScore + citationScore + toolScore - 28)
}
