import { useEffect } from 'react'
import { Activity, Bot, Database, FileSearch, Layers3, LockKeyhole, Loader2, PlugZap } from 'lucide-react'

import { AgentConsole } from '@/components/AgentConsole'
import { ArchitecturePanel } from '@/components/ArchitecturePanel'
import { BusinessSystemsPanel } from '@/components/BusinessSystemsPanel'
import { KnowledgePanel } from '@/components/KnowledgePanel'
import { MetricCard } from '@/components/MetricCard'
import { RoadmapPanel } from '@/components/RoadmapPanel'
import { ScenarioSwitcher } from '@/components/ScenarioSwitcher'
import { ToolRegistry } from '@/components/ToolRegistry'
import { useWorkbenchStore } from '@/store/useWorkbenchStore'

const metricIcons = [FileSearch, PlugZap, Layers3, LockKeyhole]

export default function Home() {
  const activeScenarioId = useWorkbenchStore((state) => state.activeScenarioId)
  const scenarios = useWorkbenchStore((state) => state.scenarios)
  const knowledgeDocuments = useWorkbenchStore((state) => state.knowledgeDocuments)
  const tools = useWorkbenchStore((state) => state.tools)
  const businessRecords = useWorkbenchStore((state) => state.businessRecords)
  const setScenario = useWorkbenchStore((state) => state.setScenario)
  const isLoading = useWorkbenchStore((state) => state.isLoading)
  const loadWorkbench = useWorkbenchStore((state) => state.loadWorkbench)
  const runs = useWorkbenchStore((state) => state.runs)
  const chunkCount = knowledgeDocuments.reduce((sum, document) => sum + document.chunks, 0)
  const metrics = [
    { label: '知识文档', value: String(knowledgeDocuments.length), hint: `已切分 ${chunkCount} 个 chunk` },
    { label: '可调用工具', value: String(tools.length), hint: '覆盖 CRM / ERP / WMS' },
    { label: '演示场景', value: String(scenarios.length), hint: '知识库、外贸、供应链' },
    { label: '审计链路', value: '100%', hint: '每次运行保留 trace' },
  ]

  useEffect(() => {
    void loadWorkbench()
  }, [loadWorkbench])

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex min-h-16 max-w-[1520px] flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-moss text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight">企业 AI Agent 工作台</h1>
                <span className="rounded-md bg-[#eef7f1] px-2 py-1 text-[11px] font-semibold text-moss">
                  Interview MVP
                </span>
              </div>
              <p className="text-xs leading-5 text-muted">RAG、工具调用、工作流编排、业务系统模拟与审计观测</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <HeaderPill icon={Database} text="Mock CRM / ERP / WMS" />
            <HeaderPill icon={Activity} text={`${runs.length} runs`} />
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="mx-auto max-w-[1520px] px-4 py-4 lg:px-6">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-white p-4 text-sm text-muted shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-moss" />
            正在连接 FastAPI 后端并加载工作台数据
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[1520px] gap-4 px-4 py-4 lg:px-6 xl:grid-cols-[320px_minmax(0,1fr)_390px]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">演示场景</h2>
                <p className="mt-1 text-xs leading-5 text-muted">这三个场景对应招聘岗责里的企业落地关键词。</p>
              </div>
              <span className="rounded-md bg-[#f2f2e8] px-2 py-1 text-[11px] font-semibold text-[#5d664f]">
                {scenarios.length} 个
              </span>
            </div>
            <div className="mt-4">
              <ScenarioSwitcher scenarios={scenarios} activeScenarioId={activeScenarioId} onChange={setScenario} />
            </div>
          </section>
          <RoadmapPanel />
        </aside>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {metrics.map((metric, index) => (
              <MetricCard
                key={metric.label}
                icon={metricIcons[index]}
                label={metric.label}
                value={metric.value}
                hint={metric.hint}
              />
            ))}
          </div>
          <AgentConsole />
          <ArchitecturePanel />
        </div>

        <aside className="space-y-4">
          <KnowledgePanel documents={knowledgeDocuments} />
          <ToolRegistry tools={tools} />
          <BusinessSystemsPanel records={businessRecords} />
        </aside>
      </div>
    </main>
  )
}

interface HeaderPillProps {
  icon: typeof Database
  text: string
}

function HeaderPill({ icon: Icon, text }: HeaderPillProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-line bg-[#fbfcf8] px-3 py-2 text-xs font-medium text-[#4d594c]">
      <Icon className="h-4 w-4 text-moss" />
      {text}
    </div>
  )
}
