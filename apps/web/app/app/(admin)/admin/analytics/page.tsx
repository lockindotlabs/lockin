import { redirect } from "next/navigation"

export default function LegacyAdminAnalyticsPage() {
  redirect("/app/admin/overview")
}
