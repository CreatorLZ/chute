# Chute

UploadThing-powered file upload components for Next.js App Router and shadcn/ui projects.

```bash
npx shadcn add https://chuteui.vercel.app/r/upload-field.json
```

## What it is

Chute fills a narrow gap: UploadThing ships functional upload primitives but lacks styled, form-integrated UI. Chute is the intersection — upload components designed for projects that use both shadcn/ui and UploadThing.

## What ships

| Layer              | Description                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `useUploadField()` | Headless queue/upload engine — selection, async validation, progress, per-file retry, object URL lifecycle       |
| `<UploadField />`  | Styled default component — drag-and-drop, previews, progress bars, keyboard operability, aria-live announcements |
| 2 presets          | `AvatarUpload`, `AttachmentUpload` — thin wrappers over `UploadField`            |
| File Router        | UploadThing `FileRouter` with `avatarUploader`, `imageUploader`, `attachmentUploader` endpoints                  |

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

Installs the core `UploadField` component, `useUploadField` hook, UploadThing route, and UI primitives (`button`, `card`, `progress`, `attachment`). Writes `UPLOADTHING_TOKEN` to `.env.local`.

```bash
npx shadcn add https://chuteui.vercel.app/r/upload-presets.json
```

Also installs the two presets (`AvatarUpload`, `AttachmentUpload`). Requires `upload-field` first.

## Usage

### Manual upload (form submit)

```tsx
const uploadRef = useRef<UploadFieldHandle>(null);

async function onSubmit() {
  const ref = uploadRef.current;
  if (!ref) return;
  await ref.uploadAll();
  const values = getValues();
}

// Pass uploadRef to UploadField via its ref prop:
// <UploadField ref={uploadRef} endpoint="attachmentUploader" multiple />
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

The demo router allows all uploads (returns `{ uploadedBy: "demo-user" }`). **Replace `getUploadUser()` in `src/app/api/uploadthing/core.ts` with your own auth before deploying to production.** You'll also need an UploadThing token:

1. Get a token at [uploadthing.com/dashboard](https://uploadthing.com/dashboard)
2. Set it in `.env.local`:

```env
UPLOADTHING_TOKEN=sk_live_...
```

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
