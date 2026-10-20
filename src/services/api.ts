import type {
  AgentRun,
  BusinessRecord,
  KnowledgeDocument,
  RuntimeConfig,
  Scenario,
  ScenarioId,
  ToolDefinition,
} from '@/types/workbench'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

async function uploadRequest<T>(path: string, body: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Upload failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function fetchWorkbenchBootstrap() {
  const [config, scenarios, knowledgeDocuments, tools, businessRecords, runs] = await Promise.all([
    request<RuntimeConfig>('/config'),
    request<Scenario[]>('/scenarios'),
    request<KnowledgeDocument[]>('/knowledge'),
    request<ToolDefinition[]>('/tools'),
    request<BusinessRecord[]>('/business-records'),
    request<AgentRun[]>('/runs'),
  ])

  return {
    config,
    scenarios,
    knowledgeDocuments,
    tools,
    businessRecords,
    runs,
  }
}

export async function createAgentRun(scenarioId: ScenarioId, prompt: string) {
  return request<AgentRun>('/runs', {
    method: 'POST',
    body: JSON.stringify({ scenarioId, prompt }),
  })
}

export async function uploadKnowledgeDocument(file: File, scope: string, owner: string) {
  const body = new FormData()
  body.append('file', file)
  body.append('scope', scope)
  body.append('owner', owner)

  return uploadRequest<KnowledgeDocument>('/knowledge/upload', body)
}
