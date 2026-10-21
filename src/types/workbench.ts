export type ScenarioId = 'knowledge' | 'sales' | 'supply'

export type RunStatus = 'idle' | 'running' | 'done' | 'needs_approval'

export type ToolCategory = 'CRM' | 'ERP' | 'WMS' | 'Email' | 'Knowledge' | 'Report'

export interface Scenario {
  id: ScenarioId
  name: string
  shortName: string
  description: string
  prompt: string
  businessValue: string
  tags: string[]
}

export interface KnowledgeDocument {
  id: string
  title: string
  type: string
  scope: string
  chunks: number
  owner: string
  updatedAt: string
  source: 'demo' | 'upload' | string
  filePath?: string | null
  textPath?: string | null
  gitSyncStatus?: 'synced' | 'skipped' | 'failed' | null
  gitSyncMessage?: string | null
}

export interface ToolDefinition {
  id: string
  name: string
  category: ToolCategory
  description: string
  schema: string
  riskLevel: 'low' | 'medium' | 'high'
  enabled: boolean
}

export interface BusinessRecord {
  id: string
  source: 'CRM' | 'ERP' | 'WMS'
  title: string
  status: string
  owner: string
  value: string
}

export interface AgentTraceStep {
  id: string
  title: string
  detail: string
  kind: 'plan' | 'rag' | 'tool' | 'approval' | 'answer'
  status: RunStatus
  evidence?: string
}

export interface AgentRun {
  id: string
  scenarioId: ScenarioId
  userPrompt: string
  answer: string
  confidence: number
  citations: string[]
  usedTools: string[]
  trace: AgentTraceStep[]
  createdAt: string
}

export interface WorkbenchMetric {
  label: string
  value: string
  hint: string
}

export interface RuntimeConfig {
  llmConfigured: boolean
  llmBaseUrl: string
  llmModel: string
  ragTopK: number
}

export interface RagInspectResult {
  id: string
  documentId: string
  documentTitle: string
  chunkIndex: number
  content: string
  scope: string
  type: string
  owner: string
  updatedAt: string
  vectorScore: number
  keywordCoverage: number
  combinedScore: number
  matchedTerms: string[]
}

export interface RagInspectResponse {
  query: string
  scope: string
  topK: number
  candidateCount: number
  quality: 'strong' | 'usable' | 'weak' | 'missing'
  recommendation: string
  results: RagInspectResult[]
}
