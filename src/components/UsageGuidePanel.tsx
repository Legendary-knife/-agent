import { Code2, MousePointerClick } from 'lucide-react'

import { Section } from '@/components/Section'

const userSteps = [
  '选业务场景',
  '改业务问题',
  '运行 Agent',
  '看输出和 Trace',
  '复制审批或跟进建议',
]

const developerSteps = [
  '改 backend/app/data.py 增加数据',
  '改 agent_service.py 增加判断逻辑',
  '改 src/services/api.ts 对接接口',
  '改组件展示新字段',
  '补前后端测试',
]

export function UsageGuidePanel() {
  return (
    <Section
      icon={MousePointerClick}
      title="怎么使用"
      description="这个 Demo 分两种人看：业务使用人员看流程，开发人员看扩展点。"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <GuideCard
          icon={MousePointerClick}
          title="使用人员"
          description="把它当成企业内部 Agent 工作台。"
          steps={userSteps}
        />
        <GuideCard
          icon={Code2}
          title="开发人员"
          description="把它当成可继续接真实系统的工程骨架。"
          steps={developerSteps}
        />
      </div>
    </Section>
  )
}

interface GuideCardProps {
  icon: typeof MousePointerClick
  title: string
  description: string
  steps: string[]
}

function GuideCard({ icon: Icon, title, description, steps }: GuideCardProps) {
  return (
    <div className="rounded-lg border border-line bg-[#fbfcf8] p-3">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-white text-moss">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="text-xs leading-5 text-muted">{description}</p>
        </div>
      </div>
      <ol className="mt-3 space-y-2">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-2 text-xs leading-5 text-[#4d594c]">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white font-mono text-[10px] font-semibold text-moss">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}
