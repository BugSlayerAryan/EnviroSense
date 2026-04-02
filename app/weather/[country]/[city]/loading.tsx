import { DashboardLoadingShell } from "@/components/dashboard/route-loading"
import { WeatherDashboardSkeleton } from "@/components/dashboard/loading-states"

export default function Loading() {
  return (
    <DashboardLoadingShell>
      <WeatherDashboardSkeleton />
    </DashboardLoadingShell>
  )
}
