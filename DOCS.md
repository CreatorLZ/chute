# chute

UploadThing-backed file upload components for Next.js App Router + shadcn/ui projects.

---

## What chute is

chute fills a narrow, real gap: UploadThing ships functional upload primitives (`generateUploadButton`, `generateUploadDropzone`) that work but lack styled, form-integrated UI. shadcn-compatible upload components already exist (Shadcnblocks, shadcn-extension) but none bundle real UploadThing wiring. chute is the intersection: upload components designed for projects that use both shadcn/ui and UploadThing.

chute is not:

- A hosted SaaS product
- A no-code tool
- A replacement for or reseller of UploadThing
- A multi-provider upload abstraction layer

---

## What it ships

Four layers, each independently usable:

**`useUploadField` hook** (`src/hooks/use-upload-field.ts`)\
Headless queue-upload engine. Manages file selection, queuing, async validation, progress tracking, per-file retry, and object URL lifecycle. No markup, no styling — usable by any component that needs upload logic.

**`<UploadField>` component** (`src/components/upload-field.tsx`)\
Styled default component built on the hook. Drag-and-drop dropzone, click-to-browse fallback, file previews, progress bars, retry-on-failure, keyboard operability, `aria-live` announcements, scoped focus management. `react-hook-form` compatible via `Controller`. Supports manual (queue-then-submit) and auto (upload-on-select) modes.

**Preset components** (`src/components/upload-presets.tsx`)\
Thin wrappers over `UploadField` for common patterns:

| Component | Default endpoint | Max files | Accepts | Upload mode |
|---|---|---|---|---|
| `AvatarUpload` | `avatarUploader` | 1 | `image/*` | manual |
| `AttachmentUpload` | `attachmentUploader` | 5 | images, PDF, text | manual |
| `ImageUpload` | `imageUploader` | 10 | `image/*` | manual |
| `InstantUpload` | `attachmentUploader` | 3 | images, PDF | auto |

Presets do not duplicate upload logic. Each is a thin wrapper — easy to read and customize by editing the installed component directly.

**File Router** (`src/app/api/uploadthing/core.ts` and `route.ts`)\
UploadThing `FileRouter` defining three endpoints (`avatarUploader`, `imageUploader`, `attachmentUploader`) with per-type size and count limits. Includes a dev-mode auth bypass and a production auth example in comments.

---

## Demo app

The project includes a working demo app (`src/app/page.tsx`) that renders all four presets on a single page under `react-hook-form` via `Controller`. It demonstrates:

- Single-file upload with `AvatarUpload` and `value: UploadedFile | null`
- Multi-file manual upload with `AttachmentUpload` and `value: UploadedFile[]`
- Image-only multi-file upload with `ImageUpload` and configurable `maxFiles`
- Auto-upload mode with `InstantUpload` (files upload on selection, no submit step)
- Form-level submit that waits for all pending uploads via ref handles
- Display of submitted metadata after upload (file id, url, name, size)

**To run the demo:**

```bash
npm install
npm run dev
# Open http://localhost:3000
```

Uploads will fail until auth is configured (see Auth section below).

---

## Auth integration

The installed router fails closed by default. Set `UPLOADTHING_TOKEN` for UploadThing itself, then replace `getUploadUser()` with your application's server-side auth lookup before uploads can succeed. A token is not user authentication and must never be used as an authorization check.

The starter file router (`src/app/api/uploadthing/core.ts`) fails closed until you replace its auth lookup:

```ts
async function getUploadUser(): Promise<{ uploadedBy: string }> {
  throw new UploadThingError(
    "Unauthorized: replace getUploadUser() with your application's auth lookup."
  )
  /* Historical insecure example. Do not use this as authorization:
  if (!process.env.UPLOADTHING_TOKEN) {
    throw new UploadThingError(
      "Unauthorized — set UPLOADTHING_TOKEN in .env.local"
    )
  }
  return { uploadedBy: "demo-user" }
  */
}
```

Uploads remain rejected after setting `UPLOADTHING_TOKEN` until `getUploadUser()` is replaced with real application authentication.

