"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { uploadFiles } from "@/lib/uploadthing"
import type { OurFileRouter } from "@/app/api/uploadthing/core"

export type UploadedFile = {
  id: string
  url: string
  name: string
  size: number
}

export type UploadStatus = "queued" | "uploading" | "failed" | "retrying"

export type UploadMode = "manual" | "auto"

export type UploadError = string

export type FileEntry = {
  id: string
  file: File
  status: UploadStatus
  progress: number
  previewUrl?: string
  error?: string
  result?: UploadedFile
}

export class UploadFailedError extends Error {
  readonly uploadedFiles: UploadedFile[]
  readonly failedFiles: File[]

  constructor(uploadedFiles: UploadedFile[], failedFiles: File[]) {
    super("One or more files could not be uploaded.")
    this.name = "UploadFailedError"
    this.uploadedFiles = uploadedFiles
    this.failedFiles = failedFiles
  }
}

type UploadAttempt = {
  uploadedFiles: UploadedFile[]
  failedFiles: File[]
}

export type UseUploadFieldProps = {
  endpoint: keyof OurFileRouter
  multiple?: boolean
  maxFiles?: number
  accept?: string[]
  uploadMode?: UploadMode
  currentFileCount?: number
  validate?: (files: File[]) => string | undefined
  beforeUpload?: (files: File[]) => Promise<void> | void
  onFilesQueued?: (files: FileEntry[]) => void
  onQueueChange?: (files: FileEntry[]) => void
  onUploadStart?: (files: FileEntry[]) => void
  onUploadComplete?: (files: UploadedFile[]) => void
  onUploadError?: (error: Error) => void
}

