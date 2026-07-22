# Chute — AI Agent Guide

Chute is a file-upload component library for Next.js App Router + shadcn/ui + UploadThing. It ships a headless upload hook (`useUploadField`), a styled `<UploadField />` component, and four presets (`AvatarUpload`, `AttachmentUpload`, `ImageUpload`, `InstantUpload`). It also serves as a **shadcn registry** — run `npx shadcn add` to install components into any project.

- **Registry (live):** https://chuteui.vercel.app
- **Repo:** https://github.com/CreatorLZ/chute
- **Package deps:** `next` (App Router), `react`, `uploadthing`, `@uploadthing/react`, `tailwindcss`, `@base-ui/react`, `react-hook-form` (optional)

---

## Install

**Prerequisites:** Next.js App Router project with shadcn/ui initialized.

```sh
# Core — the UploadField component, hook, UploadThing routes, and UI primitives
npx shadcn add https://chuteui.vercel.app/r/upload-field.json

# Optional — four preset components (AvatarUpload, AttachmentUpload, etc.)
npx shadcn add https://chuteui.vercel.app/r/upload-presets.json
```

This copies source files into the consumer project. Future updates require re-running the command.

---

## UploadThing token

Get a token at https://uploadthing.com/dashboard and set it in `.env.local`:

```
UPLOADTHING_TOKEN=sk_live_...
```

The token identifies the app to UploadThing. It is NOT user authentication.

---

## Auth (⚠️ critical)

The installed router at `src/app/api/uploadthing/core.ts` ships with **demo auth that allows all uploads**:

```ts
async function getUploadUser(): Promise<{ uploadedBy: string }> {
  return { uploadedBy: "demo-user" }
}
```

**⚠️ YOU MUST REPLACE THIS BEFORE PRODUCTION.** Find `getUploadUser` in `src/app/api/uploadthing/core.ts` and swap it with real auth. A production example is commented in the same file.

---

## Basic usage

### Manual upload (form submit)

```tsx
import { useRef } from "react"
import { UploadField, type UploadFieldHandle } from "@/components/upload-field"
import type { UploadedFile } from "@/hooks/use-upload-field"

function Form() {
  const ref = useRef<UploadFieldHandle>(null)

  async function handleSubmit() {
    if (!ref.current) return
    await ref.current.uploadAll()
    // All files uploaded — values are now in the UploadField's onChange
  }

  return (
    <form onSubmit={handleSubmit}>
      <UploadField
        ref={ref}
        endpoint="attachmentUploader"
        multiple
        maxFiles={5}
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

### With react-hook-form

```tsx
<Controller
  name="attachments"
  control={control}
  render={({ field }) => (
    <UploadField
      ref={uploadRef}
      endpoint="attachmentUploader"
      multiple
      value={field.value}
      onChange={field.onChange}
    />
  )}
/>
```

### Auto upload (chat-style)

```tsx
<UploadField
  endpoint="attachmentUploader"
  uploadMode="auto"
  multiple
/>
```

### Validation

```tsx
<UploadField
  validate={(files) =>
    files.find((f) => f.size > 10 * 1024 * 1024)
      ? "File too large" : undefined
  }
  beforeUpload={async (files) => {
    // Async checks — throw to reject
  }}
/>
```

---

## Presets

| Component | Endpoint | Max | Accepts | Mode |
|---|---|---|---|---|
| `AvatarUpload` | `avatarUploader` | 1 | images | manual |
| `AttachmentUpload` | `attachmentUploader` | 5 | images, PDF, text | manual |
| `ImageUpload` | `imageUploader` | 10 | images | manual |
| `InstantUpload` | `attachmentUploader` | 3 | images, PDF | auto |

Import from `@/components/upload-presets`. Each accepts the same props as `UploadField` with sensible defaults.

---

## API reference

### `UploadField` props

| Prop | Type | Default |
|---|---|---|
| `endpoint` | `keyof OurFileRouter` | required |
| `multiple` | `boolean` | `false` |
| `maxFiles` | `number` | `1` |
| `accept` | `string[]` | — |
| `uploadMode` | `"manual" \| "auto"` | `"manual"` |
| `validate` | `(files: File[]) => string \| undefined` | — |
| `beforeUpload` | `(files: File[]) => Promise<void> \| void` | — |
| `renderFile` | `(entry, actions) => ReactNode` | — |
| `renderUploadedFile` | `(file, actions) => ReactNode` | — |
| `classNames` | `UploadFieldClassNames` | — |
| `value` | `UploadedFile \| null` (single) or `UploadedFile[]` (multi) | — |
| `onChange` | `(value) => void` | — |

### Ref handle (`UploadFieldHandle`)

```ts
uploadAll(): Promise<UploadedFile[]>  // upload queued + failed files
clear(): void                          // clear all
```

### Key types

Import from `@/hooks/use-upload-field`:

- `UploadedFile` — `{ id: string; url: string; name: string; size: number }`
- `UploadStatus` — `"queued" | "uploading" | "failed" | "retrying"`
- `UploadMode` — `"manual" | "auto"`
- `UploadFailedError` — `Error` with `.uploadedFiles` and `.failedFiles`
- `FileEntry` — full per-file state

Import from `@/components/upload-field`:

- `UploadFieldHandle`
- `UploadFileActions` — `{ remove(): void; retry(): void }`
- `UploadedFileActions` — `{ open(): void; remove(): void }`

---

## Constraints agents must not overlook

1. **Demo auth is not for production.** Replace `getUploadUser()` in `src/app/api/uploadthing/core.ts` with real auth. The file has a visible banner warning.
2. **One-time copy.** `npx shadcn add` copies files — they don't auto-update.
3. **Next.js App Router only.** Pages Router is not supported.
4. **UploadThing only.** No multi-provider abstraction.
5. **The UploadThing token is not auth.** It identifies the app, not the user. Never use it as an authorization check.
