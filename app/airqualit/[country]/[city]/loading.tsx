import { DashboardLoadingShell } from "@/components/dashboard/route-loading"
import { AqiDashboardSkeleton } from "@/components/dashboard/loading-states"

export default function Loading() {
  return (
    <DashboardLoadingShell>
      <AqiDashboardSkeleton />
    </DashboardLoadingShell>
  )
}
