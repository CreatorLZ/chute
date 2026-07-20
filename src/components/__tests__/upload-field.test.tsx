import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, act, fireEvent } from "@testing-library/react"
import { createRef } from "react"
import { UploadField, type UploadFieldHandle } from "../upload-field"

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

function addFilesViaInput(container: HTMLElement, files: File[]) {
  const input = container.querySelector('input[type="file"]')!
  fireEvent.change(input, { target: { files } })
}

// ---------------------------------------------------------------------------
//  Focus moves to Retry button after a failure
// ---------------------------------------------------------------------------
describe("focus management", () => {
  it("moves focus to the Retry button after an upload failure", async () => {
    mockUploadFiles.mockRejectedValue(new Error("Upload failed"))

    const ref = createRef<UploadFieldHandle>()
    const { container } = render(
      <UploadField ref={ref} endpoint="imageUploader" multiple maxFiles={3} />
    )

    // Add a file via the hidden input
    await act(async () => {
      addFilesViaInput(container, [createFile("a.png")])
    })

    // Wait for React state to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    // Trigger upload (fails because mock rejects)
    await act(async () => {
      await expect(ref.current?.uploadAll()).rejects.toBeDefined()
    })

    // The Retry button should now exist and be focused
    const retryButton = container.querySelector<HTMLButtonElement>(
      '[data-retry-button]'
    )
    expect(retryButton).toBeTruthy()
    expect(document.activeElement).toBe(retryButton)
  })
})

// ---------------------------------------------------------------------------
//  Two UploadField instances scope focus independently
// ---------------------------------------------------------------------------
describe("two-field focus scoping", () => {
  it("each field scopes retry focus to its own Retry button", async () => {
    mockUploadFiles.mockRejectedValue(new Error("Upload failed"))

    const ref1 = createRef<UploadFieldHandle>()
    const ref2 = createRef<UploadFieldHandle>()

    const { container } = render(
      <div>
        <div data-testid="field1">
          <UploadField ref={ref1} endpoint="imageUploader" multiple maxFiles={3} />
        </div>
        <div data-testid="field2">
          <UploadField ref={ref2} endpoint="imageUploader" multiple maxFiles={3} />
        </div>
      </div>
    )

    const field1 = container.querySelector('[data-testid="field1"]')!
    const field2 = container.querySelector('[data-testid="field2"]')!

    // Add a file to field 1
    await act(async () => {
      addFilesViaInput(field1 as HTMLElement, [createFile("a.png")])
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    // Add a file to field 2
    await act(async () => {
      addFilesViaInput(field2 as HTMLElement, [createFile("b.png")])
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    // Upload both (both fail)
    await act(async () => {
      await expect(ref1.current?.uploadAll()).rejects.toBeDefined()
    })

    await act(async () => {
      await expect(ref2.current?.uploadAll()).rejects.toBeDefined()
    })

    // Each field should have its own Retry button
    const retry1 = field1.querySelector<HTMLButtonElement>("[data-retry-button]")
    const retry2 = field2.querySelector<HTMLButtonElement>("[data-retry-button]")
    expect(retry1).toBeTruthy()
    expect(retry2).toBeTruthy()

    // field1's retry button should be within field1, not field2
    expect(field1.contains(retry1)).toBe(true)
    expect(field2.contains(retry2)).toBe(true)
  })
})
