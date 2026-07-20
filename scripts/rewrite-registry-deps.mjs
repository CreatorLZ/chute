import { mkdir, readFile, writeFile, rm } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const outDir = path.join(root, "public", "r")
const registry = JSON.parse(await readFile("registry.json", "utf8"))
const localItemNames = new Set(registry.items.map((item) => item.name))
const origin = (
  process.env.REGISTRY_ORIGIN ?? registry.homepage ?? ""
).replace(/\/+$/, "")

if (!origin) {
  console.error("FAIL: No registry origin available.")
  console.error("  Set REGISTRY_ORIGIN env var or homepage in registry.json.")
  process.exit(1)
}

const isLocalhost = /^https?:\/\/localhost(:\d+)?$/i.test(origin)
if (isLocalhost) {
  console.warn(
    `WARN: Origin is ${origin} — localhost URLs in static output.`,
    "Set REGISTRY_ORIGIN for a deployable build."
  )
}

await mkdir(outDir, { recursive: true })

const items = registry.items
let rewritten = 0

for (const item of items) {
  const filePath = path.join(outDir, `${item.name}.json`)

  let data
  try {
    data = JSON.parse(await readFile(filePath, "utf8"))
  } catch {
    console.error(`FAIL: Cannot read or parse ${filePath}`)
    process.exit(1)
  }

  const original = data.registryDependencies ?? []
  const resolved = original.map((dep) => {
    if (localItemNames.has(dep)) {
      if (/^https?:\/\//.test(dep)) return dep
      return `${origin}/r/${dep}.json`
    }
    return dep
  })

  if (JSON.stringify(original) !== JSON.stringify(resolved)) {
    data.registryDependencies = resolved
    await writeFile(filePath, JSON.stringify(data, null, 2))
    rewritten++
  }
}

if (!items.some((i) => i.name === "registry")) {
  await writeFile(
    path.join(outDir, "registry.json"),
    JSON.stringify(registry, null, 2)
  )
}

// Remove the catalog file — served dynamically by the registry.json route.
// Keeping it would conflict with route handlers at the same path.
try {
  await rm(path.join(outDir, "registry.json"))
} catch { /* non-fatal if already absent */ }

console.log(
  `Rewrote dependencies for ${rewritten} item(s) using origin ${origin}.`
)
