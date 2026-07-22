# Chute

UploadThing-powered file upload components for Next.js App Router and shadcn/ui projects.

```bash
npx shadcn add https://your-vercel-app.vercel.app/r/upload-field.json
```

> **Update the URL** after deploying — see [Deploy your own](#deploy-your-own) below.

## What it is

Chute fills a narrow gap: UploadThing ships functional upload primitives but lacks styled, form-integrated UI. Chute is the intersection — upload components designed for projects that use both shadcn/ui and UploadThing.

## What ships

| Layer | Description |
|---|---|
| `useUploadField()` | Headless queue/upload engine — selection, async validation, progress, per-file retry, object URL lifecycle |
| `<UploadField />` | Styled default component — drag-and-drop, previews, progress bars, keyboard operability, aria-live announcements |
| 4 presets | `AvatarUpload`, `AttachmentUpload`, `ImageUpload`, `InstantUpload` — thin wrappers over `UploadField` |
| File Router | UploadThing `FileRouter` with `avatarUploader`, `imageUploader`, `attachmentUploader` endpoints |

## Quick start

```bash
npm install
npm run dev
# http://localhost:3000
```

Uploads fail until you wire in auth — see [Auth](#auth).

### Install into your own project

```bash
npx shadcn add https://your-vercel-app.vercel.app/r/upload-field.json
npx shadcn add https://your-vercel-app.vercel.app/r/upload-presets.json
```

This installs all source files into `src/`, resolves dependency chains, and writes `UPLOADTHING_TOKEN` to `.env.local`.

## Usage

### Manual upload (form submit)

```tsx
const uploadRef = useRef<UploadFieldHandle>(null)

async function onSubmit() {
  const ref = uploadRef.current
  if (!ref) return
  await ref.uploadAll()
  const values = getValues()
}

// Pass uploadRef to UploadField via its ref prop:
// <UploadField ref={uploadRef} endpoint="attachmentUploader" multiple />
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
    // Async checks here
  }}
/>
```

### Custom file row

```tsx
<UploadField
  renderFile={(entry, actions) => <YourCustomRow />}
  renderUploadedFile={(file, actions) => <YourCustomPreview />}
/>
```

## Auth

The starter router **rejects all uploads by default**. Two things are needed:

1. **`UPLOADTHING_TOKEN`** — set in `.env.local` (get one at [uploadthing.com/dashboard](https://uploadthing.com/dashboard))
2. **`getUploadUser()`** — replace the fail-closed stub in `src/app/api/uploadthing/core.ts` with your app's auth lookup

## Deploy your own

Chute is a Next.js App Router project. Deploy it on Vercel:

1. Push to GitHub
2. Import into Vercel
3. Set `UPLOADTHING_TOKEN` in environment variables
4. Deploy

After deploying, update the install URLs above to point to your Vercel domain.

## Registry

Serves as a shadcn registry in two modes:

- **Dynamic (dev):** Next.js route handlers resolve items at request time
- **Static (prod):** Pre-built JSON files in `public/r/` via `npm run registry:build`

Set `REGISTRY_ORIGIN` before static build for deployable output:

```bash
REGISTRY_ORIGIN=https://your-domain.com npm run registry:build
```

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Run tests |
| `npm run lint` | Lint |
| `npm run registry:build` | Build static registry JSON |
| `npm run registry:check` | Validate registry |

---

Full API documentation at [DOCS.md](./DOCS.md).
