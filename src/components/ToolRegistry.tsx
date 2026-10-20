import { AlertTriangle, PlugZap } from 'lucide-react'

import { Section } from '@/components/Section'
import type { ToolDefinition } from '@/types/workbench'
import { cn } from '@/utils/cn'

const riskLabel = {
  low: '低风险',
  medium: '需记录',
  high: '需审批',
}

interface ToolRegistryProps {
  tools: ToolDefinition[]
}

export function ToolRegistry({ tools }: ToolRegistryProps) {
  return (
    <Section
      icon={PlugZap}
      title="工具中心"
      description="所有外部调用都通过统一 schema、权限白名单和错误处理。"
    >
      <div className="space-y-2">
        {tools.map((tool) => (
          <div key={tool.id} className="rounded-lg border border-line bg-[#fbfcf8] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{tool.name}</p>
                  <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-ocean">
                    {tool.category}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">{tool.description}</p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold',
                  tool.riskLevel === 'high'
                    ? 'bg-[#fff7e8] text-amber'
                    : tool.riskLevel === 'medium'
                      ? 'bg-[#eef6fb] text-ocean'
                      : 'bg-[#eef7f1] text-moss',
                )}
              >
                {riskLabel[tool.riskLevel]}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-md bg-white px-2 py-1.5 font-mono text-[11px] leading-5 text-[#52604f]">
              {tool.riskLevel === 'high' ? <AlertTriangle className="h-3.5 w-3.5 text-amber" /> : null}
              {tool.schema}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
