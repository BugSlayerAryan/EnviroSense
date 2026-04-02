import { DashboardBackground } from "@/components/dashboard/background"
import { EnvironmentScore } from "@/components/dashboard/environment-score"
import { AqiCard } from "@/components/dashboard/aqi-card"
import { WeatherCard } from "@/components/dashboard/weather-card"
import { UvCard } from "@/components/dashboard/uv-card"
import { AqiTrendChart } from "@/components/dashboard/aqi-trend-chart"
import { TemperatureTrendChart } from "@/components/dashboard/temperature-trend-chart"
import { HealthTipCard } from "@/components/dashboard/health-tip-card"
import { Navbar } from "@/components/dashboard/navbar"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { cityFromRouteSegments } from "@/lib/location-route"
import { Suspense } from "react"

export const dynamic = "force-dynamic"

type DashboardCityPageProps = {
  params: Promise<{
    country: string
    city: string
  }>
}

function EnvironmentScoreWrapper({ city }: { city?: string }) {
  return (
    <Suspense fallback={<div className="glass-card h-96 animate-pulse" />}>
      <EnvironmentScoreWithParams city={city} />
    </Suspense>
  )
}

function EnvironmentScoreWithParams({ city }: { city?: string }) {
  return <EnvironmentScore city={city} />
}

export default async function DashboardCityPage({ params }: DashboardCityPageProps) {
  const resolvedParams = await params
  const activeCity = cityFromRouteSegments(resolvedParams.country, resolvedParams.city)

  return (
    <main className="relative h-dvh overflow-hidden">
      <DashboardBackground />

      <div className="relative z-10 flex h-full w-full">
        <Sidebar />

        <div className="min-w-0 flex-1 flex flex-col">
          <div className="sticky top-0 z-20 shrink-0 border-b border-white/30 dark:border-white/10">
            <Navbar />
          </div>

          <section className="dashboard-scroll flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
            <div className="mb-7 lg:mb-8">
              <EnvironmentScoreWrapper city={activeCity} />
            </div>

            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              <AqiCard initialCity={activeCity} />
              <WeatherCard initialCity={activeCity} />
              <UvCard initialCity={activeCity} />
            </div>

            <div className="mb-7 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              <AqiTrendChart initialCity={activeCity} />
              <TemperatureTrendChart initialCity={activeCity} />
            </div>

            <div className="mb-2">
              <HealthTipCard city={activeCity} />
            </div>
          </section>
        </div>
      </div>

      <MobileNav />
    </main>
  )
}
