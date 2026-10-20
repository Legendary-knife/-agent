import { create } from 'zustand'

import { runAgentScenario } from '@/features/agent/agentSimulator'
import { scenarios } from '@/services/demoData'
import type { AgentRun, ScenarioId } from '@/types/workbench'

interface WorkbenchState {
  activeScenarioId: ScenarioId
  prompt: string
  isRunning: boolean
  runs: AgentRun[]
  setScenario: (scenarioId: ScenarioId) => void
  setPrompt: (prompt: string) => void
  runActiveScenario: () => void
}

export const useWorkbenchStore = create<WorkbenchState>((set, get) => ({
  activeScenarioId: 'knowledge',
  prompt: scenarios[0].prompt,
  isRunning: false,
  runs: [],
  setScenario: (scenarioId) => {
    const scenario = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0]
    set({
      activeScenarioId: scenario.id,
      prompt: scenario.prompt,
    })
  },
  setPrompt: (prompt) => set({ prompt }),
  runActiveScenario: () => {
    const { activeScenarioId, prompt } = get()
    const scenario = scenarios.find((item) => item.id === activeScenarioId) ?? scenarios[0]

    set({ isRunning: true })
    window.setTimeout(() => {
      const run = runAgentScenario(scenario, prompt)
      set((state) => ({
        runs: [run, ...state.runs].slice(0, 8),
        isRunning: false,
      }))
    }, 620)
  },
}))
