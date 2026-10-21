import { create } from 'zustand'

import {
  createAgentRun,
  fetchWorkbenchBootstrap,
  importKnowledgeDocumentByPath,
  uploadKnowledgeDocument,
} from '@/services/api'
import type {
  AgentRun,
  BusinessRecord,
  KnowledgeDocument,
  RuntimeConfig,
  Scenario,
  ScenarioId,
  ToolDefinition,
} from '@/types/workbench'

interface WorkbenchState {
  activeScenarioId: ScenarioId
  prompt: string
  isLoading: boolean
  isRunning: boolean
  isUploading: boolean
  error: string | null
  config: RuntimeConfig | null
  scenarios: Scenario[]
  knowledgeDocuments: KnowledgeDocument[]
  tools: ToolDefinition[]
  businessRecords: BusinessRecord[]
  runs: AgentRun[]
  loadWorkbench: () => Promise<void>
  uploadDocument: (file: File, scope: string, owner: string) => Promise<KnowledgeDocument>
  importDocumentByPath: (filePath: string, scope: string, owner: string) => Promise<KnowledgeDocument>
  setScenario: (scenarioId: ScenarioId) => void
  setPrompt: (prompt: string) => void
  runActiveScenario: () => Promise<void>
}

export const useWorkbenchStore = create<WorkbenchState>((set, get) => ({
  activeScenarioId: 'knowledge',
  prompt: '',
  isLoading: false,
  isRunning: false,
  isUploading: false,
  error: null,
  config: null,
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
  uploadDocument: async (file, scope, owner) => {
    set({ isUploading: true, error: null })

    try {
      const document = await uploadKnowledgeDocument(file, scope, owner)
      set((state) => ({
        knowledgeDocuments: [document, ...state.knowledgeDocuments.filter((item) => item.id !== document.id)],
        isUploading: false,
      }))
      return document
    } catch (error) {
      const message = error instanceof Error ? error.message : '知识库上传失败'
      set({
        error: message,
        isUploading: false,
      })
      throw new Error(message)
    }
  },
  importDocumentByPath: async (filePath, scope, owner) => {
    set({ isUploading: true, error: null })

    try {
      const document = await importKnowledgeDocumentByPath(filePath, scope, owner)
      set((state) => ({
        knowledgeDocuments: [document, ...state.knowledgeDocuments.filter((item) => item.id !== document.id)],
        isUploading: false,
      }))
      return document
    } catch (error) {
      const message = error instanceof Error ? error.message : '知识库路径导入失败'
      set({
        error: message,
        isUploading: false,
      })
      throw new Error(message)
    }
  },
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
