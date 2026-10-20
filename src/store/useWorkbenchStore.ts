import { create } from 'zustand'

import { createAgentRun, fetchWorkbenchBootstrap } from '@/services/api'
import type { AgentRun, BusinessRecord, KnowledgeDocument, Scenario, ScenarioId, ToolDefinition } from '@/types/workbench'

interface WorkbenchState {
  activeScenarioId: ScenarioId
  prompt: string
  isLoading: boolean
  isRunning: boolean
  error: string | null
  scenarios: Scenario[]
  knowledgeDocuments: KnowledgeDocument[]
  tools: ToolDefinition[]
  businessRecords: BusinessRecord[]
  runs: AgentRun[]
  loadWorkbench: () => Promise<void>
  setScenario: (scenarioId: ScenarioId) => void
  setPrompt: (prompt: string) => void
  runActiveScenario: () => Promise<void>
}

export const useWorkbenchStore = create<WorkbenchState>((set, get) => ({
  activeScenarioId: 'knowledge',
  prompt: '',
  isLoading: false,
  isRunning: false,
  error: null,
  scenarios: [],
  knowledgeDocuments: [],
  tools: [],
  businessRecords: [],
  runs: [],
  loadWorkbench: async () => {
    const current = get()
    if (current.isLoading || current.scenarios.length > 0) {
      return
    }

    set({ isLoading: true, error: null })

    try {
      const data = await fetchWorkbenchBootstrap()
      const activeScenario = data.scenarios[0]

      set({
        ...data,
        activeScenarioId: activeScenario?.id ?? 'knowledge',
        prompt: activeScenario?.prompt ?? '',
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '后端接口请求失败',
        isLoading: false,
      })
    }
  },
  setScenario: (scenarioId) => {
    const scenario = get().scenarios.find((item) => item.id === scenarioId)
    set({
      activeScenarioId: scenarioId,
      prompt: scenario?.prompt ?? '',
    })
  },
  setPrompt: (prompt) => set({ prompt }),
  runActiveScenario: async () => {
    const { activeScenarioId, prompt } = get()

    set({ isRunning: true, error: null })

    try {
      const run = await createAgentRun(activeScenarioId, prompt)
      set((state) => ({
        runs: [run, ...state.runs].slice(0, 8),
        isRunning: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Agent 运行失败',
        isRunning: false,
      })
    }
  },
}))
