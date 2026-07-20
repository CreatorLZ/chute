# Upload Field

UploadThing-backed upload field for Next.js App Router projects.

```bash
npx shadcn add http://localhost:3000/r/upload-field.json
npx shadcn add http://localhost:3000/r/upload-presets.json
```

> **Auth integration warning:** The starter router rejects all uploads by default. See [Environment](#environment) for details.

## What It Ships

- `useUploadField()` headless queue/upload engine
- `<UploadField />` styled default component
- `<AvatarUpload />`, `<AttachmentUpload />`, `<ImageUpload />`, and `<InstantUpload />` preset components
- `UploadFieldHandle` for parent form submit flows
- `UploadedFile`, `UploadStatus`, `UploadMode`, `UploadError`, and queue types
- App Router UploadThing route at `src/app/api/uploadthing`
- Local `Attachment` primitives for file rows, inspired by shadcn/ui's attachment anatomy

## Presets

Presets are thin wrappers over `UploadField`, so they stay easy to customize and do not duplicate upload logic.

```tsx
import {
  AttachmentUpload,
  AvatarUpload,
  ImageUpload,
  InstantUpload,
} from "@/components/upload-presets"
```

### Avatar

```tsx
<AvatarUpload
  value={avatar}
  onChange={setAvatar}
/>
```

### Attachments

```tsx
<AttachmentUpload
  value={attachments}
  onChange={setAttachments}
/>
```

### Image Gallery

```tsx
<ImageUpload
  maxFiles={8}
  value={images}
  onChange={setImages}
/>
```

### Instant Upload

```tsx
<InstantUpload
  value={files}
  onChange={setFiles}
/>
```

## Manual Upload, Form Submit

Manual mode is the default. Files are queued for review first, then uploaded when the form submits.

```tsx
"use client"

import { useRef } from "react"
import { Controller, useForm } from "react-hook-form"
import { UploadField, type UploadFieldHandle } from "@/components/upload-field"
import type { UploadedFile } from "@/hooks/use-upload-field"

type FormValues = {
  attachments: UploadedFile[]
}

export function ExampleForm() {
  const uploadRef = useRef<UploadFieldHandle>(null)
  const { control, handleSubmit, getValues } = useForm<FormValues>({
    defaultValues: { attachments: [] },
  })

  async function onSubmit() {
    try {
      await uploadRef.current?.uploadAll()
    } catch {
      // Keep the form open: failed files stay in the field for retry/removal.
      return
    }
    const values = getValues()
    console.log(values.attachments)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="attachments"
        control={control}
        render={({ field }) => (
          <UploadField
            ref={uploadRef}
            endpoint="attachmentUploader"
            multiple
            maxFiles={5}
            value={field.value}
            onChange={field.onChange}
            accept={["image/*", "application/pdf"]}
          />
        )}
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

## Auto Upload

Use auto mode for chat-style flows where selection should upload immediately.

```tsx
<UploadField
  endpoint="attachmentUploader"
  uploadMode="auto"
  multiple
  value={files}
  onChange={setFiles}
/>
```

## Validation

Validation is library-neutral.

```tsx
<UploadField
  endpoint="attachmentUploader"
  multiple
  validate={(files) => {
    const tooLarge = files.find((file) => file.size > 10 * 1024 * 1024)
    return tooLarge ? `${tooLarge.name} is larger than 10MB.` : undefined
  }}
  beforeUpload={async (files) => {
    // Run async checks here.
  }}
/>
```

## Custom File Row

Use `renderFile` when the default row is close but not quite your product.

```tsx
<UploadField
  endpoint="attachmentUploader"
  multiple
  renderFile={(entry, actions) => (
    <div className="flex items-center justify-between rounded-md border p-2">
      <span>{entry.file.name}</span>
      {entry.status === "failed" ? (
        <button type="button" onClick={actions.retry}>Retry</button>
      ) : (
        <button type="button" onClick={actions.remove}>Remove</button>
      )}
    </div>
  )}
/>
```

## Environment

Set `UPLOADTHING_TOKEN` in `.env`.

```env
UPLOADTHING_TOKEN=...
```

The starter router **rejects all uploads by default** until you wire in your auth. An UploadThing token is not user authentication. Replace `getUploadUser()` in `src/app/api/uploadthing/core.ts` with your project's auth lookup. See the inline comment in that file for an example.

## Route Presets

The demo router includes:

- `avatarUploader`: single image, `4MB`
- `imageUploader`: up to 10 images, `16MB` each
- `attachmentUploader`: images and PDFs up to `16MB`, text up to `4MB`

Adjust these limits to match the product using the component.

## V1 Registry Endpoints

This project now serves a local shadcn registry from the Next app.

Catalog:

```bash
http://localhost:3000/r/registry.json
```

Items:

```bash
http://localhost:3000/r/attachment.json
http://localhost:3000/r/upload-router.json
http://localhost:3000/r/upload-field.json
http://localhost:3000/r/upload-presets.json
```

Local install test from a fresh App Router project:

```bash
npx shadcn add http://localhost:3000/r/upload-field.json
npx shadcn add http://localhost:3000/r/upload-presets.json
```

`upload-field` depends on `upload-router`, so the UploadThing route files and `UPLOADTHING_TOKEN` placeholder are installed with it. Set a real token and replace the fail-closed `getUploadUser()` implementation before testing uploads.

The registry can be served in two modes:

- **Dynamic (dev):** Next.js route handlers resolve each item at request time. Run `npm run dev`.
- **Static (production):** Pre-built JSON files in `public/r/`. Run `npm run registry:build` then deploy the `public/` folder.

### Dependency Resolution

The shadcn CLI resolves `registryDependencies` as follows:

- **Known shadcn items** (`button`, `card`, `progress`) — fetched from the default shadcn registry.
- **Full URLs** (`http://...`) — fetched directly.
- **Plain names** — fallback; only works for default shadcn items.

Because local custom items (`attachment`, `upload-router`) must be full URLs:

| Mode | Resolution | Source |
|---|---|---|
| Dynamic (`/r/*.json`) | `{origin}/r/{dep}.json` | Request URL at runtime |
| Static (`public/r/*.json`) | `{origin}/r/{dep}.json` | `homepage` from `registry.json` or `REGISTRY_ORIGIN` env var |

Set `REGISTRY_ORIGIN` before `npm run registry:build` for deployable output:

```bash
REGISTRY_ORIGIN=https://your-domain.com npm run registry:build
```

If omitted, `homepage` in `registry.json` is used (defaults to `http://localhost:3000`). A warning is printed for localhost origins but the build proceeds — useful for local testing.

> **One-time-copy limitation:** Once installed via `npx shadcn add`, the code is copied into your project and does not receive updates. Re-run the install command to pick up new versions.

### Verification

```bash
npm run registry:build   # Generate static JSON files
npm run registry:check   # Validate registry.json and verify output
npm run test             # Run unit tests
```
