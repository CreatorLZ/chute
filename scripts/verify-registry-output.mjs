import { access, readFile, stat } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const outDir = path.join(root, "public", "r")
const registry = JSON.parse(await readFile("registry.json", "utf8"))
const localItemNames = new Set(registry.items.map((item) => item.name))
const knownShadcnItems = new Set(["button", "card", "progress"])
const failures = []

// ── 1. Directory exists ──────────────────────────────────────────────
try {
  await access(outDir)
} catch {
  console.error("FAIL: public/r/ directory not found")
  process.exit(1)
}

// ── 2. Freshness: output newer than registry.json? ──────────────────
const regStat = await stat("registry.json")
let staleCount = 0

for (const item of registry.items) {
  const filePath = path.join(outDir, `${item.name}.json`)
  try {
    const outStat = await stat(filePath)
    if (outStat.mtime < regStat.mtime) {
      staleCount++
      failures.push(`${item.name}.json — stale (older than registry.json)`)
    }
  } catch {
    failures.push(`${item.name}.json — file not found`)
  }
}

// ── 3. Each file exists, parses, has name/files/content ─────────────
for (const item of registry.items) {
  const filePath = path.join(outDir, `${item.name}.json`)

  let data
  try {
    data = JSON.parse(await readFile(filePath, "utf8"))
  } catch (err) {
    if (!failures.some((f) => f.startsWith(`${item.name}.json — file not found`))) {
      failures.push(`${item.name}.json — invalid JSON: ${err.message}`)
    }
    continue
  }

  if (!data.name) {
    failures.push(`${item.name}.json — missing "name" field`)
  }

  if (!Array.isArray(data.files)) {
    failures.push(`${item.name}.json — missing "files" array`)
  } else {
    const missingContent = data.files.some((f) => !f.content)
    if (missingContent) {
      failures.push(`${item.name}.json — one or more files missing "content"`)
    }
  }

  // ── 4. Local deps resolve to URLs or known shadcn items ──────────
  const deps = data.registryDependencies ?? []
  for (const dep of deps) {
    if (knownShadcnItems.has(dep)) continue
    if (/^https?:\/\//.test(dep)) continue
    if (localItemNames.has(dep) && !/^https?:\/\//.test(dep)) {
      failures.push(
        `${item.name}.json — local dep "${dep}" should be a full URL, got plain name`
      )
    }
  }
}

// ── 5. Catalog is served dynamically — assert no static file ─────
try {
  await access(path.join(outDir, "registry.json"))
  failures.push("public/r/registry.json — should not exist (served dynamically)")
} catch {
  /* expected — catalog is served by the route handler */
}

// ── Summary ─────────────────────────────────────────────────────────
if (failures.length > 0) {
  console.error(`Verification FAILED (${failures.length} issue(s)):`)
  for (const f of failures) {
    console.error(`  ✗ ${f}`)
  }
  process.exit(1)
}

const freshnessNote = staleCount > 0
  ? ` (${staleCount} stale — run registry:build)`
  : " (fresh)"
console.log(`Verified ${registry.items.length} registry items in public/r/${freshnessNote}.`)
