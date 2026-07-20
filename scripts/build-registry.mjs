import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const registry = JSON.parse(await readFile("registry.json", "utf8"))
const localItemNames = new Set(registry.items.map((item) => item.name))
const knownShadcnItems = new Set(["button", "card", "progress"])
const root = process.cwd()
const outDir = path.join(root, "public", "r")
const origin = registry.homepage?.replace(/\/$/, "") ?? "http://localhost:3000"

await mkdir(outDir, { recursive: true })

for (const item of registry.items) {
  const files = await Promise.all(
    item.files.map(async (file) => ({
      ...file,
      content: await readFile(path.join(root, file.path), "utf8"),
    }))
  )

  const registryDependencies = (item.registryDependencies ?? []).map((dep) => {
    if (localItemNames.has(dep)) return `${origin}/r/${dep}.json`
    if (knownShadcnItems.has(dep)) return dep
    if (dep.startsWith("http")) return dep
    return dep
  })

  const output = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    ...item,
    registryDependencies,
    files,
  }

  await writeFile(
    path.join(outDir, `${item.name}.json`),
    JSON.stringify(output, null, 2)
  )
}

// Write catalog
await writeFile(
  path.join(outDir, "registry.json"),
  JSON.stringify(registry, null, 2)
)

console.log(
  `Built ${registry.items.length} registry items to ${outDir.replace(root, ".")}`
)
