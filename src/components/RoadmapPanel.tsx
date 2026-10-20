import { Milestone } from 'lucide-react'

import { Section } from '@/components/Section'

const steps = [
  {
    stage: 'MVP',
    title: '本地演示闭环',
    detail: '三类场景、RAG 引用、工具调用、trace 留存。',
  },
  {
    stage: 'V1',
    title: '接入真实后端',
    detail: 'FastAPI、PostgreSQL、Redis、pgvector、文件解析队列。',
  },
  {
    stage: 'V2',
    title: '企业级增强',
    detail: 'MCP 工具市场、权限隔离、评测集、运行观测。',
  },
]

export function RoadmapPanel() {
  return (
    <Section icon={Milestone} title="开发路线" description="给招聘方看的不是功能堆砌，而是可迭代的工程路线。">
      <div className="grid gap-2">
        {steps.map((step) => (
          <div key={step.stage} className="rounded-lg border border-line bg-[#fbfcf8] p-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-white px-2 py-1 font-mono text-[11px] font-semibold text-moss">
                {step.stage}
              </span>
              <p className="text-sm font-semibold text-ink">{step.title}</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">{step.detail}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