**For production**, replace `getUploadUser` with your project's auth lookup. An example using a generic auth helper is included as a comment in the same file. The return value (`uploadedBy`) is available in `onUploadComplete` metadata and can be used for audit trails or access control.

**Setup steps:**

1. Sign in at https://uploadthing.com/dashboard
2. Create an app and copy its API token
3. Create `.env.local` at the project root:

```
UPLOADTHING_TOKEN=sk_live_...
```

4. Restart the dev server.

`.env.example` documents the token format without exposing a credential.

---

## Registry

chute serves as a shadcn registry, allowing installation into any Next.js App Router project that uses shadcn/ui components.

### Registry items

| Item | Type | Source files | Dependencies |
|---|---|---|---|
| `upload-field` | `registry:component` | `upload-field.tsx`, `use-upload-field.ts`, `uploadthing.ts` | shadcn `button`, `card`, `progress` + `attachment` + `upload-router` |
| `upload-presets` | `registry:component` | `upload-presets.tsx` | `upload-field` |
| `upload-router` | `registry:file` | `core.ts`, `route.ts` | — |
| `attachment` | `registry:ui` | `attachment.tsx` | — |

### Serving modes

**Dynamic (development):** Next.js route handlers (`/r/[...name]/route.ts`) resolve each item at request time, inlining source file contents. Local `registryDependencies` are resolved to full URLs based on the request origin. Run `npm run dev`.

**Static (production):** Pre-built JSON files are generated into `public/r/` via:

```bash
npm run registry:build
```

The build process:
1. `shadcn build` reads `registry.json` and generates JSON output with inlined file contents and plain-name dependencies.
2. A post-build step (`scripts/rewrite-registry-deps.mjs`) replaces local plain-name dependencies with full URLs using the registry origin.

### Dependency resolution

The shadcn CLI resolves `registryDependencies` as follows:

- **Known shadcn items** (`button`, `card`, `progress`) — fetched from the default shadcn registry at `https://ui.shadcn.com/r/`.
- **Full URLs** (`http://...` or `https://...`) — fetched directly from that URL.
- **Plain names** — only works for default shadcn items; custom item names (e.g., `attachment`, `upload-router`) must be full URLs.

chute handles this as follows:

| Mode | Origin source | Example output |
|---|---|---|
| Dynamic route | Request URL origin | `http://localhost:3000/r/attachment.json` |
| Static build | `REGISTRY_ORIGIN` env var, falls back to `homepage` in `registry.json` | `https://example.com/r/attachment.json` |

For deployable static output, set the origin explicitly:

```bash
REGISTRY_ORIGIN=https://your-domain.com npm run registry:build
```

If `REGISTRY_ORIGIN` is unset and `homepage` is `http://localhost:3000`, a warning is printed but the build proceeds — usable for local testing.

### Install into a consumer project

From a fresh Next.js App Router project with shadcn initialized:

```bash
npx shadcn add http://localhost:3000/r/upload-field.json
npx shadcn add http://localhost:3000/r/upload-presets.json
```

This installs all source files into the consumer's `src/` directory, resolves dependency chains (including the UploadThing route files and the attachment primitives), and writes `UPLOADTHING_TOKEN` to `.env.local` as a placeholder.

**One-time-copy limitation:** Once installed via `npx shadcn add`, the files are copied into the consumer project. Future fixes or updates to chute will not propagate automatically — the consumer must re-run the install command to pick up changes. This is a property of the shadcn registry model, not a chute-specific limitation.

### Verification commands

```bash
npm run registry:build   # Generate static JSON into public/r/
npm run registry:check   # Validate registry.json and verify static output
npm run test             # Run vitest (10 unit tests)
npm run lint             # Run eslint
npm run build            # Next.js production build
```

---

## Component API

### `<UploadField>`

Core upload component. Propagated props flow through to `useUploadField`.

**Common props (all variants):**

