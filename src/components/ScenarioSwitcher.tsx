import { CheckCircle2 } from 'lucide-react'

import type { Scenario, ScenarioId } from '@/types/workbench'
import { cn } from '@/utils/cn'

interface ScenarioSwitcherProps {
  scenarios: Scenario[]
  activeScenarioId: ScenarioId
  onChange: (scenarioId: ScenarioId) => void
}

export function ScenarioSwitcher({ scenarios, activeScenarioId, onChange }: ScenarioSwitcherProps) {
  return (
    <div className="grid gap-2">
      {scenarios.map((scenario) => {
        const isActive = scenario.id === activeScenarioId

        return (
          <button
            key={scenario.id}
            type="button"
            onClick={() => onChange(scenario.id)}
            className={cn(
              'w-full rounded-lg border p-3 text-left transition',
              isActive
                ? 'border-moss bg-[#f2fbf5] shadow-sm'
                : 'border-line bg-white hover:border-[#b7c6b5] hover:bg-[#fbfcf8]',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-ink">{scenario.name}</span>
              {isActive ? <CheckCircle2 className="h-4 w-4 text-moss" /> : null}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">{scenario.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {scenario.tags.map((tag) => (
                <span key={tag} className="rounded-md border border-line bg-[#f8f8f0] px-2 py-1 text-[11px] font-medium text-[#5d664f]">
                  {tag}
                </span>
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}
