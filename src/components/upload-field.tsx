"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  useUploadField,
  type FileEntry,
  type UploadedFile,
  type UploadMode,
  type UploadStatus,
} from "@/hooks/use-upload-field"
import { cn } from "@/lib/utils"
import type { OurFileRouter } from "@/app/api/uploadthing/core"

export type UploadFieldClassNames = {
  root?: string
  dropzone?: string
  uploaded?: string
  queue?: string
  file?: string
  actions?: string
}

type BaseUploadFieldProps = {
  endpoint: keyof OurFileRouter
  maxFiles?: number
  accept?: string[]
  uploadMode?: UploadMode
  classNames?: UploadFieldClassNames
  uploadLabel?: string
  browseLabel?: string
  queuedLabel?: string
  validate?: (files: File[]) => string | undefined
  beforeUpload?: (files: File[]) => Promise<void> | void
  renderFile?: (entry: FileEntry, actions: UploadFileActions) => ReactNode
  renderUploadedFile?: (file: UploadedFile, actions: UploadedFileActions) => ReactNode
  onFilesQueued?: (files: FileEntry[]) => void
  onQueueChange?: (files: FileEntry[]) => void
  onUploadStart?: (files: FileEntry[]) => void
  onUploadComplete?: (files: UploadedFile[]) => void
  onUploadError?: (error: Error) => void
}

export type UploadFileActions = {
  remove: () => void
  retry: () => void
}

export type UploadedFileActions = {
  open: () => void
  remove: () => void
}

export type UploadFieldHandle = {
  uploadAll: () => Promise<UploadedFile[]>
  clear: () => void
}

export type SingleUploadFieldProps = BaseUploadFieldProps & {
  multiple?: false
  value?: UploadedFile | null
  onChange?: (value: UploadedFile | null) => void
}

export type MultiUploadFieldProps = BaseUploadFieldProps & {
  multiple: true
  value?: UploadedFile[]
  onChange?: (value: UploadedFile[]) => void
}

export type UploadFieldProps = SingleUploadFieldProps | MultiUploadFieldProps

