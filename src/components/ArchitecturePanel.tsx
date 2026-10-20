import { Network } from 'lucide-react'

import { Section } from '@/components/Section'

const layers = [
  {
    title: 'Web 工作台',
    detail: '场景选择、会话、trace、工具中心',
    color: 'border-ocean text-ocean',
  },
  {
    title: 'Agent 编排',
    detail: 'LangGraph 思路：计划、检索、工具、审批',
    color: 'border-moss text-moss',
  },
  {
    title: '能力层',
    detail: 'RAG / Rerank / Tool Registry / Guardrail',
    color: 'border-amber text-amber',
  },
  {
    title: '业务系统',
    detail: 'CRM、ERP、WMS、邮件、报表',
    color: 'border-clay text-clay',
  },
]

export function ArchitecturePanel() {
  return (
    <Section
      icon={Network}
      title="技术架构"
      description="这个图是面试讲解顺序：从用户请求一路讲到业务系统和审计。"
    >
      <div className="grid gap-3 md:grid-cols-4">
        {layers.map((layer, index) => (
          <div key={layer.title} className={`relative rounded-lg border bg-[#fbfcf8] p-3 ${layer.color}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-md bg-white px-2 py-1 font-mono text-[11px] font-semibold">
                L{index + 1}
              </span>
              {index < layers.length - 1 ? (
                <span className="hidden text-xs text-muted md:block">{'->'}</span>
              ) : null}
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">{layer.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{layer.detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-line bg-[#fbfcf8] p-3">
        <p className="text-xs font-semibold text-[#4d594c]">后端真实化路线</p>
        <p className="mt-1 text-xs leading-6 text-muted">
          FastAPI 承接 API，PostgreSQL 存元数据和审计，Redis 存运行状态，Qdrant/pgvector 做向量检索，后续接 MCP Server 暴露企业工具。
        </p>
      </div>
    </Section>
  )
}