| Prop | Type | Default | Description |
|---|---|---|---|
| `endpoint` | keyof OurFileRouter | (required) | UploadThing router endpoint name |
| `multiple` | boolean | `false` | Allow multiple file selection |
| `maxFiles` | number | 1 | Maximum files (queued + uploaded) |
| `accept` | string[] | — | Accepted MIME types / extensions |
| `uploadMode` | `"manual" \| "auto"` | `"manual"` | Manual queues files for submit; auto uploads on selection |
| `validate` | (files: File[]) => string \| undefined | — | Synchronous validation; return error message to reject files |
| `beforeUpload` | (files: File[]) => Promise\<void\> \| void | — | Async pre-upload check; throw or return rejected promise to block |
| `renderFile` | (entry: FileEntry, actions: UploadFileActions) => ReactNode | — | Custom render for queued/failed file rows |
| `renderUploadedFile` | (file: UploadedFile, actions: UploadedFileActions) => ReactNode | — | Custom render for uploaded file rows |
| `classNames` | UploadFieldClassNames | — | Override CSS classes for each section |

**Single-file variant (`multiple: false` or omitted):**

| Prop | Type | Description |
|---|---|---|
| `value` | `UploadedFile \| null` | Currently uploaded file |
| `onChange` | (value: UploadedFile \| null) => void | Called on upload or removal |

**Multi-file variant (`multiple: true`):**

| Prop | Type | Description |
|---|---|---|
| `value` | `UploadedFile[]` | Currently uploaded files |
| `onChange` | (value: UploadedFile[]) => void | Called on each upload or removal |

`UploadedFile` shape: `{ id: string, url: string, name: string, size: number }`

**Ref handle (`UploadFieldHandle`):**

| Method | Returns | Description |
|---|---|---|
| `uploadAll()` | `Promise<UploadedFile[]>` | Upload all queued and failed entries; rejects with `UploadFailedError` if any file fails |
| `clear()` | void | Cancel all queued entries and clear uploaded files |

### Presets

Each preset is a thin wrapper over `UploadField` with pre-configured defaults. Props not listed below are passed through to `UploadField`.

**`AvatarUpload`:** single image, max 4MB. Additional props: `className` (sets max width on dropzone).

**`AttachmentUpload`:** multi-file, accepts images/PDF/text, up to 5 files. Customizable `endpoint`, `accept`, and `maxFiles`.

**`ImageUpload`:** multi-file, images only, up to 10 files. Customizable `maxFiles`.

**`InstantUpload`:** multi-file, auto-upload mode. Dropzone is compact (no extra padding) for inline use.

### Exported types

Available from `@/hooks/use-upload-field`:

| Type | Definition |
|---|---|
| `UploadedFile` | `{ id: string, url: string, name: string, size: number }` |
| `UploadStatus` | `"queued" \| "uploading" \| "failed" \| "retrying"` |
| `UploadMode` | `"manual" \| "auto"` |
| `UploadError` | `string` |
| `UploadFailedError` | Error containing `uploadedFiles` and `failedFiles` when `uploadAll()` cannot upload every file |
| `FileEntry` | Full per-file state including `file`, `status`, `progress`, `previewUrl`, `error` |

Available from `@/components/upload-field`:

| Type | Description |
|---|---|
| `UploadFieldHandle` | `{ uploadAll(): Promise<UploadedFile[]>, clear(): void }` |
| `UploadFileActions` | `{ remove(): void, retry(): void }` |
| `UploadedFileActions` | `{ open(): void, remove(): void }` |
| `UploadFieldClassNames` | CSS class overrides per section |
| `UploadFieldProps` | Union of single and multi-file prop types |
| `SingleUploadFieldProps` | Props when `multiple` is false or unset |
| `MultiUploadFieldProps` | Props when `multiple` is true |

---

## Development

### Local setup

```bash
npm install
npm run dev       # http://localhost:3000
```

### Test suite

```bash
npm run test      # 10 vitest tests — hook logic + component focus management
npm run lint      # eslint
npm run build     # Next.js production build (also runs TypeScript check)
```

### Registry build

