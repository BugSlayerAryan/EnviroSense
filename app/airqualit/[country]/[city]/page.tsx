import { DashboardBackground } from "@/components/dashboard/background"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { Navbar } from "@/components/dashboard/navbar"
import { Sidebar } from "@/components/dashboard/sidebar"
import { AirQualityDashboard } from "@/components/dashboard/airquality/aqi-dashboard"
import { cityFromRouteSegments } from "@/lib/location-route"

export const dynamic = "force-dynamic"

type AirQualitCityPageProps = {
  params: Promise<{
    country: string
    city: string
  }>
}

export default async function AirQualitCityPage({ params }: AirQualitCityPageProps) {
  const resolvedParams = await params
  const initialCity = cityFromRouteSegments(resolvedParams.country, resolvedParams.city)

  return (
    <main className="relative h-dvh overflow-hidden">
      <DashboardBackground />

      <div className="relative z-10 flex h-full w-full">
        <Sidebar />

        <div className="min-w-0 flex flex-1 flex-col">
          <div className="sticky top-0 z-20 shrink-0 border-b border-white/30 dark:border-white/10">
            <Navbar />
          </div>

          <AirQualityDashboard initialCity={initialCity} />
        </div>
      </div>

      <MobileNav />
    </main>
  )
}
