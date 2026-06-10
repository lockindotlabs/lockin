import { getBillingData } from "@/lib/server/admin-analytics"
import { requireAdminApiAccess } from "@/lib/server/admin-access"

export async function GET() {
  const access = await requireAdminApiAccess()

  if (!access.ok) {
    return access.response
  }

  return Response.json(await getBillingData())
}
