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
  const [localPath, setLocalPath] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const uploadDocument = useWorkbenchStore((state) => state.uploadDocument)
  const importDocumentByPath = useWorkbenchStore((state) => state.importDocumentByPath)
  const isUploading = useWorkbenchStore((state) => state.isUploading)
  const error = useWorkbenchStore((state) => state.error)

  const uploadFileNow = async (file: File | null) => {
    if (!file || isUploading) {
      return
    }

    setUploadMessage('')

    try {
      const document = await uploadDocument(file, scope, owner)
      setUploadMessage(
        `已上传：${document.title}。本地：${document.filePath ?? '已入库'}；GitHub：${document.gitSyncMessage ?? '等待同步状态'}`,
      )
    } catch {
      setUploadMessage('')
    }
  }

  const handleImportPath = async () => {
    const trimmedPath = localPath.trim()
    if (!trimmedPath || isUploading) {
      setUploadMessage('请粘贴本地文件的绝对路径')
      return
    }

    try {
      setUploadMessage('')
      const document = await importDocumentByPath(trimmedPath, scope, owner)
      setUploadMessage(
        `已导入：${document.title}。本地：${document.filePath ?? '已入库'}；GitHub：${document.gitSyncMessage ?? '等待同步状态'}`,
      )
      setLocalPath('')
    } catch {
      setUploadMessage('')
    }
  }

  return (
    <Section
      icon={Library}
      title="知识库"
      description="上传文档后会写入本地检索库，同时保存原文件和解析文本到仓库。"
    >
      <div className="mb-3 rounded-lg border border-line bg-[#fbfcf8] p-3">
        <div className="grid gap-2">
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setIsDragging(false)
              void uploadFileNow(event.dataTransfer.files?.[0] ?? null)
            }}
            className={cn(
              'flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-white px-3 py-4 text-center transition',
              isDragging ? 'border-moss bg-[#eef7f1]' : 'border-line hover:border-moss hover:bg-[#fbfff8]',
              isUploading ? 'cursor-not-allowed opacity-70' : '',
            )}
          >
            <div className="grid h-9 w-9 place-items-center rounded-md bg-[#eef7f1] text-moss">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                {isUploading ? '正在上传并入库' : '把文件拖到这里会自动上传'}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-muted">
                支持 txt、md、csv、html、pdf、docx
              </p>
            </div>
          </div>
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
            {isUploading ? '正在解析、切分并写入知识库' : '拖拽文件会立即入库，也可以使用下面的路径导入'}
          </div>
          <div className="grid gap-2 rounded-md border border-line bg-white p-2">
            <label className="text-[11px] font-semibold leading-5 text-[#4d594c]" htmlFor="knowledge-path">
              粘贴本地文件绝对路径导入
            </label>
            <input
              id="knowledge-path"
              value={localPath}
              onChange={(event) => setLocalPath(event.target.value)}
              placeholder="/Users/你的用户名/Documents/example.md"
              disabled={isUploading}
              className="rounded-md border border-line bg-[#fbfcf8] px-2 py-2 font-mono text-[11px] text-[#4d594c] outline-none focus:border-moss"
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => void handleImportPath()}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-white transition',
                isUploading ? 'bg-[#9aa89b]' : 'bg-ocean hover:bg-[#285d71]',
              )}
            >
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              从路径导入
            </button>
          </div>
          {uploadMessage ? (
            <div className="rounded-md border border-[#b8dcc5] bg-[#eef7f1] px-2 py-1.5 text-xs leading-5 text-moss">
              {uploadMessage}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-md border border-[#f0d6c8] bg-[#fff7f2] px-2 py-1.5 text-xs leading-5 text-clay">
              {error}
            </div>
          ) : null}
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
                      原文件：{document.filePath}
                    </p>
                  ) : null}
                  {document.textPath ? (
                    <p className="mt-1 truncate font-mono text-[11px] leading-5 text-[#6b755f]">
                      解析文本：{document.textPath}
                    </p>
                  ) : null}
                  {document.gitSyncMessage ? (
                    <p
                      className={cn(
                        'mt-1 text-[11px] leading-5',
                        document.gitSyncStatus === 'failed' ? 'text-clay' : 'text-moss',
                      )}
                    >
                      GitHub：{document.gitSyncMessage}
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
