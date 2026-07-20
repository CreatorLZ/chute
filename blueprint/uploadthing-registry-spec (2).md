# Build Spec: UploadThing-Wired Upload Component (personal tool → open source)

**Read this whole document before writing any code.** This is a handoff spec written for an
AI coding agent (Claude Code, opencode, or similar) to execute. It assumes no prior context
from any other conversation. Where something might have changed since this doc was written,
that is called out explicitly — verify before relying on it.

---

## 1. The actual story (read this first — it drives every scope decision below)

This project exists because of a real, recurring problem: rebuilding the same UploadThing +
form + upload-UI glue code from scratch on different projects. The plan is **not** "build a
polished public library on day one." It's two honest phases:

- **v0 — build it for me.** A working `<UploadField>` component (plus its file router) that
  solves the actual repeated problem, reused via copy-paste across a couple of real projects.
  No registry packaging, no public docs site, no audience to please yet. Done when it's
  actually useful across more than one project of mine.
- **v1 — open-source it.** Only after v0 has proven itself through real reuse (not before),
  wrap it as an installable shadcn registry and do the hardening pass that makes it presentable
  to strangers: accessibility polish, full docs, licensing checks, a public deploy.
- **v1.1+ — improve based on adoption**, if it gets adoption. Not planned in detail here.

**Why this sequencing, explicitly:** paying the "make it nice for strangers" cost before
knowing whether the component even gets reused once is backwards. v0 is cheap and proves the
premise. v1 is the cost you pay only once the premise is proven. This also produces a better
portfolio story than "I built this to be production-ready" — it's "I kept rebuilding this, so I
extracted it, then open-sourced it once it proved useful."

This is **not**, at either stage:
- A hosted SaaS product
- A no-code tool for non-technical end users
- A replacement for or reseller of UploadThing
- A multi-provider abstraction layer (explicitly deferred — see Section 3)
- An agent "Skill" (SKILL.md) — skills teach an AI agent a procedure; they do not ship real,
  tested runtime code into a project. A thin optional skill pointing at the eventual registry
  could be a v1.1+ idea, not part of v0 or v1.

## 2. Why this is worth building (and its real, narrow scope)

- UploadThing ships functional-but-undesigned primitives (`generateUploadButton`,
  `generateUploadDropzone`). They work, but have no `react-hook-form` integration and no
  shadcn design-token styling out of the box.
- shadcn-compatible upload UI already exists in abundance (Shadcnblocks has 40+ file-upload
  variants; shadcn-extension has a generic `file-upload` registry item). **None of these are
  wired to a real upload provider** — they are UI shells only.
- The actual gap is narrow: "an upload component with UploadThing's hook already wired in,
  form-integrated." Small, real, personal-first — audience is developers who use shadcn AND
  UploadThing specifically, not a mass-market product.

**Guardrail for the agent building this, at both stages:** do not scope-creep into a
general-purpose upload UI library or a hosted service. Stay narrow.

## 3. Fixed scope decisions (do not re-litigate mid-build)

- **Provider abstraction (`useUploadAdapter` or similar)**: explicitly **undecided, not
  rejected** — do not build this at v0 or v1. Call UploadThing directly. It's real complexity
  for a hypothetical future need, and it works against "keep the code simple enough to read and
  own" — which matters even more at v0 (you're the one reading it) than at v1. Revisit only if
  a second provider becomes an actual near-term need.
- **Framework**: Next.js **App Router only**. No Pages Router support planned.
- **Tailwind version**: whatever your current projects use. If/when this moves to the
  `shadcn-ui/registry-template` at v1, match that template's default (verify via its
  `package.json` at that time — do not assume it hasn't changed).
- **Known limitation to accept, not solve**: once this becomes a shadcn registry item at v1,
  installs are one-time copies — future fixes won't propagate to existing installs
  automatically. Document this at v1; irrelevant at v0 since there's no registry yet.

## 4. v0 — build this now (for yourself, no audience requirements)

