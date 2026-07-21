import { requireAdminApiAccess } from "@/lib/server/admin-access"
import { listReviewQueue } from "@/lib/server/template-review-store"
import { TEMPLATE_STATUSES } from "@/lib/server/template-schemas"

export async function GET(req: Request) {
  const access = await requireAdminApiAccess()

  if (!access.ok) {
    return access.response
  }

  const { searchParams } = new URL(req.url)
  const requestedStatus = searchParams.get("status")
  const status =
    requestedStatus && TEMPLATE_STATUSES.includes(requestedStatus as never)
      ? (requestedStatus as (typeof TEMPLATE_STATUSES)[number])
      : "PENDING_REVIEW"

  const templates = await listReviewQueue(status)
  return Response.json({ templates })
}