export function useUploadField({
  endpoint,
  multiple = false,
  maxFiles = 1,
  accept,
  uploadMode = "manual",
  currentFileCount = 0,
  validate,
  beforeUpload,
  onFilesQueued,
  onQueueChange,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}: UseUploadFieldProps) {
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([])
  const [uploadError, setUploadError] = useState<UploadError | null>(null)
  const isProcessing = useRef(false)
  const idCounter = useRef(0)
  const entriesRef = useRef<FileEntry[]>([])

  /*
   * Serialization mutex for addFiles.
   * Prevents concurrent async beforeUpload calls from both passing the same
   * capacity check.  Each call waits for the previous one to complete.
   */
  const addFilesMutex = useRef<Promise<void>>(Promise.resolve())

  /*
   * Keep entriesRef.current in sync with fileEntries for imperative access
   * from uploadAll / retryFile / clear.
   *
   * Note: entriesRef.current is also set inside the setFileEntries updater
   * below so concurrent callers reading the ref (e.g. the capacity check in
   * validateIncomingFiles) see the latest value without waiting for a new
   * render + passive effect to fire.  This is a controlled, intentional
   * impurity inside an otherwise-pure updater — the mutation is idempotent
   * and has no effect on React's rendering.
   */
  useEffect(() => {
    entriesRef.current = fileEntries
  }, [fileEntries])

  /*
   * Notify consumers of queue changes in a useEffect rather than inside a
   * React state updater.
   */
  const prevEntriesRef = useRef<FileEntry[]>(fileEntries)

  useEffect(() => {
    if (fileEntries !== prevEntriesRef.current) {
      prevEntriesRef.current = fileEntries
      onQueueChange?.(fileEntries)
    }
  }, [fileEntries, onQueueChange])

  /*
   * Revoke all outstanding object URLs when the hook unmounts,
   * preventing memory leaks from orphaned blob URLs.
   */
  useEffect(() => {
    return () => {
      for (const entry of entriesRef.current) {
        if (entry.previewUrl) {
          URL.revokeObjectURL(entry.previewUrl)
        }
      }
    }
  }, [])

  const updateEntries = useCallback(
    (next: FileEntry[] | ((prev: FileEntry[]) => FileEntry[])) => {
      setFileEntries((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next
        entriesRef.current = resolved
        return resolved
      })
    },
    []
  )

  const setEntry = useCallback(
    (id: string, patch: Partial<FileEntry>) => {
      updateEntries((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, ...patch } : entry
        )
      )
    },
    [updateEntries]
  )

  const validateIncomingFiles = useCallback(
    async (incoming: File[]) => {
      setUploadError(null)

      const queuedCount = entriesRef.current.length
      const remaining = multiple
        ? (maxFiles ?? 99) - currentFileCount - queuedCount
        : 1
      let filesToAdd = incoming.slice(0, remaining)

      if (!multiple) {
        filesToAdd = incoming.slice(0, 1)
      }

      if (filesToAdd.length === 0) {
        setUploadError(`You can upload up to ${maxFiles} file${maxFiles === 1 ? "" : "s"}.`)
        return []
      }

      const acceptError = getAcceptError(filesToAdd, accept)
      if (acceptError) {
        setUploadError(acceptError)
        return []
      }

      if (validate) {
        const error = validate(filesToAdd)
        if (error) {
          setUploadError(error)
          return []
        }
      }

      if (beforeUpload) {
        try {
          await beforeUpload(filesToAdd)
        } catch (err) {
          setUploadError(
            err instanceof Error ? err.message : "Upload pre-check failed",
          )
          return []
        }
      }

      return filesToAdd
    },
    [accept, beforeUpload, currentFileCount, maxFiles, multiple, validate]
  )

  const uploadEntries = useCallback(
    async (entries: FileEntry[]) => {
      if (isProcessing.current || entries.length === 0) {
        return { uploadedFiles: [], failedFiles: [] } satisfies UploadAttempt
      }

      setUploadError(null)
      isProcessing.current = true
      onUploadStart?.(entries)

      const entryByFile = new Map(entries.map((entry) => [entry.file, entry]))

      updateEntries((prev) =>
        prev.map((entry) => {
          if (!entries.some((item) => item.id === entry.id)) return entry

          return {
            ...entry,
            status: entry.status === "failed" ? "retrying" : "uploading",
            progress: 0,
            error: undefined,
          }
        })
      )

      try {
        const results = await uploadFiles(endpoint, {
          files: entries.map((entry) => entry.file),
          onUploadProgress: ({ file, progress }) => {
            const entry = entryByFile.get(file)
            if (!entry) return

            setEntry(entry.id, { progress: normalizeProgress(progress) })
          },
        })

        const uploadedWithEntries = results.map((result, index) => ({
          entryId: entries[index]?.id,
          file: {
            id: result.key,
            url: result.ufsUrl,
            name: result.name,
            size: result.size,
          } satisfies UploadedFile,
        }))
        const uploaded = uploadedWithEntries.map((item) => item.file)

        const uploadedEntryIds = new Set(
          uploadedWithEntries
            .map((item) => item.entryId)
            .filter((id): id is string => Boolean(id))
        )

        for (const entry of entriesRef.current) {
          if (uploadedEntryIds.has(entry.id) && entry.previewUrl) {
            URL.revokeObjectURL(entry.previewUrl)
          }
        }

        updateEntries((prev) =>
          prev.filter((entry) => !uploadedEntryIds.has(entry.id))
        )
        onUploadComplete?.(uploaded)
        isProcessing.current = false
        return { uploadedFiles: uploaded, failedFiles: [] } satisfies UploadAttempt
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed")
        const fallbackUploads: UploadedFile[] = []
        const failedFiles: File[] = []

        for (const entry of entries) {
          setEntry(entry.id, {
            status: entry.status === "failed" ? "retrying" : "uploading",
            progress: 0,
            error: undefined,
          })

          try {
            const [result] = await uploadFiles(endpoint, {
              files: [entry.file],
              onUploadProgress: ({ progress }) => {
                setEntry(entry.id, { progress: normalizeProgress(progress) })
              },
            })

            if (!result) {
              throw new Error("Upload did not return file metadata")
            }

            const uploaded: UploadedFile = {
              id: result.key,
              url: result.ufsUrl,
              name: result.name,
              size: result.size,
            }

            fallbackUploads.push(uploaded)
            if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl)
            updateEntries((prev) => prev.filter((item) => item.id !== entry.id))
          } catch (singleErr) {
            const singleError =
              singleErr instanceof Error ? singleErr : new Error(error.message)

            setEntry(entry.id, {
              status: "failed",
              error: getReadableUploadError(singleError),
            })
            failedFiles.push(entry.file)
            onUploadError?.(singleError)
          }
        }

        if (fallbackUploads.length > 0) {
          onUploadComplete?.(fallbackUploads)
        }

        if (fallbackUploads.length === 0) {
          setUploadError(getReadableUploadError(error))
        } else if (fallbackUploads.length < entries.length) {
          setUploadError("Some files could not be uploaded.")
        }

        isProcessing.current = false
        return {
          uploadedFiles: fallbackUploads,
          failedFiles,
        } satisfies UploadAttempt
      }
    },
    [endpoint, onUploadComplete, onUploadError, onUploadStart, setEntry, updateEntries]
  )

  const addFiles = useCallback(
    async (incoming: File[]) => {
      /*
       * Acquire the serialization mutex so concurrent addFiles calls do not
       * both pass the capacity check while an async beforeUpload is pending.
       */
      const prev = addFilesMutex.current
      let release: () => void = () => {}
      addFilesMutex.current = new Promise<void>((resolve) => { release = resolve })
      await prev

      try {
        if (isProcessing.current) {
          setUploadError("Wait for the current upload to finish before adding more files.")
          return []
        }

        const filesToAdd = await validateIncomingFiles(incoming)
        if (filesToAdd.length === 0) return []

        const newEntries: FileEntry[] = filesToAdd.map((file) => ({
          id: `upload-${Date.now()}-${idCounter.current++}`,
          file,
          status: "queued" as UploadStatus,
          progress: 0,
          previewUrl: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
        }))

        if (!multiple) {
          for (const entry of entriesRef.current) {
            if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl)
          }
        }

        updateEntries((prev) => {
          if (multiple) return [...prev, ...newEntries]
          return newEntries
        })
        onFilesQueued?.(newEntries)

        if (uploadMode === "auto") {
          await uploadEntries(newEntries)
        }

        return newEntries
      } finally {
        release()
      }
    },
    [
      multiple,
      onFilesQueued,
      updateEntries,
      uploadEntries,
      uploadMode,
      validateIncomingFiles,
    ]
  )

  const uploadAll = useCallback(async () => {
    const uploadable = entriesRef.current.filter((entry) =>
      entry.status === "queued" || entry.status === "failed"
    )

    const { uploadedFiles, failedFiles } = await uploadEntries(uploadable)

    if (failedFiles.length > 0) {
      throw new UploadFailedError(uploadedFiles, failedFiles)
    }

    return uploadedFiles
  }, [uploadEntries])

  const removeFile = useCallback(
    (id: string) => {
      const entry = entriesRef.current.find((item) => item.id === id)
      if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl)
      updateEntries((prev) => prev.filter((item) => item.id !== id))
    },
    [updateEntries]
  )

  const retryFile = useCallback(
    async (id: string) => {
      const entry = entriesRef.current.find((item) => item.id === id)
      if (!entry || entry.status !== "failed") return undefined
      if (isProcessing.current) {
        setUploadError("Wait for the current upload to finish before retrying.")
        return undefined
      }

      const { uploadedFiles } = await uploadEntries([entry])
      return uploadedFiles[0]
    },
    [uploadEntries]
  )

  const clear = useCallback(() => {
    for (const entry of entriesRef.current) {
      if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl)
    }

    entriesRef.current = []
    isProcessing.current = false
    setUploadError(null)
    setFileEntries([])
  }, [])

  const queuedFiles = useMemo(
    () => fileEntries.filter((entry) => entry.status === "queued"),
    [fileEntries]
  )
  const failedFiles = useMemo(
    () => fileEntries.filter((entry) => entry.status === "failed"),
    [fileEntries]
  )
  const isBusy = fileEntries.some((entry) =>
    entry.status === "uploading" || entry.status === "retrying"
  )

  return {
    fileEntries,
    queuedFiles,
    failedFiles,
    isUploading: isBusy,
    uploadError: uploadError as UploadError | null,
    canUpload: queuedFiles.length > 0 && !isBusy,
    addFiles,
    uploadAll,
    removeFile,
    retryFile,
    clear,
  }
}

