import { getRegistryCatalog } from "@/lib/registry"

export const dynamic = "force-dynamic"

export async function GET() {
  return Response.json(getRegistryCatalog())
}
