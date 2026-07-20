import { access, readFile } from "node:fs/promises"
import path from "node:path"

const registry = JSON.parse(await readFile("registry.json", "utf8"))
const knownShadcnItems = new Set([
  "button",
  "card",
  "progress",
])

if (!registry.name) throw new Error("registry.json is missing name")
if (!registry.homepage) throw new Error("registry.json is missing homepage")
if (!Array.isArray(registry.items)) throw new Error("registry.json is missing items")

const localItems = new Set(registry.items.map((item) => item.name))

for (const item of registry.items) {
  if (!item.name) throw new Error("Registry item is missing name")
  if (!item.type) throw new Error(`${item.name} is missing type`)
  if (!Array.isArray(item.files)) throw new Error(`${item.name} is missing files`)

  for (const file of item.files) {
    if (!file.path) throw new Error(`${item.name} has a file without path`)
    if (!file.type) throw new Error(`${item.name} has a file without type`)
    await access(path.resolve(file.path))
  }

  for (const dependency of item.registryDependencies ?? []) {
    if (
      dependency.startsWith("http") ||
      dependency.startsWith(".") ||
      dependency.startsWith("@") ||
      dependency.includes("/") ||
      localItems.has(dependency) ||
      knownShadcnItems.has(dependency)
    ) {
      continue
    }

    throw new Error(`${item.name} has an unknown registry dependency: ${dependency}`)
  }
}

console.log(`Validated ${registry.items.length} registry items.`)