function getAcceptError(files: File[], accept?: string[]) {
  if (!accept?.length) return undefined

  const invalidFile = files.find((file) => !isAcceptedFile(file, accept))

  if (!invalidFile) return undefined

  return `${invalidFile.name} is not an accepted file type.`
}

function getReadableUploadError(error: Error) {
  if (error.message.includes("FileSizeMismatch")) {
    return "This file is larger than the upload limit for its file type."
  }

  if (error.message.includes("FileCountMismatch")) {
    return "Too many files were selected for this upload route."
  }

  if (error.message.includes("InvalidFileType") || error.message.includes("UnknownFileType")) {
    return "This file type is not allowed for this upload route."
  }

  return error.message
}

function normalizeProgress(progress: number) {
  return Math.min(100, Math.max(0, Math.round(progress)))
}

function isAcceptedFile(file: File, accept: string[]) {
  return accept.some((rule) => {
    const normalizedRule = rule.trim().toLowerCase()
    const fileType = file.type.toLowerCase()
    const fileName = file.name.toLowerCase()

    if (!normalizedRule) return false
    if (normalizedRule.startsWith(".")) return fileName.endsWith(normalizedRule)
    if (normalizedRule.endsWith("/*")) {
      return fileType.startsWith(normalizedRule.slice(0, -1))
    }

    return fileType === normalizedRule
  })
}
