import type {
  BusinessRecord,
  KnowledgeDocument,
  Scenario,
  ToolDefinition,
  WorkbenchMetric,
} from '@/types/workbench'

export const scenarios: Scenario[] = [
  {
    id: 'knowledge',
    name: '企业知识库 Agent',
    shortName: '知识库',
    description: '基于制度、合同、产品资料做 RAG 问答，回答必须带来源引用。',
    prompt: '帮我查一下海外渠道商是否能申请账期，并说明需要哪些审批材料。',
    businessValue: '把散落文档变成可追溯的业务问答入口',
    tags: ['RAG', 'Rerank', '引用溯源'],
  },
  {
    id: 'sales',
    name: '外贸销售 Agent',
    shortName: '外贸销售',
    description: '读取产品资料和客户记录，生成客户分级、开发信和 CRM 跟进动作。',
    prompt: '给德国汽车零部件客户生成一份开发计划，并写一封英文开发信。',
    businessValue: '把销售调研、话术和 CRM 记录串成半自动流程',
    tags: ['CRM', '邮件草稿', '客户分级'],
  },
  {
    id: 'supply',
    name: '供应链 Agent',
    shortName: '供应链',
    description: '查询订单、库存和供应商信息，识别缺货风险并生成采购建议。',
    prompt: '本周 A100 控制器是否有缺货风险？如果有，给出采购建议和审批理由。',
    businessValue: '把 ERP/WMS 数据转成采购动作和可审批建议',
    tags: ['ERP', 'WMS', '采购建议'],
  },
]

export const knowledgeDocuments: KnowledgeDocument[] = [
  {
    id: 'doc-policy-001',
    title: '海外渠道商账期政策',
    type: 'PDF',
    scope: 'policy',
    chunks: 42,
    owner: '财务运营',
    updatedAt: '2026-10-11',
    source: 'demo',
  },
  {
    id: 'doc-product-018',
    title: 'A100 控制器产品手册',
    type: 'DOCX',
    scope: 'product',
    chunks: 66,
    owner: '产品工程',
    updatedAt: '2026-10-09',
    source: 'demo',
  },
  {
    id: 'doc-sales-011',
    title: '欧洲客户开发话术库',
    type: 'HTML',
    scope: 'sales',
    chunks: 31,
    owner: '海外销售',
    updatedAt: '2026-10-03',
    source: 'demo',
  },
  {
    id: 'doc-supply-027',
    title: '供应商交期与安全库存表',
    type: 'XLSX',
    scope: 'supply',
    chunks: 24,
    owner: '供应链计划',
    updatedAt: '2026-10-15',
    source: 'demo',
  },
]

export const toolDefinitions: ToolDefinition[] = [
  {
    id: 'crm_lookup',
    name: '客户画像查询',
    category: 'CRM',
    description: '按国家、行业、客户阶段读取模拟 CRM 客户记录。',
    schema: 'country, industry, stage -> account_profile[]',
    riskLevel: 'low',
    enabled: true,
  },
  {
    id: 'erp_order_check',
    name: '订单风险查询',
    category: 'ERP',
    description: '读取未交付订单、交付日期和订单金额。',
    schema: 'sku, date_range -> open_order[]',
    riskLevel: 'medium',
    enabled: true,
  },
  {
    id: 'wms_inventory_check',
    name: '库存水位查询',
    category: 'WMS',
    description: '查询 SKU 库存、在途数量和安全库存。',
    schema: 'sku -> stock_level, inbound_qty, safety_stock',
    riskLevel: 'medium',
    enabled: true,
  },
  {
    id: 'email_draft',
    name: '邮件草稿生成',
    category: 'Email',
    description: '根据客户画像、产品卖点和语气生成销售邮件。',
    schema: 'account_profile, product, tone -> email_draft',
    riskLevel: 'low',
    enabled: true,
  },
  {
    id: 'approval_report',
    name: '审批材料生成',
    category: 'Report',
    description: '把 Agent 结论转换成采购或账期审批摘要。',
    schema: 'decision, evidence[] -> approval_brief',
    riskLevel: 'high',
    enabled: true,
  },
]

export const businessRecords: BusinessRecord[] = [
  {
    id: 'crm-1001',
    source: 'CRM',
    title: 'Bavaria Motion GmbH',
    status: '技术评估中',
    owner: 'Lena',
    value: '预计年采购 48 万欧元',
  },
  {
    id: 'erp-2044',
    source: 'ERP',
    title: 'A100 控制器未交付订单',
    status: '本周需交付 1,280 件',
    owner: '订单运营',
    value: '合同金额 312 万元',
  },
  {
    id: 'wms-7731',
    source: 'WMS',
    title: 'A100 华东仓库存',
    status: '现货 420 件 / 在途 300 件',
    owner: '仓储计划',
    value: '安全库存 900 件',
  },
]

export const workbenchMetrics: WorkbenchMetric[] = [
  {
    label: '知识文档',
    value: '4',
    hint: '已切分 163 个 chunk',
  },
  {
    label: '可调用工具',
    value: '5',
    hint: '覆盖 CRM / ERP / WMS',
  },
  {
    label: '演示场景',
    value: '3',
    hint: '知识库、外贸、供应链',
  },
  {
    label: '审计链路',
    value: '100%',
    hint: '每次运行保留 trace',
  },
]
