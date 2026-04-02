import { DashboardLoadingShell } from "@/components/dashboard/route-loading"
import { UvDashboardSkeleton } from "@/components/dashboard/loading-states"

export default function Loading() {
  return (
    <DashboardLoadingShell>
      <UvDashboardSkeleton />
    </DashboardLoadingShell>
  )
}
