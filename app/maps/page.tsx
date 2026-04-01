import { DashboardBackground } from "@/components/dashboard/background"
import { MapDashboard } from "@/components/dashboard/maps/map-dashboard"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { Navbar } from "@/components/dashboard/navbar"
import { Sidebar } from "@/components/dashboard/sidebar"

export default function MapsPage() {
  return (
    <main className="relative h-dvh overflow-hidden">
      <DashboardBackground />

      <div className="relative z-10 flex h-full w-full">
        <Sidebar />

        <div className="min-w-0 flex flex-1 flex-col">
          <div className="sticky top-0 z-20 shrink-0 border-b border-white/30 dark:border-white/10">
            <Navbar />
          </div>

          <MapDashboard />
        </div>
      </div>

      <MobileNav />
    </main>
  )
}
