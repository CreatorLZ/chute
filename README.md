# Chute

[UploadThing](https://uploadthing.com)-powered file upload components for Next.js App Router and shadcn/ui projects.

```bash
npx shadcn add https://chuteui.vercel.app/r/upload-field.json
npx shadcn add https://chuteui.vercel.app/r/upload-presets.json
```

## What it is

Chute fills a narrow gap: [UploadThing](https://uploadthing.com) ships functional upload primitives but lacks styled, form-integrated UI. Chute is the intersection — upload components designed for projects that use both shadcn/ui and [UploadThing](https://uploadthing.com).

## What ships

| Layer                 | Description                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `useUploadField()`    | Headless queue/upload engine — selection, async validation, progress, per-file retry, object URL lifecycle       |
| `<UploadField />`     | Styled default component — drag-and-drop, previews, progress bars, keyboard operability, aria-live announcements |
| 2 presets             | `AvatarUpload`, `AttachmentUpload` — thin wrappers over `UploadField`                                            |
| File Router           | [UploadThing](https://uploadthing.com) `FileRouter` with `avatarUploader`, `imageUploader`, `attachmentUploader` endpoints                  |

## Quick start

```bash
npm install
npm run dev
# http://localhost:3000
```

### Install into your own project

```bash
npx shadcn add https://chuteui.vercel.app/r/upload-field.json
```

Installs the core `UploadField` component, `useUploadField` hook, [UploadThing](https://uploadthing.com) route, and UI primitives (`button`, `card`, `progress`, `attachment`). Writes `UPLOADTHING_TOKEN` to `.env.local`.

```bash
npx shadcn add https://chuteui.vercel.app/r/upload-presets.json
```

Also installs the two presets (`AvatarUpload`, `AttachmentUpload`). Requires `upload-field` first.

## Presets

### AvatarUpload

Single image upload with a centered circular dropzone, drag-and-drop, and in-preview upload button.

```tsx
import { useRef, useState } from "react";
import { AvatarUpload } from "@/components/upload-presets";
import type { UploadFieldHandle } from "@/components/upload-field";
import type { UploadedFile } from "@/hooks/use-upload-field";

function AvatarField() {
  const ref = useRef<UploadFieldHandle>(null);
  const [value, setValue] = useState<UploadedFile | null>(null);

  const handleSave = () => ref.current?.uploadAll();

  return (
    <AvatarUpload
      ref={ref}
      value={value}
      onChange={setValue}
      endpoint="avatarUploader"
    />
  );
}
```

### AttachmentUpload

Multi-file chat-style uploader with a dropdown file picker, screenshot capture, and manual upload button. Accepts images, PDF, and text files.

```tsx
import { useRef, useState } from "react";
import { AttachmentUpload } from "@/components/upload-presets";
import type { UploadFieldHandle } from "@/components/upload-field";
import type { UploadedFile } from "@/hooks/use-upload-field";

function UploadField() {
  const ref = useRef<UploadFieldHandle>(null);
  const [value, setValue] = useState<UploadedFile[]>([]);

  const handleSend = () => ref.current?.uploadAll();

  return (
    <AttachmentUpload
      ref={ref}
      value={value}
      onChange={setValue}
      endpoint="attachmentUploader"
    />
  );
}
```

## Base UploadField usage

### Manual upload (form submit)

```tsx
const uploadRef = useRef<UploadFieldHandle>(null);

async function onSubmit() {
  const ref = uploadRef.current;
  if (!ref) return;
  await ref.uploadAll();
  const values = getValues();
}

// <UploadField ref={uploadRef} endpoint="attachmentUploader" multiple />
```

### Auto upload (chat-style)

```tsx
<UploadField endpoint="attachmentUploader" uploadMode="auto" multiple />
```

### With react-hook-form

```tsx
<Controller
  name="attachments"
  control={control}
  render={({ field }) => (
    <UploadField
      multiple
      endpoint="attachmentUploader"
      value={field.value}
      onChange={field.onChange}
    />
  )}
/>
```

### Validation

```tsx
<UploadField
  validate={(files) =>
    files.find((f) => f.size > 10 * 1024 * 1024) ? "File too large" : undefined
  }
  beforeUpload={async (files) => {
    // Async checks here
  }}
/>
```

## Auth

[UploadThing](https://uploadthing.com) requires a token. Getting one takes 30 seconds — no credit card needed:

1. Sign in at [uploadthing.com/dashboard](https://uploadthing.com/dashboard)
2. Create an app and copy the token (starts with `sk_live_`)
3. Create `.env.local` in your project root:

```env
UPLOADTHING_TOKEN=sk_live_...
```

The demo router allows all uploads (returns `{ uploadedBy: "demo-user" }`). **Replace `getUploadUser()` in `src/app/api/uploadthing/core.ts` with your own auth before deploying to production.**

> If you're using an AI agent, just tell it: *"I need an [UploadThing](https://uploadthing.com) token"* — the agent will walk you through it. It's one file edit and one `.env` line.

## Registry

Serves as a shadcn registry in two modes:

- **Dynamic (dev):** Next.js route handlers resolve items at request time
- **Static (prod):** Pre-built JSON files in `public/r/` via `npm run registry:build`

Set `REGISTRY_ORIGIN` before static build for deployable output:

```bash
REGISTRY_ORIGIN=https://chuteui.vercel.app npm run registry:build
```

## Commands

| Command                  | Purpose                    |
| ------------------------ | -------------------------- |
| `npm run dev`            | Development server         |
| `npm run build`          | Production build           |
| `npm test`               | Run tests                  |
| `npm run lint`           | Lint                       |
| `npm run registry:build` | Build static registry JSON |
| `npm run registry:check` | Validate registry          |

---

Full API documentation at [DOCS.md](./DOCS.md).
