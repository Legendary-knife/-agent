import { describe, expect, it } from 'vitest'

import { estimateReadiness, runAgentScenario } from '@/features/agent/agentSimulator'
import { scenarios } from '@/services/demoData'

describe('agentSimulator', () => {
  it('creates traceable runs with citations and tool calls', () => {
    const scenario = scenarios.find((item) => item.id === 'supply')!
    const run = runAgentScenario(scenario, scenario.prompt)

    expect(run.scenarioId).toBe('supply')
    expect(run.citations.length).toBeGreaterThan(0)
    expect(run.usedTools).toContain('库存水位查询')
    expect(run.trace.map((step) => step.kind)).toEqual(['plan', 'rag', 'tool', 'approval', 'answer'])
  })

  it('raises readiness after a complete run', () => {
    const scenario = scenarios[0]
    const run = runAgentScenario(scenario, scenario.prompt)

    expect(estimateReadiness(null)).toBeLessThan(estimateReadiness(run))
  })
})