export const UploadField = forwardRef<UploadFieldHandle, UploadFieldProps>(function UploadField({
  endpoint,
  multiple = false,
  maxFiles = 1,
  accept,
  uploadMode = "manual",
  classNames,
  uploadLabel = "Upload",
  browseLabel = "Drag and drop files here, or click to browse",
  queuedLabel = "Ready to upload",
  value = [],
  onChange,
  validate,
  beforeUpload,
  renderFile,
  renderUploadedFile,
  onFilesQueued,
  onQueueChange,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}, ref) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const files = normalizeValue(value, multiple)
  const filesRef = useRef(files)
  const onChangeRef = useRef(onChange as UploadFieldProps["onChange"])

  useEffect(() => { filesRef.current = files }, [files])
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  const handleUploadComplete = useCallback((uploadedFiles: UploadedFile[]) => {
    const nextFiles = multiple
      ? [...filesRef.current, ...uploadedFiles].slice(0, maxFiles)
      : uploadedFiles.at(-1) ?? null

    filesRef.current = Array.isArray(nextFiles)
      ? nextFiles
      : nextFiles
        ? [nextFiles]
        : []
    emitChange(onChangeRef.current, nextFiles, multiple)
    onUploadComplete?.(uploadedFiles)
  }, [maxFiles, multiple, onUploadComplete])

  const {
    fileEntries,
    uploadError,
    canUpload,
    isUploading,
    addFiles,
    uploadAll,
    removeFile,
    retryFile,
    clear,
  } = useUploadField({
    endpoint,
    multiple,
    maxFiles,
    accept,
    uploadMode,
    currentFileCount: files.length,
    validate,
    beforeUpload,
    onFilesQueued,
    onQueueChange,
    onUploadStart,
    onUploadComplete: handleUploadComplete,
    onUploadError,
  })

  const handleFiles = useCallback(
    (selectedFiles: FileList | File[]) => {
      addFiles(Array.from(selectedFiles))
      if (inputRef.current) inputRef.current.value = ""
    },
    [addFiles]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragOver(false)
      if (event.dataTransfer.files.length > 0) {
        handleFiles(event.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      inputRef.current?.click()
    }
  }, [])

  const handleClear = useCallback(() => {
    clear()
    filesRef.current = []
    emitChange(onChange, multiple ? [] : null, multiple)
  }, [clear, multiple, onChange])
  const handleUploadedFileRemove = useCallback((index: number) => {
    const updated = files.filter((_, i) => i !== index)
    filesRef.current = updated
    emitChange(onChange, multiple ? updated : null, multiple)
  }, [files, multiple, onChange])

  /*
   * Track status transitions so we can move focus to the Retry button
   * when an entry fails, without stealing focus during normal progress.
   */
  const prevStatusMapRef = useRef<Map<string, UploadStatus>>(new Map())

  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    for (const entry of fileEntries) {
      const prevStatus = prevStatusMapRef.current.get(entry.id)
      if (prevStatus && prevStatus !== "failed" && entry.status === "failed") {
        const btn = root.querySelector<HTMLButtonElement>(
          `[data-entry-id="${entry.id}"] [data-retry-button]`
        )
        btn?.focus()
      }
      prevStatusMapRef.current.set(entry.id, entry.status)
    }
  }, [fileEntries])

  const statusMessage = isDragOver
    ? "Drop files here"
    : getStatusMessage(fileEntries, uploadError)

  useImperativeHandle(ref, () => ({
    uploadAll,
    clear: handleClear,
  }), [handleClear, uploadAll])

  return (
    <div ref={containerRef} className={cn("space-y-3", classNames?.root)}>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>
      <Card
        className={cn(
          "relative cursor-pointer border-dashed transition-colors",
          isDragOver && "border-primary ring-2 ring-primary/20",
          uploadError && "border-destructive",
          classNames?.dropzone
        )}
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragOver(false)
        }}
        onKeyDown={handleKeyDown}
        onClick={() => inputRef.current?.click()}
        tabIndex={0}
        role="button"
        aria-label="Choose files to upload"
      >
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <UploadIcon />
          <p className="text-sm text-muted-foreground">
            {isDragOver ? "Drop files here" : browseLabel}
          </p>
          {accept && (
            <p className="text-xs text-muted-foreground/60">
              Accepted: {accept.join(", ")}
            </p>
          )}
        </CardContent>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept?.join(",")}
          multiple={multiple}
          onChange={(event) => {
            if (event.target.files?.length) handleFiles(event.target.files)
          }}
          tabIndex={-1}
        />
      </Card>

      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
      )}

      {files.length > 0 && (
        <AttachmentGroup className={classNames?.uploaded}>
          <p className="text-sm font-medium">Uploaded files</p>
          {files.map((file, index) => (
            <UploadedFileSlot
              key={file.id}
              file={file}
              index={index}
              renderUploadedFile={renderUploadedFile}
              onRemove={handleUploadedFileRemove}
            />
          ))}
        </AttachmentGroup>
      )}

      {fileEntries.length > 0 && (
        <AttachmentGroup className={classNames?.queue}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">
              {uploadMode === "manual" ? queuedLabel : "Uploads"}
            </p>
            <span className="text-xs text-muted-foreground">
              {fileEntries.length} file{fileEntries.length === 1 ? "" : "s"}
            </span>
          </div>

          {fileEntries.map((entry) => {
            const actions = {
              remove: () => removeFile(entry.id),
              retry: () => retryFile(entry.id),
            }

            return renderFile ? (
              <div key={entry.id}>{renderFile(entry, actions)}</div>
            ) : (
              <QueuedFileRow
                key={entry.id}
                entry={entry}
                actions={actions}
                className={classNames?.file}
              />
            )
          })}
        </AttachmentGroup>
      )}

      {(fileEntries.length > 0 || files.length > 0) && (
        <div className={cn("flex flex-wrap gap-2", classNames?.actions)}>
          {uploadMode === "manual" && fileEntries.length > 0 && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                void uploadAll().catch(() => {})
              }}
              disabled={!canUpload}
            >
              {isUploading ? "Uploading..." : uploadLabel}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={isUploading}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  )
})

function QueuedFileRow({
  entry,
  actions,
  className,
}: {
  entry: FileEntry
  actions: UploadFileActions
  className?: string
}) {
  return (
    <Attachment
      className={cn(
        entry.status === "failed" && "border-destructive/50",
        className
      )}
      data-status={entry.status}
      data-entry-id={entry.id}
    >
      <div className="flex items-center gap-3">
        <FilePreview entry={entry} />
        <AttachmentContent>
          <AttachmentTitle>{entry.file.name}</AttachmentTitle>
          <StatusText entry={entry} />
        </AttachmentContent>
        <AttachmentDescription className="hidden max-w-20 shrink-0 text-right sm:block">
          {formatSize(entry.file.size)}
        </AttachmentDescription>
        <FileActions entry={entry} actions={actions} />
      </div>
      {(entry.status === "uploading" || entry.status === "retrying") && (
        <div className="mt-2">
          <Progress value={entry.progress} />
        </div>
      )}
    </Attachment>
  )
}

