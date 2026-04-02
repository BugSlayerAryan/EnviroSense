import { DashboardLoadingShell, DashboardHomeContentLoading } from "@/components/dashboard/route-loading"

export default function Loading() {
  return (
    <DashboardLoadingShell>
      <DashboardHomeContentLoading />
    </DashboardLoadingShell>
  )
}
