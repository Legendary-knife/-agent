import { useState } from 'react'
import { File, FileSpreadsheet, FileText, Globe2, Library, Loader2, Upload } from 'lucide-react'

import { Section } from '@/components/Section'
import { useWorkbenchStore } from '@/store/useWorkbenchStore'
import type { KnowledgeDocument } from '@/types/workbench'
import { cn } from '@/utils/cn'

function getIconByType(type: string) {
  const normalized = type.toUpperCase()
  if (normalized === 'PDF') return FileText
  if (normalized === 'DOCX') return File
  if (normalized === 'XLSX' || normalized === 'CSV') return FileSpreadsheet
  if (normalized === 'HTML') return Globe2
  return FileText
}

interface KnowledgePanelProps {
  documents: KnowledgeDocument[]
}

export function KnowledgePanel({ documents }: KnowledgePanelProps) {
  const [scope, setScope] = useState('product')
  const [owner, setOwner] = useState('用户上传')
  const uploadDocument = useWorkbenchStore((state) => state.uploadDocument)
  const isUploading = useWorkbenchStore((state) => state.isUploading)

  const handleUpload = (file: File | undefined) => {
    if (!file || isUploading) {
      return
    }

    void uploadDocument(file, scope, owner)
  }

  return (
    <Section
      icon={Library}
      title="知识库"
      description="上传文档后会落到 SQLite，切分成 chunk，再进入本地检索。"
    >
      <div className="mb-3 rounded-lg border border-line bg-[#fbfcf8] p-3">
        <div className="grid gap-2">
          <label className="text-xs font-semibold text-[#4d594c]" htmlFor="knowledge-upload">
            上传知识文件
          </label>
          <input
            id="knowledge-upload"
            type="file"
            accept=".txt,.md,.csv,.html,.pdf,.docx"
            disabled={isUploading}
            onChange={(event) => handleUpload(event.target.files?.[0])}
            className="w-full rounded-md border border-line bg-white px-2 py-2 text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-moss file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              className="rounded-md border border-line bg-white px-2 py-2 text-xs text-[#4d594c] outline-none focus:border-moss"
            >
              <option value="product">产品资料</option>
              <option value="policy">制度政策</option>
              <option value="sales">销售资料</option>
              <option value="supply">供应链资料</option>
            </select>
            <input
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              placeholder="负责人"
              className="rounded-md border border-line bg-white px-2 py-2 text-xs text-[#4d594c] outline-none focus:border-moss"
            />
          </div>
          <div className="flex items-center gap-2 text-[11px] leading-5 text-muted">
            {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-moss" /> : <Upload className="h-3.5 w-3.5 text-moss" />}
            {isUploading ? '正在解析、切分并写入知识库' : '支持 txt、md、csv、html、pdf、docx'}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {documents.map((document) => {
          const Icon = getIconByType(document.type)

          return (
            <div key={document.id} className="rounded-lg border border-line bg-[#fbfcf8] p-3">
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-ocean">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink">{document.title}</p>
                    <span
                      className={cn(
                        'rounded-md border px-2 py-0.5 text-[11px] font-medium',
                        document.source === 'upload'
                          ? 'border-[#b8dcc5] bg-[#eef7f1] text-moss'
                          : 'border-line bg-white text-muted',
                      )}
                    >
                      {document.type} · {document.source === 'upload' ? '上传' : '示例'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {document.owner} · {document.chunks} chunks · {document.updatedAt}
                  </p>
                  {document.filePath ? (
                    <p className="mt-1 truncate font-mono text-[11px] leading-5 text-[#6b755f]">
                      {document.filePath}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