function UploadedFileSlot({
  file,
  index,
  renderUploadedFile,
  onRemove,
}: {
  file: UploadedFile
  index: number
  renderUploadedFile?: (file: UploadedFile, actions: UploadedFileActions) => ReactNode
  onRemove: (index: number) => void
}) {
  const actions = {
    open: () => window.open(file.url, "_blank", "noopener,noreferrer"),
    remove: () => onRemove(index),
  }

  if (renderUploadedFile) {
    return <div>{renderUploadedFile(file, actions)}</div>
  }

  return <UploadedFileRow file={file} actions={actions} />
}

function UploadedFileRow({
  file,
  actions,
}: {
  file: UploadedFile
  actions: UploadedFileActions
}) {
  return (
    <Attachment>
      <AttachmentMedia className="size-8">
        <FileIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{file.name}</AttachmentTitle>
        <AttachmentDescription>{formatSize(file.size)}</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction
          type="button"
          onClick={actions.open}
        >
          Open
        </AttachmentAction>
        <AttachmentAction type="button" onClick={actions.remove}>
          Remove
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  )
}

function FilePreview({ entry }: { entry: FileEntry }) {
  if (entry.previewUrl) {
    return (
      <AttachmentMedia>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.previewUrl}
          alt=""
          className="size-full object-cover"
        />
      </AttachmentMedia>
    )
  }

  return (
    <AttachmentMedia>
      <FileIcon />
    </AttachmentMedia>
  )
}

function StatusText({ entry }: { entry: FileEntry }) {
  if (entry.status === "queued") {
    return <AttachmentDescription>Queued for review</AttachmentDescription>
  }

  if (entry.status === "failed") {
    return (
      <AttachmentDescription className="text-destructive">
        {entry.error || "Upload failed"}
      </AttachmentDescription>
    )
  }

  return (
    <AttachmentDescription>
      {entry.status === "retrying" ? "Retrying" : `Uploading ${entry.progress}%`}
    </AttachmentDescription>
  )
}

function FileActions({
  entry,
  actions,
}: {
  entry: FileEntry
  actions: UploadFileActions
}) {
  if (entry.status === "uploading" || entry.status === "retrying") return null

  if (entry.status === "failed") {
    return (
      <AttachmentActions>
        <AttachmentAction type="button" variant="outline" onClick={actions.retry} data-retry-button>
          Retry
        </AttachmentAction>
        <AttachmentAction type="button" onClick={actions.remove}>
          Remove
        </AttachmentAction>
      </AttachmentActions>
    )
  }

  return (
    <AttachmentActions>
      <AttachmentAction type="button" onClick={actions.remove}>
        Remove
      </AttachmentAction>
    </AttachmentActions>
  )
}

function normalizeValue(
  value: UploadFieldProps["value"],
  multiple: boolean
) {
  if (multiple) return Array.isArray(value) ? value : []
  return value && !Array.isArray(value) ? [value] : []
}

function emitChange(
  onChange: UploadFieldProps["onChange"],
  value: UploadedFile[] | UploadedFile | null,
  multiple: boolean
) {
  if (!onChange) return

  if (multiple) {
    (onChange as MultiUploadFieldProps["onChange"])?.(Array.isArray(value) ? value : [])
    return
  }

  (onChange as SingleUploadFieldProps["onChange"])?.(
    Array.isArray(value) ? value.at(-1) ?? null : value
  )
}

function getStatusMessage(entries: FileEntry[], error: string | null) {
  if (error) return error

  const uploading = entries.filter((entry) =>
    entry.status === "uploading" || entry.status === "retrying"
  ).length
  if (uploading > 0) {
    return `Uploading ${uploading} file${uploading === 1 ? "" : "s"}.`
  }

  const failed = entries.filter((entry) => entry.status === "failed").length
  if (failed > 0) {
    return `${failed} upload${failed === 1 ? "" : "s"} failed.`
  }

  const queued = entries.filter((entry) => entry.status === "queued").length
  if (queued > 0) {
    return `${queued} file${queued === 1 ? "" : "s"} ready to upload.`
  }

  return "No files selected."
}

function UploadIcon() {
  return (
    <svg
      className="size-8 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
      />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg
      className="size-4 shrink-0 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  )
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
