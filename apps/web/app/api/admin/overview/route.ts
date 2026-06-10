import type { DateRangeOption } from "@/types/admin-analytics"
import { getOverviewData } from "@/lib/server/admin-analytics"
import { requireAdminApiAccess } from "@/lib/server/admin-access"

function parseDateRange(value: string | null): DateRangeOption {
  if (
    value === "last-7-days" ||
    value === "last-30-days" ||
    value === "last-90-days" ||
    value === "this-month"
  ) {
    return value
  }

  return "last-30-days"
}

export async function GET(req: Request) {
  const access = await requireAdminApiAccess()

  if (!access.ok) {
    return access.response
  }

  const { searchParams } = new URL(req.url)
  const range = parseDateRange(searchParams.get("range"))

  return Response.json(await getOverviewData(range))
}
