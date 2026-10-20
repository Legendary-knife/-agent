import { AlertTriangle, CircleDot, Database, FileSearch, GitBranch, ShieldCheck, Wrench } from 'lucide-react'

import type { AgentTraceStep } from '@/types/workbench'
import { cn } from '@/utils/cn'

const iconByKind = {
  plan: GitBranch,
  rag: FileSearch,
  tool: Wrench,
  approval: ShieldCheck,
  answer: Database,
} satisfies Record<AgentTraceStep['kind'], typeof CircleDot>

interface TraceTimelineProps {
  trace: AgentTraceStep[]
}

export function TraceTimeline({ trace }: TraceTimelineProps) {
  return (
    <div className="space-y-3">
      {trace.map((step, index) => {
        const Icon = iconByKind[step.kind]
        const isApproval = step.status === 'needs_approval'

        return (
          <div key={step.id} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
            <div className="relative flex justify-center">
              <div
                className={cn(
                  'z-10 grid h-7 w-7 place-items-center rounded-full border bg-white',
                  isApproval ? 'border-amber text-amber' : 'border-moss text-moss',
                )}
              >
                {isApproval ? <AlertTriangle className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              {index < trace.length - 1 ? <div className="absolute top-7 h-[calc(100%+12px)] w-px bg-line" /> : null}
            </div>
            <div className="rounded-lg border border-line bg-[#fbfcf8] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">{step.title}</p>
                <span
                  className={cn(
                    'rounded-md px-2 py-1 text-[11px] font-semibold',
                    isApproval ? 'bg-[#fff7e8] text-amber' : 'bg-[#eef7f1] text-moss',
                  )}
                >
                  {isApproval ? '需人审' : '完成'}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">{step.detail}</p>
              {step.evidence ? (
                <div className="mt-2 rounded-md border border-line bg-white px-2 py-1.5 font-mono text-[11px] leading-5 text-[#4c574b]">
                  {step.evidence}
                </div>
              ) : null}
            </div>
          </div>
        )
      })}
      {trace.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-[#fbfcf8] p-4 text-sm text-muted">
          运行一个场景后，这里会显示 Agent 的任务拆解、RAG 命中、工具调用和审批校验。
        </div>
      ) : null}
    </div>
  )
}
