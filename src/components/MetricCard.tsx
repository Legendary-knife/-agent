import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: string
  hint: string
}

export function MetricCard({ icon: Icon, label, value, hint }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-[#eef7f1] text-moss">
          <Icon className="h-4 w-4" />
        </div>
        <span className="font-mono text-xl font-semibold text-ink">{value}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-ink">{label}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{hint}</p>
    </div>
  )
}