### 4.1 Scope
Build `<UploadField>` and its UploadThing file router as real files in one of your actual
projects. No `registry.json`, no static JSON, no deployment, no docs site. Success at v0 means:
you can copy `upload-field.tsx` (and the router) into project #2 and #3 with little to no
rework, and it saves you real time versus rebuilding from scratch.

### 4.2 Component contract (get this right now — it's cheap today, expensive to change later)

These are functional decisions, not "audience polish" — they're what makes the component
actually reusable across your own projects, so build them at v0:

- Drag-and-drop with click-to-browse fallback. Support single- and multi-file via a
  `multiple?: boolean` prop (default `false`). Respect `maxFiles` when `multiple` is true.
- **Use RHF's `<Controller>`, not `register()`.** A file dropzone isn't a native `<input>` that
  `register()` can bind to. Comment this in the code so future-you doesn't forget why.
- **Controlled component using metadata, not raw `File` objects, once uploaded:**
  ```ts
  type UploadedFile = {
    id: string
    url: string
    name: string
    size: number
  }
  ```
  `value` is `UploadedFile[]` (or `UploadedFile | null` when not `multiple`). `onChange` fires
  the updated value after each successful upload or removal — RHF `Controller`-compatible
  (`{ value, onChange }`).
- **Support pre-existing files as `value`** (i.e. edit-form support) **only if one of your
  actual projects needs an edit flow.** If not, skip it at v0 — don't build for a use case you
  don't have yet. Add it later, at whichever project first needs it.
- **Validation should not be locked to one library.** Expose:
  ```ts
  validate?: (files: File[]) => string | undefined
  beforeUpload?: (files: File[]) => Promise<void> | void
  ```
  instead of a `zod`-specific prop — costs nothing extra now, avoids relocking every future
  project to whatever validation library you happened to use first.
- **Per-file state, tracked independently:**
  ```ts
  type UploadStatus = "idle" | "uploading" | "success" | "failed" | "retrying"
  ```
  One file failing must not affect any other file's progress. Basic retry button on failure —
  full focus-management/announcement polish can wait for v1.
- Minimum props: `endpoint: string`, `multiple?: boolean`, `maxFiles?: number`,
  `accept?: string[]`, `value`, `onChange`, `validate?`, `beforeUpload?`,
  `onUploadComplete?: (files: UploadedFile[]) => void`, `onUploadError?: (error: Error) => void`.
- **Basic keyboard operability** (focusable, Enter/Space opens file picker) — cheap, do it now.
  Full `aria-live` announcements and focus-after-failure management: defer to v1 unless trivial.
- Keep upload state logic in its own hook (e.g. `useUploadField()`) separate from markup — not
  because a future `<AvatarUpload>` needs it necessarily, but because it makes the single file
  easier for you to read and reuse.

### 4.3 The file router
Build a working UploadThing file router (`app/api/uploadthing/core.ts` + route handler) in the
same real project. Follow UploadThing's current quickstart (search "uploadthing nextjs
quickstart" — don't rely on memorized setup steps, this changes across major versions). Basic
auth stub is fine; this is your own project, so wire it to whatever auth that project actually
uses rather than leaving a generic TODO.

### 4.4 Validate it for real
Actually use this in a real project — real UploadThing account, real file upload, real UI in a
real form. This *is* the v0 "definition of done": not a demo, but something you're actually
using. See Section 6 for the explicit checklist.

### 4.5 Naming (cheap to decide now, expensive to redo later)
Even though there's no public audience yet, don't name any file, hook, or repo folder anything
containing "UploadThing" (e.g. avoid `uploadthing-field.tsx` as a public-facing name) — costs
nothing to pick a neutral name now (e.g. `upload-field`) and saves a rename later if this goes
public at v1.

## 5. v1 — open-source it (only start this after v0 has been reused in 2-3 real projects)

**Gate: do not start v1 work until `<UploadField>` has actually been copied into and used in
more than one real project, and any friction from that reuse has already been fixed in the v0
component.** If it turns out you never reuse it, v1 was never worth doing — that's a fine
outcome, not a failure.

### 5.1 Wrap it as a shadcn registry

