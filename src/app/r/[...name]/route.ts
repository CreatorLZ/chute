import { getRegistryItem } from "@/lib/registry"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      name: string[]
    }>
  }
) {
  const { name } = await context.params
  const slug = name.join("/").replace(/\.json$/, "")
  const origin = new URL(request.url).origin
  const item = await getRegistryItem(slug, origin)

  if (!item) {
    return Response.json(
      { error: `Registry item "${slug}" was not found.` },
      { status: 404 }
    )
  }

  return Response.json(item)
}
