import { DatabaseZap } from 'lucide-react'

import { Section } from '@/components/Section'
import type { BusinessRecord } from '@/types/workbench'
import { cn } from '@/utils/cn'

const sourceStyle = {
  CRM: 'bg-[#eef6fb] text-ocean',
  ERP: 'bg-[#fff7e8] text-amber',
  WMS: 'bg-[#eef7f1] text-moss',
}

interface BusinessSystemsPanelProps {
  records: BusinessRecord[]
}

export function BusinessSystemsPanel({ records }: BusinessSystemsPanelProps) {
  return (
    <Section
      icon={DatabaseZap}
      title="业务系统模拟"
      description="用 mock 系统证明你理解 ERP、WMS、CRM 集成边界。"
    >
      <div className="space-y-2">
        {records.map((record) => (
          <div key={record.id} className="rounded-lg border border-line bg-[#fbfcf8] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">{record.title}</p>
              <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold', sourceStyle[record.source])}>
                {record.source}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted">{record.status}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#4d594c]">
              <span>{record.owner}</span>
              <span className="font-semibold">{record.value}</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
