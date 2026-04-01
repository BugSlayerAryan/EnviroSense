import { DashboardBackground } from "@/components/dashboard/background"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { Navbar } from "@/components/dashboard/navbar"
import { Sidebar } from "@/components/dashboard/sidebar"
import { WeatherDashboard } from "@/components/dashboard/weather/weather-dashboard"

export default function WeatherPage() {
  return (
    <main className="relative h-dvh overflow-hidden">
      <DashboardBackground />

      <div className="relative z-10 flex h-full w-full">
        <Sidebar />

        <div className="min-w-0 flex flex-1 flex-col">
          <div className="sticky top-0 z-20 shrink-0 border-b border-white/30 dark:border-white/10">
            <Navbar />
          </div>

          <WeatherDashboard />
        </div>
      </div>

      <MobileNav />
    </main>
  )
}
