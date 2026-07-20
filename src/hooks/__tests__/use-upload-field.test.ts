import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { UploadFailedError, useUploadField } from "../use-upload-field"

const mockUploadFiles = vi.fn()

vi.mock("@/lib/uploadthing", () => ({
  uploadFiles: (...args: unknown[]) => (mockUploadFiles as (...args: unknown[]) => unknown)(...args),
}))

function createFile(name = "test.png", type = "image/png", size = 1024) {
  return new File(["x".repeat(size)], name, { type })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
//  1. Failed files count toward maxFiles
// ---------------------------------------------------------------------------
describe("maxFiles capacity with failed entries", () => {
  it("counts failed entries toward the maxFiles capacity", async () => {
    const { result } = renderHook(() =>
      useUploadField({
        endpoint: "imageUploader",
        multiple: true,
        maxFiles: 2,
      })
    )

    await act(async () => {
      await result.current.addFiles([createFile("a.png"), createFile("b.png")])
    })

    expect(result.current.fileEntries).toHaveLength(2)

    // Upload fails because mock rejects
    await act(async () => {
      await expect(result.current.uploadAll()).rejects.toBeInstanceOf(UploadFailedError)
    })

    // Both entries should be failed
    expect(result.current.fileEntries).toHaveLength(2)
    expect(result.current.fileEntries.every((e) => e.status === "failed")).toBe(true)

    // Attempting to add a third file should be rejected by capacity
    await act(async () => {
      await result.current.addFiles([createFile("c.png")])
    })

    expect(result.current.fileEntries).toHaveLength(2)
    expect(result.current.uploadError).toMatch(/up to 2/)
  })
})

// ---------------------------------------------------------------------------
//  2. Concurrent async validation does not exceed maxFiles
// ---------------------------------------------------------------------------
describe("concurrent async validation", () => {
  it("serializes concurrent addFiles calls so capacity is never exceeded", async () => {
    let beforeUploadResolve: (() => void) | undefined
    const beforeUploadCall = vi.fn(async () => {
      await new Promise<void>((resolve) => {
        beforeUploadResolve = resolve
      })
    })

    const { result } = renderHook(() =>
      useUploadField({
        endpoint: "imageUploader",
        multiple: true,
        maxFiles: 1,
        beforeUpload: beforeUploadCall,
      })
    )

    // Start two concurrent addFiles
    const p1 = result.current.addFiles([createFile("a.png")])
    const p2 = result.current.addFiles([createFile("b.png")])

    // Release the first beforeUpload
    await act(async () => {
      beforeUploadResolve?.()
      await new Promise((r) => setTimeout(r, 0))
    })

    // Release the second beforeUpload (first call done, second should still wait)
    await act(async () => {
      beforeUploadResolve?.()
      await new Promise((r) => setTimeout(r, 0))
    })

    const r1 = await p1
    const r2 = await p2

    // Only one file should have been added (maxFiles = 1)
    expect(r1).toHaveLength(1)
    expect(r2).toHaveLength(0)
  }, 10000)
})

// ---------------------------------------------------------------------------
//  3. Partial batch failure with retry / remove
// ---------------------------------------------------------------------------
describe("partial batch failure", () => {
  it("supports retry and remove after a partial batch failure", async () => {
    mockUploadFiles
      .mockRejectedValueOnce(new Error("Batch failed"))
      .mockResolvedValueOnce([
        { key: "key-a", ufsUrl: "https://example.com/a.png", name: "a.png", size: 100 },
      ])
      .mockRejectedValueOnce(new Error("File b rejected"))

    const onUploadError = vi.fn()
    const onUploadComplete = vi.fn()

    const { result } = renderHook(() =>
      useUploadField({
        endpoint: "imageUploader",
        multiple: true,
        maxFiles: 3,
        onUploadError,
        onUploadComplete,
      })
    )

    await act(async () => {
      await result.current.addFiles([createFile("a.png"), createFile("b.png")])
    })

    expect(result.current.fileEntries).toHaveLength(2)

    await act(async () => {
      await expect(result.current.uploadAll()).rejects.toMatchObject({
        uploadedFiles: [expect.objectContaining({ id: "key-a" })],
        failedFiles: [expect.objectContaining({ name: "b.png" })],
      })
    })

    // a.png succeeded (removed), b.png failed (stays)
    expect(result.current.fileEntries).toHaveLength(1)
    expect(result.current.fileEntries[0].status).toBe("failed")
    expect(result.current.uploadError).toBe("Some files could not be uploaded.")
    expect(onUploadError).toHaveBeenCalledOnce()
    expect(onUploadComplete).toHaveBeenCalledOnce()

    // Remove the failed entry
    const failedId = result.current.fileEntries[0].id
    await act(async () => {
      result.current.removeFile(failedId)
    })

    expect(result.current.fileEntries).toHaveLength(0)
  })

  it("retryFile re-uploads a failed entry and removes it on success", async () => {
    mockUploadFiles
      .mockRejectedValueOnce(new Error("Batch failed"))
      .mockResolvedValueOnce([
        { key: "key-a", ufsUrl: "https://example.com/a.png", name: "a.png", size: 100 },
      ])
      .mockRejectedValueOnce(new Error("File b rejected"))
      // Retry: b.png succeeds
      .mockResolvedValueOnce([
        { key: "key-b", ufsUrl: "https://example.com/b.png", name: "b.png", size: 200 },
      ])

    const onUploadError = vi.fn()
    const onUploadComplete = vi.fn()

    const { result } = renderHook(() =>
      useUploadField({
        endpoint: "imageUploader",
        multiple: true,
        maxFiles: 3,
        onUploadError,
        onUploadComplete,
      })
    )

    await act(async () => {
      await result.current.addFiles([createFile("a.png"), createFile("b.png")])
    })

    // Trigger batch failure → fallback per-file → a succeeds, b fails
    await act(async () => {
      await expect(result.current.uploadAll()).rejects.toBeInstanceOf(UploadFailedError)
    })

    expect(result.current.fileEntries).toHaveLength(1)
    expect(result.current.fileEntries[0].status).toBe("failed")

    // Retry the failed file
    const failedId = result.current.fileEntries[0].id
    await act(async () => {
      await result.current.retryFile(failedId)
    })

    // After successful retry the entry should be removed from the queue
    expect(result.current.fileEntries).toHaveLength(0)
    expect(onUploadComplete).toHaveBeenCalledTimes(2) // once for batch, once for retry
  })
})

// ---------------------------------------------------------------------------
//  3b. Auth rejection
// ---------------------------------------------------------------------------
describe("auth rejection", () => {
  it("handles upload rejection like an unauthenticated response", async () => {
    mockUploadFiles.mockRejectedValue(new Error("Unauthorized"))

    const { result } = renderHook(() =>
      useUploadField({
        endpoint: "imageUploader",
        multiple: true,
        maxFiles: 3,
      })
    )

    await act(async () => {
      await result.current.addFiles([createFile("x.png")])
    })

    await act(async () => {
      await expect(result.current.uploadAll()).rejects.toBeInstanceOf(UploadFailedError)
    })

    expect(result.current.fileEntries).toHaveLength(1)
    expect(result.current.fileEntries[0].status).toBe("failed")
    expect(result.current.uploadError).toMatch(/Unauthorized/i)
  })
})

// ---------------------------------------------------------------------------
//  3c. Two independent instances do not interfere
// ---------------------------------------------------------------------------
describe("instance isolation", () => {
  it("two independent useUploadField instances do not share state", async () => {
    mockUploadFiles.mockRejectedValue(new Error("Upload failed"))

    const { result: r1 } = renderHook(() =>
      useUploadField({
        endpoint: "imageUploader",
        multiple: true,
        maxFiles: 2,
      })
    )

    const { result: r2 } = renderHook(() =>
      useUploadField({
        endpoint: "imageUploader",
        multiple: true,
        maxFiles: 3,
      })
    )

    await act(async () => {
      await r1.current.addFiles([createFile("a.png")])
      await r2.current.addFiles([createFile("b.png"), createFile("c.png")])
    })

    expect(r1.current.fileEntries).toHaveLength(1)
    expect(r2.current.fileEntries).toHaveLength(2)

    // Each should have its own capacity limit
    await act(async () => {
      await r1.current.addFiles([createFile("d.png"), createFile("e.png")])
    })

    // r1 has maxFiles=2, already has 1 entry, can only add 1 more
    expect(r1.current.fileEntries).toHaveLength(2)
    // r2 remains at 2 (should not have been affected by r1's capacity)
    expect(r2.current.fileEntries).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
//  4. Object URL cleanup on unmount
// ---------------------------------------------------------------------------
describe("object URL cleanup on unmount", () => {
  it("revokes preview object URLs when the hook unmounts", async () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL")
    const createSpy = vi.spyOn(URL, "createObjectURL")
    createSpy.mockReturnValue("blob:mock-preview")

    const { result, unmount } = renderHook(() =>
      useUploadField({
        endpoint: "imageUploader",
        multiple: true,
        maxFiles: 5,
      })
    )

    await act(async () => {
      await result.current.addFiles([
        createFile("img1.png"),
        createFile("img2.png"),
      ])
    })

    expect(result.current.fileEntries).toHaveLength(2)
    expect(result.current.fileEntries.every((e) => e.previewUrl === "blob:mock-preview")).toBe(true)

    revokeSpy.mockClear()

    unmount()

    expect(revokeSpy).toHaveBeenCalledTimes(2)
    expect(revokeSpy).toHaveBeenCalledWith("blob:mock-preview")

    revokeSpy.mockRestore()
    createSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
//  5. Queue change callback is React-safe
// ---------------------------------------------------------------------------
describe("onQueueChange React safety", () => {
  it("calls onQueueChange once per queue update, not inside a state updater", async () => {
    const onQueueChange = vi.fn()

    const { result } = renderHook(() =>
      useUploadField({
        endpoint: "imageUploader",
        multiple: true,
        maxFiles: 3,
        onQueueChange,
      })
    )

    expect(onQueueChange).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.addFiles([createFile("x.png")])
    })

    expect(onQueueChange).toHaveBeenCalledTimes(1)
    expect(onQueueChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ status: "queued" })])
    )

    await act(async () => {
      result.current.removeFile(result.current.fileEntries[0].id)
    })

    expect(onQueueChange).toHaveBeenCalledTimes(2)
    expect(onQueueChange).toHaveBeenLastCalledWith([])
  })
})
