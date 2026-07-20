import { readFile } from "node:fs/promises"
import path from "node:path"

import registry from "../../registry.json"

type RegistryFile = {
  path: string
  type: string
  target?: string
  content?: string
}

type RegistryItem = {
  name: string
  type: string
  title?: string
  description?: string
  dependencies?: string[]
  devDependencies?: string[]
  registryDependencies?: string[]
  envVars?: Record<string, string>
  files?: RegistryFile[]
}

const root = process.cwd()

export function getRegistryCatalog() {
  return registry
}

export async function getRegistryItem(name: string, origin: string) {
  const item = registry.items.find((entry) => entry.name === name) as
    | RegistryItem
    | undefined

  if (!item) return undefined
  const localItemNames = new Set(registry.items.map((entry) => entry.name))

  return {
    "$schema": "https://ui.shadcn.com/schema/registry-item.json",
    ...item,
    registryDependencies: item.registryDependencies?.map((dependency) =>
      localItemNames.has(dependency)
        ? `${origin}/r/${dependency}.json`
        : dependency
    ),
    files: await Promise.all(
      (item.files ?? []).map(async (file) => ({
        ...file,
        content: await readFile(
          path.join(/* turbopackIgnore: true */ root, file.path),
          "utf8"
        ),
      }))
    ),
  }
}
