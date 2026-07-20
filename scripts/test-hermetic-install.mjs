import { execSync } from "node:child_process"
import { mkdirSync, writeFileSync, rmSync } from "node:fs"
import { createServer } from "node:http"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

const registryDir = new URL("../public/r", import.meta.url).pathname
const port = 13456

// ── Static file server ──────────────────────────────────────────────
const server = createServer((req, res) => {
  const name = req.url === "/" ? "registry.json" : req.url.replace(/^\//, "")
  const filePath = join(registryDir, name)
  res.setHeader("Access-Control-Allow-Origin", "*")
  try {
    const content = readFileSync(filePath, "utf8")
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(content)
  } catch {
    res.writeHead(404)
    res.end("{}")
  }
})

server.listen(port)
console.log(`Static registry server on http://127.0.0.1:${port}`)

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`)
  const out = execSync(cmd, { stdio: "pipe", encoding: "utf8", ...opts })
  console.log(out.trim())
  return out
}

try {
  const tmpRoot = join(tmpdir(), "hc-test")
  rmSync(tmpRoot, { recursive: true, force: true })
  mkdirSync(tmpRoot, { recursive: true })
  console.log(`\n=== Consumer project: ${tmpRoot}`)

  // Create Next.js project
  run(`npx create-next-app@latest . --ts --src-dir --app --no-tailwind --eslint --no-import-alias --use-npm --no-agents-md`, {
    cwd: tmpRoot, timeout: 120_000,
  })

  // Install Tailwind v4 + PostCSS
  run(`npm install -D tailwindcss @tailwindcss/postcss postcss`, {
    cwd: tmpRoot, timeout: 60_000,
  })

  // Write postcss.config.mjs
  writeFileSync(join(tmpRoot, "postcss.config.mjs"),
    "const config = { plugins: { '@tailwindcss/postcss': {} } }\nexport default config\n")

  // Write globals.css with Tailwind + shadcn CSS variables
  const globals = `@import "tailwindcss";\n@custom-variant dark (&:is(.dark *));\n`
    + `:root { --background: oklch(1 0 0); --foreground: oklch(0.145 0 0); --card: oklch(1 0 0); --card-foreground: oklch(0.145 0 0); --popover: oklch(1 0 0); --popover-foreground: oklch(0.145 0 0); --primary: oklch(0.205 0.042 265.755); --primary-foreground: oklch(0.985 0 0); --secondary: oklch(0.965 0.001 286.375); --secondary-foreground: oklch(0.205 0.042 265.755); --muted: oklch(0.965 0.001 286.375); --muted-foreground: oklch(0.556 0.02 286.375); --accent: oklch(0.965 0.001 286.375); --accent-foreground: oklch(0.205 0.042 265.755); --destructive: oklch(0.577 0.245 27.325); --destructive-foreground: oklch(0.577 0.245 27.325); --border: oklch(0.92 0.004 286.32); --input: oklch(0.92 0.004 286.32); --ring: oklch(0.705 0.015 286.067); --radius: 0.625rem; }\n`
    + `.dark { --background: oklch(0.145 0 0); --foreground: oklch(0.985 0 0); --card: oklch(0.145 0 0); --card-foreground: oklch(0.985 0 0); --popover: oklch(0.145 0 0); --popover-foreground: oklch(0.985 0 0); --primary: oklch(0.985 0 0); --primary-foreground: oklch(0.205 0.042 265.755); --secondary: oklch(0.269 0.015 286.067); --secondary-foreground: oklch(0.985 0 0); --muted: oklch(0.269 0.015 286.067); --muted-foreground: oklch(0.708 0.01 286.067); --accent: oklch(0.269 0.015 286.067); --accent-foreground: oklch(0.985 0 0); --destructive: oklch(0.577 0.245 27.325); --destructive-foreground: oklch(0.577 0.245 27.325); --border: oklch(0.269 0.015 286.067); --input: oklch(0.269 0.015 286.067); --ring: oklch(0.439 0.01 286.067); }\n`
    + `@theme inline { --color-background: var(--background); --color-foreground: var(--foreground); --color-card: var(--card); --color-card-foreground: var(--card-foreground); --color-popover: var(--popover); --color-popover-foreground: var(--popover-foreground); --color-primary: var(--primary); --color-primary-foreground: var(--primary-foreground); --color-secondary: var(--secondary); --color-secondary-foreground: var(--secondary-foreground); --color-muted: var(--muted); --color-muted-foreground: var(--muted-foreground); --color-accent: var(--accent); --color-accent-foreground: var(--accent-foreground); --color-destructive: var(--destructive); --color-destructive-foreground: var(--destructive-foreground); --color-border: var(--border); --color-input: var(--input); --color-ring: var(--ring); --radius-sm: calc(var(--radius) - 4px); --radius-md: calc(var(--radius) - 2px); --radius-lg: var(--radius); --radius-xl: calc(var(--radius) + 4px); }`
  writeFileSync(join(tmpRoot, "src", "app", "globals.css"), globals)

  // Init shadcn
  run(`npx --yes shadcn@latest init -y --defaults`, { cwd: tmpRoot, timeout: 120_000 })

  // Fresh clean of any prior components
  for (const p of [
    "src/components/upload-field.tsx",
    "src/components/upload-presets.tsx",
    "src/hooks/use-upload-field.ts",
    "src/lib/uploadthing.ts",
    "src/app/api/uploadthing/core.ts",
    "src/app/api/uploadthing/route.ts",
    "src/components/ui/attachment.tsx",
  ]) {
    try { rmSync(join(tmpRoot, p)) } catch {}
  }

  // ── Install upload-field from static server ─────────────────────
  run(`npx --yes shadcn@latest add http://127.0.0.1:${port}/upload-field.json --yes`, {
    cwd: tmpRoot, timeout: 120_000,
  })
  console.log("✓ upload-field installed")

  // ── Install upload-presets from static server ───────────────────
  run(`npx --yes shadcn@latest add http://127.0.0.1:${port}/upload-presets.json --yes`, {
    cwd: tmpRoot, timeout: 120_000,
  })
  console.log("✓ upload-presets installed")

  // ── Build consumer ──────────────────────────────────────────────
  run(`npm run build`, { cwd: tmpRoot, timeout: 120_000 })
  console.log("✓ Consumer build succeeded")

  // ── Verify files land in expected alias paths ───────────────────
  const expected = [
    "src/components/upload-field.tsx",
    "src/components/upload-presets.tsx",
    "src/hooks/use-upload-field.ts",
    "src/lib/uploadthing.ts",
    "src/components/ui/attachment.tsx",
    "src/components/ui/button.tsx",
    "src/components/ui/card.tsx",
    "src/components/ui/progress.tsx",
    "src/app/api/uploadthing/core.ts",
    "src/app/api/uploadthing/route.ts",
  ]
  for (const file of expected) {
    try { readFileSync(join(tmpRoot, file)) } catch {
      throw new Error(`Missing expected file: ${file}`)
    }
  }
  console.log(`✓ All ${expected.length} expected files present`)

  console.log(`\n=== HERMETIC INSTALL PASSED ===`)

  // Cleanup
  rmSync(tmpRoot, { recursive: true, force: true })
} finally {
  server.close()
}
