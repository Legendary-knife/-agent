import { useEffect, useState } from 'react'
import { Gauge, Loader2, SearchCheck } from 'lucide-react'

import { Section } from '@/components/Section'
import { inspectRagRetrieval } from '@/services/api'
import { useWorkbenchStore } from '@/store/useWorkbenchStore'
import type { RagInspectResponse } from '@/types/workbench'
import { cn } from '@/utils/cn'

const qualityText: Record<RagInspectResponse['quality'], string> = {
  strong: '强',
  usable: '可用',
  weak: '偏弱',
  missing: '未命中',
}

export function RagInspectorPanel() {
  const prompt = useWorkbenchStore((state) => state.prompt)
  const [query, setQuery] = useState(prompt)
  const [scope, setScope] = useState('all')
  const [result, setResult] = useState<RagInspectResponse | null>(null)
  const [isInspecting, setIsInspecting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setQuery(prompt)
  }, [prompt])

  const runInspection = async () => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery || isInspecting) {
      return
    }

    setIsInspecting(true)
    setError('')
    try {
      const data = await inspectRagRetrieval(trimmedQuery, scope, 5)
      setResult(data)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'RAG 诊断失败')
    } finally {
      setIsInspecting(false)
    }
  }

  return (
    <Section
      icon={SearchCheck}
      title="RAG 诊断台"
      description="运行 Agent 前先看检索质量，定位是资料不够、问题太泛，还是召回排序不准。"
      action={
        result ? (
          <span
            className={cn(
              'rounded-md px-2 py-1 text-[11px] font-semibold',
              result.quality === 'strong'
                ? 'bg-[#eef7f1] text-moss'
                : result.quality === 'usable'
                  ? 'bg-[#fff8ec] text-[#8a5a12]'
                  : 'bg-[#fff2ee] text-clay',
            )}
          >
            质量：{qualityText[result.quality]}
          </span>
        ) : null
      }
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_auto]">
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          rows={3}
          className="min-h-[88px] resize-none rounded-md border border-line bg-[#fbfcf8] px-3 py-2 text-sm leading-6 text-ink outline-none transition focus:border-moss focus:ring-2 focus:ring-[#d7efdd]"
        />
        <select
          value={scope}
          onChange={(event) => setScope(event.target.value)}
          className="h-10 rounded-md border border-line bg-white px-3 text-xs font-semibold text-[#4d594c] outline-none focus:border-moss"
        >
          <option value="all">全部资料</option>
          <option value="product">产品资料</option>
          <option value="policy">制度政策</option>
          <option value="sales">销售资料</option>
          <option value="supply">供应链</option>
        </select>
        <button
          type="button"
          onClick={() => void runInspection()}
          disabled={isInspecting || query.trim().length === 0}
          className={cn(
            'inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold text-white transition',
            isInspecting || query.trim().length === 0 ? 'bg-[#9aa89b]' : 'bg-ocean hover:bg-[#285d71]',
          )}
        >
          {isInspecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gauge className="h-3.5 w-3.5" />}
          诊断检索
        </button>
      </div>

      {error ? <div className="mt-3 rounded-md border border-[#f0d6c8] bg-[#fff7f2] p-3 text-xs text-clay">{error}</div> : null}

      {result ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="候选 chunk" value={String(result.candidateCount)} />
            <Metric label="返回结果" value={String(result.results.length)} />
            <Metric label="资料范围" value={result.scope === 'all' ? '全部' : result.scope} />
          </div>
          <div className="rounded-md border border-line bg-[#fbfcf8] p-3 text-xs leading-5 text-[#4d594c]">
            {result.recommendation}
          </div>
          <div className="space-y-2">
            {result.results.map((item) => (
              <div key={item.id} className="rounded-lg border border-line bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{item.documentTitle}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      chunk #{item.chunkIndex} / {item.type} / {item.scope}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center font-mono text-[11px]">
                    <Score label="综合" value={item.combinedScore} />
                    <Score label="向量" value={item.vectorScore} />
                    <Score label="关键词" value={item.keywordCoverage} />
                  </div>
                </div>
                {item.matchedTerms.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.matchedTerms.map((term) => (
                      <span key={term} className="rounded bg-[#eff4ea] px-1.5 py-0.5 text-[11px] text-[#4f6044]">
                        {term}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="mt-3 line-clamp-3 text-xs leading-6 text-[#30382f]">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-line bg-[#fbfcf8] p-4 text-sm leading-6 text-muted">
          输入问题后点击诊断，系统会先跑检索，不调用大模型，适合排查知识库是否真的能命中。
        </div>
      )}
    </Section>
  )
}

interface MetricProps {
  label: string
  value: string
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-md border border-line bg-white p-3">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-ink">{value}</p>
    </div>
  )
}

interface ScoreProps {
  label: string
  value: number
}

function Score({ label, value }: ScoreProps) {
  return (
    <div className="rounded-md bg-[#f2f2e8] px-2 py-1">
      <p className="text-[10px] text-muted">{label}</p>
      <p className="text-[#30382f]">{value.toFixed(2)}</p>
    </div>
  )
}
