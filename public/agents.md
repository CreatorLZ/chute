# Chute — AI Agent Guide

Chute is a file-upload component library for Next.js App Router + shadcn/ui + [UploadThing](https://uploadthing.com). It ships a headless upload hook (`useUploadField`), a styled `<UploadField />` component, and two presets (`AvatarUpload`, `AttachmentUpload`). It also serves as a **shadcn registry** — run `npx shadcn add` to install components into any project.

- **Registry (live):** https://chuteui.vercel.app
- **Repo:** https://github.com/CreatorLZ/chute
- **Package deps:** `next` (App Router), `react`, `uploadthing`, `@uploadthing/react`, `tailwindcss`, `@base-ui/react`, `react-hook-form` (optional)

---

## Install

**Prerequisites:** Next.js App Router project with shadcn/ui initialized.

```sh
# Core — the UploadField component, hook, [UploadThing](https://uploadthing.com) routes, and UI primitives
npx shadcn add https://chuteui.vercel.app/r/upload-field.json

# Optional — two preset components (AvatarUpload, AttachmentUpload)
npx shadcn add https://chuteui.vercel.app/r/upload-presets.json
```

This copies source files into the consumer project. Future updates require re-running the command.

---

## [UploadThing](https://uploadthing.com) token

**Required. 30 seconds. Free.**

1. Sign in at [uploadthing.com/dashboard](https://uploadthing.com/dashboard)
2. Create an app, copy the token
3. Paste it into `.env.local`:

```
UPLOADTHING_TOKEN=sk_live_...
```

That's it. The token identifies the app to [UploadThing](https://uploadthing.com) — it is NOT user authentication. The `npx shadcn add` commands will also prompt for this token automatically during install.

> **AI agents:** This is the one manual step the developer needs. Tell them: *"Go to uploadthing.com/dashboard, create an app, and paste the token into `.env.local`."* Then continue with setup.

---

## Auth (⚠️ critical)

The installed router at `src/app/api/uploadthing/core.ts` ships with **demo auth that allows all uploads**:

```ts
async function getUploadUser(): Promise<{ uploadedBy: string }> {
  return { uploadedBy: "demo-user" };
}
```

**⚠️ YOU MUST REPLACE THIS BEFORE PRODUCTION.** Find `getUploadUser` in `src/app/api/uploadthing/core.ts` and swap it with real auth. A production example is commented in the same file.

---

## Basic usage

### Manual upload (form submit)

```tsx
import { useRef } from "react";
import { UploadField, type UploadFieldHandle } from "@/components/upload-field";
import type { UploadedFile } from "@/hooks/use-upload-field";

function Form() {
  const ref = useRef<UploadFieldHandle>(null);

  async function handleSubmit() {
    if (!ref.current) return;
    await ref.current.uploadAll();
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
  );
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
<UploadField endpoint="attachmentUploader" uploadMode="auto" multiple />
```

### Validation

```tsx
<UploadField
  validate={(files) =>
    files.find((f) => f.size > 10 * 1024 * 1024) ? "File too large" : undefined
  }
  beforeUpload={async (files) => {
    // Async checks — throw to reject
  }}
/>
```

---

## Presets

| Component          | Endpoint             | Max | Accepts           | Mode   |
| ------------------ | -------------------- | --- | ----------------- | ------ |
| `AvatarUpload`     | `avatarUploader`     | 1   | images            | manual |
| `AttachmentUpload` | `attachmentUploader` | 5   | images, PDF, text | manual |


Import from `@/components/upload-presets`. Each accepts the same props as `UploadField` with sensible defaults.

**`AvatarUpload`** — single image with a centered circular dropzone and in-preview upload button:
```tsx
import { useRef, useState } from "react"
import { AvatarUpload } from "@/components/upload-presets"
import type { UploadFieldHandle } from "@/components/upload-field"
import type { UploadedFile } from "@/hooks/use-upload-field"

function AvatarField() {
  const ref = useRef<UploadFieldHandle>(null)
  const [value, setValue] = useState<UploadedFile | null>(null)
  return <AvatarUpload ref={ref} value={value} onChange={setValue} />
}
```

**`AttachmentUpload`** — multi-file chat-style uploader with dropdown file picker, screenshot capture, and textarea. Files queue for manual upload via the send button:
```tsx
import { useRef, useState } from "react"
import { AttachmentUpload } from "@/components/upload-presets"
import type { UploadFieldHandle } from "@/components/upload-field"
import type { UploadedFile } from "@/hooks/use-upload-field"

function ChatUpload() {
  const ref = useRef<UploadFieldHandle>(null)
  const [value, setValue] = useState<UploadedFile[]>([])
  return <AttachmentUpload ref={ref} value={value} onChange={setValue} />
}
```

---

## API reference

### `UploadField` props

| Prop                 | Type                                                        | Default    |
| -------------------- | ----------------------------------------------------------- | ---------- |
| `endpoint`           | `keyof OurFileRouter`                                       | required   |
| `multiple`           | `boolean`                                                   | `false`    |
| `maxFiles`           | `number`                                                    | `1`        |
| `accept`             | `string[]`                                                  | —          |
| `uploadMode`         | `"manual" \| "auto"`                                        | `"manual"` |
| `validate`           | `(files: File[]) => string \| undefined`                    | —          |
| `beforeUpload`       | `(files: File[]) => Promise<void> \| void`                  | —          |
| `renderFile`         | `(entry, actions) => ReactNode`                             | —          |
| `renderUploadedFile` | `(file, actions) => ReactNode`                              | —          |
| `classNames`         | `UploadFieldClassNames`                                     | —          |
| `value`              | `UploadedFile \| null` (single) or `UploadedFile[]` (multi) | —          |
| `onChange`           | `(value) => void`                                           | —          |

### Ref handle (`UploadFieldHandle`)

```ts
uploadAll(): Promise<UploadedFile[]>  // upload queued + failed files
clear(): void                          // clear all
openFileDialog(): void                 // open native file picker
addFiles(files: File[]): void          // programmatically add files
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
4. **[UploadThing](https://uploadthing.com) only.** No multi-provider abstraction.
5. **The [UploadThing](https://uploadthing.com) token is not auth.** It identifies the app, not the user. Never use it as an authorization check.