shadcn registries are **not** limited to frontend/component code — they can distribute
components, hooks, pages, config, rules, and other files to any project, and work with any
project type/framework. A registry item's `files` array supports types beyond
`registry:component`, including `registry:file` (arbitrary files at an explicit `target` path)
and `registry:page` (full route files, also with a `target`). An `envVars` field can write
placeholder environment variable names into the consumer's `.env` **without overwriting
existing values**. This means the file router can ship through the registry too, not just the
component — as a **second, separate registry item** (`upload-router`), linked to
`upload-field` via `registryDependencies` (confirmed examples show one file type per item, not
mixed component+route files in a single item).

**Steps:**
1. Clone `shadcn-ui/registry-template` from GitHub (search to confirm current location/name —
   may have moved since this doc was written).
2. Set `name` (not containing "uploadthing") and `homepage` in `registry.json`.
3. Move your v0 `upload-field.tsx` into `registry/new-york/upload-field/` (or the template's
   equivalent path) — this is largely a relocation of already-working code, not a rewrite.
4. Add the `registry.json` entry:
   ```json
   {
     "name": "upload-field",
     "type": "registry:component",
     "title": "Upload Field",
     "description": "Drag-and-drop file upload wired to UploadThing, react-hook-form compatible.",
     "files": [
       { "path": "registry/new-york/upload-field/upload-field.tsx", "type": "registry:component" }
     ],
     "dependencies": ["uploadthing", "@uploadthing/react", "react-hook-form"],
     "registryDependencies": ["button", "card", "progress"]
   }
   ```
   (verify field names against current schema docs — may drift)
5. Build the `upload-router` item from your v0 file router. **Must verify before building**:
   whether a Next.js API route handler should be `type: "registry:file"` or `type:
   "registry:page"` in the current schema — unresolved as of when this doc was written (only a
   Svelte `registry:page` example was found, no Next.js-API-route-specific example). Search
   "shadcn registry-item.json registry:file vs registry:page nextjs api route" and confirm.
   Ship it as a clearly-commented starting point (TODO for real auth), not a finished backend —
   your v0 router was wired to your own auth; the public version needs a generic stub instead.
6. Validate the full install loop in a throwaway app (`npx shadcn add
   http://localhost:<port>/r/upload-field.json`), confirming both items install correctly and
   an actual file upload works end-to-end against a fresh UploadThing test account.

### 5.2 The hardening pass (the actual "make it public" cost)

- **Accessibility, completed**: `aria-live` region for upload progress/success/failure, focus
  moved to the Retry button after a failure, drag-over state announced (not purely visual) —
  on top of the basic keyboard support already built at v0.
- **Exported types**: `UploadedFile`, `UploadStatus`, and an `UploadError` type, so consumers
  never need to redefine them.
- **Edit-form / existing-file support**, if not already built at v0 because you didn't need it
  yet — add it now, since public consumers will have this use case even if you didn't.
- **Stable public API discipline**: be conservative about what's exported as props now that
  removing one breaks strangers, not just your own projects.
- **Optimize for copying**: avoid deep internal abstractions, keep the file readable
  top-to-bottom, comment the non-obvious parts (e.g. why `Controller` is required). A stranger
  should understand the installed file without reading this spec.
- **License check on any reference UI**: if any layout/pattern ideas were taken from
  Shadcnblocks or shadcn-extension during v0, check their license now (search "shadcnblocks
  license", "shadcn-extension license") before publishing. If unclear, rewrite from scratch
  using shadcn's own base primitives.
- **Naming/trademark**: confirm the final public name doesn't contain "UploadThing" (trademark
  friction risk) — describe it as "built on UploadThing" in the README instead.
- **UploadThing Terms of Service check**: search "uploadthing terms of service acceptable use"
  fresh at this point — do not rely on any earlier read, ToS pages change.
- **Docs page**: live demo, install command, props table, and worked examples for: basic
  single-file upload, multi-file upload, `react-hook-form` via `Controller`, editing an
  existing record, error handling/retry, custom validation via `validate`/`beforeUpload` (show
  one non-zod example), and a note that installed code won't auto-update on future fixes.
