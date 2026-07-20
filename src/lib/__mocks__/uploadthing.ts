import { vi } from "vitest"

export const uploadFiles = vi.fn(async () => {
  throw new Error("Upload failed")
})

export const useUploadThing = vi.fn(() => ({
  startUpload: vi.fn(),
  permittedFileInfo: undefined,
}))