```bash
npm run registry:build    # Generate static JSON in public/r/
npm run registry:check    # Validate + verify output
```

### Fresh-install verification

From a clean clone:

```bash
npm install
npm run build
npm run registry:build
npm run registry:check
npm run test
npm run lint
```

---

## Technical architecture

### Upload flow

```
File select → validateIncomingFiles → addFiles → [manual] uploadAll / [auto] uploadEntries
                  │                        │
                  ├─ capacity check        ├─ concurrent mutex
                  ├─ accept MIME check     ├─ URL.createObjectURL (images)
                  ├─ validate callback     └─ entriesRef.current sync
                  └─ beforeUpload callback
```

1. `validateIncomingFiles` checks capacity (`maxFiles` minus current files minus queued files), MIME acceptance, `validate` callback, and `beforeUpload` callback. Each rejection path sets `uploadError` and returns `[]`.

2. `addFiles` is serialized via a promise mutex (`addFilesMutex`) to prevent concurrent `beforeUpload` calls from both passing the capacity check. The mutex queues each call behind the previous one.

3. Failed uploads trigger per-file retry via `retryFile`, which re-queues the single file through `uploadEntries`.

### State management

File entry state (`FileEntry[]`) is the hook's single source of truth. It tracks:
- **`id`**: unique identifier (timestamp + counter)
- **`file`**: the original `File` object
- **`status`**: lifecycle state (`queued → uploading → [failed | retrying] → removed`)
- **`progress`**: upload progress percentage (0–100)
- **`previewUrl`**: `URL.createObjectURL` for image previews, revoked on upload success or removal
- **`error`**: readable error message when status is `failed`

The `entriesRef` ref is synced with `fileEntries` state both inside the `setFileEntries` updater (for immediate synchronous access from `uploadAll`/`retryFile`) and in a passive `useEffect` (for React correctness). This is a controlled, intentional impurity — the ref mutation inside the updater is idempotent and has no effect on rendering.

### Object URL lifecycle

`URL.createObjectURL` is called for image files on selection. The generated blob URL is stored in `FileEntry.previewUrl`. Revocation happens:

- On successful upload (per-file, not batched)
- On file removal via `removeFile`
- On `clear()` (all entries)
- On unmount (all remaining entries in cleanup effect)

This prevents memory leaks from orphaned blob URLs. Non-image files do not generate preview URLs.

### Progress tracking

Upload progress is reported by UploadThing's `onUploadProgress` callback. The hook normalizes the raw progress value to an integer 0–100 via `Math.min(100, Math.max(0, Math.round(progress)))`. Progress is stored per-file in `FileEntry.progress` and rendered as a `<Progress>` bar component.

---

## Known limitations and tradeoffs

**One-time install copies.**\
Files installed via `npx shadcn add` are copied into the consumer project. chute cannot push updates to existing installs. Re-run `npx shadcn add` to pick up new versions.

**Only UploadThing.**\
There is no provider abstraction layer. This keeps the code readable and avoids speculative complexity. A second provider can be added later only if it becomes a real need, not before.

**Next.js App Router only.**\
Pages Router is not supported.

**Auth stub is a dev convenience.**\
The dev-mode bypass (`UPLOADTHING_TOKEN` check) is not secure for production. Replace `getUploadUser` with real auth before deploying.

**`entriesRef.current` mutation inside state updater.**\
The ref is written inside `setFileEntries`'s updater function so that concurrent `addFiles` callers reading `entriesRef.current` (in the capacity check) see the latest value without waiting for a re-render. This is a deliberate tradeoff — the mutation is idempotent and invisible to React's rendering, but it violates the convention of keeping updaters pure.

**No `AvatarUpload` or `FileList` standalone components.**\
Only `UploadField` and its presets ship. Additional components will be added only if real adoption signals demand, not for speculative completeness.

**Registry dependency URLs embed the origin.**\
Static registry output contains full origin URLs. For portable builds (e.g., publishing the registry to a different domain than `localhost`), set `REGISTRY_ORIGIN` before building. The dynamic route resolves this automatically from the request URL.
