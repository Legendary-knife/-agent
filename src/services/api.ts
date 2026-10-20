import type {
  AgentRun,
  BusinessRecord,
  KnowledgeDocument,
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

export async function fetchWorkbenchBootstrap() {
  const [scenarios, knowledgeDocuments, tools, businessRecords, runs] = await Promise.all([
    request<Scenario[]>('/scenarios'),
    request<KnowledgeDocument[]>('/knowledge'),
    request<ToolDefinition[]>('/tools'),
    request<BusinessRecord[]>('/business-records'),
    request<AgentRun[]>('/runs'),
  ])

  return {
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
