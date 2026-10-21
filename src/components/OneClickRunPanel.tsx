import { useState } from 'react'
import { CheckCircle2, Loader2, PlayCircle, XCircle } from 'lucide-react'

import { Section } from '@/components/Section'
import { createAgentRun, inspectRagRetrieval } from '@/services/api'
import { useWorkbenchStore } from '@/store/useWorkbenchStore'
import type { AgentRun, RagInspectResponse } from '@/types/workbench'
import { cn } from '@/utils/cn'

type StepState = 'idle' | 'running' | 'done' | 'failed'

interface FlowStep {
  title: string
  detail: string
  state: StepState
}

const initialSteps: FlowStep[] = [
  { title: '检查知识库', detail: '确认已经有可检索文档', state: 'idle' },
  { title: '诊断 RAG', detail: '检查问题能不能命中文档片段', state: 'idle' },
  { title: '运行 Agent', detail: '生成带引用和 Trace 的回答', state: 'idle' },
]

export function OneClickRunPanel() {
  const activeScenarioId = useWorkbenchStore((state) => state.activeScenarioId)
  const prompt = useWorkbenchStore((state) => state.prompt)
  const knowledgeDocuments = useWorkbenchStore((state) => state.knowledgeDocuments)
  const [steps, setSteps] = useState(initialSteps)
  const [isRunning, setIsRunning] = useState(false)
  const [inspectResult, setInspectResult] = useState<RagInspectResponse | null>(null)
  const [runResult, setRunResult] = useState<AgentRun | null>(null)
  const [error, setError] = useState('')

  const updateStep = (index: number, state: StepState, detail?: string) => {
    setSteps((current) =>
      current.map((step, stepIndex) => (stepIndex === index ? { ...step, state, detail: detail ?? step.detail } : step)),
    )
  }

  const runAll = async () => {
    if (isRunning) {
      return
    }

    setIsRunning(true)
    setError('')
    setInspectResult(null)
    setRunResult(null)
    setSteps(initialSteps)

    try {
      updateStep(0, 'running')
      const uploadedCount = knowledgeDocuments.filter((item) => item.source === 'upload').length
      if (knowledgeDocuments.length === 0) {
        throw new Error('知识库为空。先在右侧上传一个文件，或用“从路径导入”。')
      }
      updateStep(0, 'done', `当前有 ${knowledgeDocuments.length} 份资料，其中 ${uploadedCount} 份是你上传的`)

      updateStep(1, 'running')
      const inspection = await inspectRagRetrieval(prompt, 'all', 5)
      setInspectResult(inspection)
      if (inspection.results.length === 0) {
        throw new Error('RAG 没有命中文档。换一个更接近资料内容的问题，或继续上传资料。')
      }
      updateStep(1, 'done', `命中 ${inspection.results.length} 个片段，质量：${inspection.quality}`)

      updateStep(2, 'running')
      const run = await createAgentRun(activeScenarioId, prompt)
      setRunResult(run)
      updateStep(2, 'done', `已生成回答，引用 ${run.citations.length} 个来源`)
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : '一键跑通失败'
      setError(message)
      setSteps((current) =>
        current.map((step) => (step.state === 'running' ? { ...step, state: 'failed', detail: message } : step)),
      )
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Section
      icon={PlayCircle}
      title="一键跑通"
      description="不理解流程时先点这里：系统会自动检查知识库、诊断 RAG、运行 Agent。"
      action={
        <button
          type="button"
          onClick={() => void runAll()}
          disabled={isRunning || prompt.trim().length === 0}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-white transition',
            isRunning || prompt.trim().length === 0 ? 'bg-[#9aa89b]' : 'bg-moss hover:bg-[#255b42]',
          )}
        >
          {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
          {isRunning ? '正在跑' : '一键验证'}
        </button>
      }
    >
      <div className="grid gap-2 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.title} className="rounded-lg border border-line bg-[#fbfcf8] p-3">
            <div className="flex items-center gap-2">
              <StepIcon state={step.state} />
              <p className="text-sm font-semibold text-ink">{step.title}</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">{step.detail}</p>
          </div>
        ))}
      </div>

      {error ? <div className="mt-3 rounded-md border border-[#f0d6c8] bg-[#fff7f2] p-3 text-xs text-clay">{error}</div> : null}

      {inspectResult || runResult ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {inspectResult ? (
            <div className="rounded-lg border border-line bg-white p-3">
              <p className="text-xs font-semibold text-[#4d594c]">RAG 命中</p>
              <div className="mt-2 space-y-2">
                {inspectResult.results.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-md bg-[#fbfcf8] px-2 py-2 text-xs leading-5 text-[#30382f]">
                    {item.documentTitle} · 综合分 {item.combinedScore.toFixed(2)}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {runResult ? (
            <div className="rounded-lg border border-line bg-white p-3">
              <p className="text-xs font-semibold text-[#4d594c]">Agent 回答预览</p>
              <p className="mt-2 line-clamp-5 text-xs leading-6 text-[#30382f]">{runResult.answer}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </Section>
  )
}

function StepIcon({ state }: { state: StepState }) {
  if (state === 'running') {
    return <Loader2 className="h-4 w-4 animate-spin text-ocean" />
  }
  if (state === 'done') {
    return <CheckCircle2 className="h-4 w-4 text-moss" />
  }
  if (state === 'failed') {
    return <XCircle className="h-4 w-4 text-clay" />
  }
  return <PlayCircle className="h-4 w-4 text-muted" />
}