- **Deploy** to Vercel, confirm the live `/r/*.json` URLs work with a real `npx shadcn add
  <live-url>`.
- **Optional, later**: submit to shadcn's community registry directory (if one still exists) for
  the shorter `@yourname/component` install syntax; write a thin Skill pointing agents at the
  install command.

### 5.3 Later, not v1 — only if v1 gets real adoption
`<AvatarUpload>` and `<FileList>`, built the same way (shared `useUploadField()` state hook,
same registry pattern), added based on actual demand rather than speculative completeness.

## 6. Definition of done

**v0 done when:**
- [ ] `<UploadField>` + file router exist as real files in a real project, not a demo
- [ ] A real file upload works end-to-end (visible in your UploadThing dashboard)
- [ ] `value`/`onChange` use `UploadedFile` metadata, not raw `File` objects, post-upload
- [ ] Validation is exposed via `validate`/`beforeUpload`, not hardcoded to one library
- [ ] Single- and multi-file modes both work
- [ ] One file failing doesn't affect others; basic retry works
- [ ] Dropzone is keyboard-operable (basic level)
- [ ] **You've actually copied it into a second project and it saved you real time** — this is
      the real success criterion for v0, not a checkbox to satisfy before moving on

**v1 done when (only attempt after the v0 gate above is met):**
- [ ] `upload-field` and `upload-router` both install via `npx shadcn add` into a fresh project
- [ ] Accessibility hardening complete (aria-live, focus-after-failure, announced drag state)
- [ ] `UploadedFile`, `UploadStatus`, `UploadError` exported as public types
- [ ] Edit-form / existing-file support works, tested with a real edit flow
- [ ] Docs page covers all examples listed in 5.2, deployed and live
- [ ] Project name/branding avoids implying UploadThing affiliation
- [ ] Any referenced UI code is license-cleared or rewritten from scratch
- [ ] UploadThing ToS re-checked fresh, not from an earlier read
- [ ] No provider-abstraction layer was added (Section 3)
- [ ] `<AvatarUpload>`/`<FileList>` explicitly out of scope until real adoption signals demand

## 7. Things that WILL have changed and MUST be re-verified before/during building

Do not trust memorized details — search and read current docs before implementing each piece:

- **UploadThing**: search "uploadthing docs quickstart", "uploadthing useUploadThing react
  hook", "uploadthing file router setup". Confirm current major version, confirm whether
  presigned URL generation still happens server-side via `UPLOADTHING_TOKEN` (this was the
  case as of v7), confirm current package names (`uploadthing`, `@uploadthing/react`).
- **shadcn registry format** (relevant at v1): search "shadcn registry.json schema", "shadcn
  build command", "shadcn registry-template github". Confirm the template repo still exists at
  the expected location. Specifically confirm whether `registry:file` or `registry:page` is
  correct for a Next.js API route handler — unresolved as of when this doc was written.
- **shadcn CLI**: search "shadcn add command syntax" — confirm `npx shadcn add <url>` is still
  current (older versions used `npx shadcn-ui add`).
- **react-hook-form + validation library integration**: search "react-hook-form zod resolver
  current version" or the equivalent for whichever library you're using in a given project.
- **Existing prior art**: search "shadcnblocks file upload components", "shadcn-extension
  file-upload" — re-check these still don't include real UploadThing wiring, in case someone's
  since shipped exactly this (relevant mainly before publishing at v1).
- **UploadThing Terms of Service**: search "uploadthing terms of service acceptable use" —
  re-check before any public launch.

## 8. Resources to look up (starting points — verify current URLs/content via search)

- UploadThing official docs site (search: "uploadthing docs")
- UploadThing GitHub repo, for source-of-truth on hook signatures (search: "uploadthing github")
- shadcn/ui official docs, registry section (search: "shadcn ui docs registry")
- `shadcn-ui/registry-template` GitHub repo (search: "shadcn registry template github")
- react-hook-form docs (search: "react hook form docs")
- Shadcnblocks file upload components, for UI reference only (search: "shadcnblocks file upload")
- shadcn-extension file-upload component, for UI reference only (search: "shadcn extension file upload")
