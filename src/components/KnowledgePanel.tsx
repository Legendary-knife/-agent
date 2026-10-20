import { File, FileSpreadsheet, FileText, Globe2, Library } from 'lucide-react'

import { Section } from '@/components/Section'
import { knowledgeDocuments } from '@/services/demoData'
import type { KnowledgeDocument } from '@/types/workbench'

const iconByType: Record<KnowledgeDocument['type'], typeof File> = {
  PDF: FileText,
  DOCX: File,
  XLSX: FileSpreadsheet,
  HTML: Globe2,
}

export function KnowledgePanel() {
  return (
    <Section
      icon={Library}
      title="知识库"
      description="演示 RAG 的关键不是上传按钮，而是切片、召回、重排和引用。"
    >
      <div className="space-y-2">
        {knowledgeDocuments.map((document) => {
          const Icon = iconByType[document.type]

          return (
            <div key={document.id} className="rounded-lg border border-line bg-[#fbfcf8] p-3">
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-ocean">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink">{document.title}</p>
                    <span className="rounded-md border border-line bg-white px-2 py-0.5 text-[11px] font-medium text-muted">
                      {document.type}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {document.owner} · {document.chunks} chunks · {document.updatedAt}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
