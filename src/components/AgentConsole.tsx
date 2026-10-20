import { Bot, ClipboardList, FileText, Loader2, Play, Quote, ShieldCheck, Wrench } from 'lucide-react'

import { estimateReadiness } from '@/features/agent/agentSimulator'
import { scenarios } from '@/services/demoData'
import { useWorkbenchStore } from '@/store/useWorkbenchStore'
import { TraceTimeline } from '@/components/TraceTimeline'
import { cn } from '@/utils/cn'

export function AgentConsole() {
  const activeScenarioId = useWorkbenchStore((state) => state.activeScenarioId)
  const prompt = useWorkbenchStore((state) => state.prompt)
  const isRunning = useWorkbenchStore((state) => state.isRunning)
  const runs = useWorkbenchStore((state) => state.runs)
  const setPrompt = useWorkbenchStore((state) => state.setPrompt)
  const runActiveScenario = useWorkbenchStore((state) => state.runActiveScenario)

  const scenario = scenarios.find((item) => item.id === activeScenarioId) ?? scenarios[0]
  const latestRun = runs.find((run) => run.scenarioId === activeScenarioId) ?? runs[0] ?? null
  const readiness = estimateReadiness(latestRun)

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-[#eef7f1] text-moss">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-ink">Agent 运行台</h1>
                <p className="text-xs leading-5 text-muted">{scenario.businessValue}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-[#fbfcf8] px-3 py-2">
            <p className="text-[11px] font-medium text-muted">面试展示完整度</p>
            <p className="font-mono text-lg font-semibold text-ink">{readiness}%</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-line bg-[#fbfcf8] p-3">
          <label htmlFor="agent-prompt" className="text-xs font-semibold text-[#4d594c]">
            业务问题
          </label>
          <textarea
            id="agent-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
            className="mt-2 w-full resize-none rounded-md border border-line bg-white px-3 py-2 text-sm leading-6 text-ink outline-none transition focus:border-moss focus:ring-2 focus:ring-[#d7efdd]"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {scenario.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-[#eff4ea] px-2 py-1 text-[11px] font-medium text-[#4f6044]">
                  {tag}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={runActiveScenario}
              disabled={isRunning || prompt.trim().length === 0}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white transition',
                isRunning || prompt.trim().length === 0 ? 'bg-[#9aa89b]' : 'bg-moss hover:bg-[#255b42]',
              )}
            >
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isRunning ? '运行中' : '运行 Agent'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <SignalCard icon={FileText} label="RAG" value="带引用回答" />
          <SignalCard icon={Wrench} label="Tools" value="统一 schema" />
          <SignalCard icon={ShieldCheck} label="Guardrail" value="高风险人审" />
        </div>

        <div className="mt-4 rounded-lg border border-line bg-white p-4">
          <div className="flex items-center gap-2">
            <Quote className="h-4 w-4 text-moss" />
            <h2 className="text-sm font-semibold text-ink">Agent 输出</h2>
          </div>
          {latestRun ? (
            <div className="mt-3 space-y-4">
              <p className="text-sm leading-7 text-[#30382f]">{latestRun.answer}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <ResultBlock title="引用来源" items={latestRun.citations} />
                <ResultBlock title="调用工具" items={latestRun.usedTools} />
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-line bg-[#fbfcf8] p-4 text-sm leading-6 text-muted">
              当前还没有运行记录。选择左侧场景后点击运行，系统会模拟 RAG、工具调用和审批校验链路。
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-moss" />
          <h2 className="text-sm font-semibold text-ink">执行 Trace</h2>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted">面试时重点讲这里：Agent 不是黑盒，每一步都有证据。</p>
        <div className="mt-4">
          <TraceTimeline trace={latestRun?.trace ?? []} />
        </div>
      </section>
    </div>
  )
}

interface SignalCardProps {
  icon: typeof FileText
  label: string
  value: string
}

function SignalCard({ icon: Icon, label, value }: SignalCardProps) {
  return (
    <div className="rounded-lg border border-line bg-[#fbfcf8] p-3">
      <Icon className="h-4 w-4 text-moss" />
      <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  )
}

interface ResultBlockProps {
  title: string
  items: string[]
}

function ResultBlock({ title, items }: ResultBlockProps) {
  return (
    <div className="rounded-lg border border-line bg-[#fbfcf8] p-3">
      <p className="text-xs font-semibold text-[#4d594c]">{title}</p>
      <div className="mt-2 space-y-1.5">
        {items.map((item) => (
          <div key={item} className="rounded-md bg-white px-2 py-1.5 text-xs leading-5 text-[#30382f]">
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
