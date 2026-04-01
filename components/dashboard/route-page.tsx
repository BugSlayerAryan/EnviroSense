import { DashboardBackground } from "@/components/dashboard/background"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { Navbar } from "@/components/dashboard/navbar"
import { Sidebar } from "@/components/dashboard/sidebar"

interface RoutePageProps {
  title: string
  subtitle: string
}

export function RoutePage({ title, subtitle }: RoutePageProps) {
  return (
    <main className="relative h-dvh overflow-hidden">
      <DashboardBackground />

      <div className="relative z-10 flex h-full w-full">
        <Sidebar />

        <div className="min-w-0 flex flex-1 flex-col">
          <div className="sticky top-0 z-20 shrink-0 border-b border-white/30 dark:border-white/10">
            <Navbar />
          </div>

          <section className="dashboard-scroll flex-1 overflow-y-auto px-4 pb-24 pt-4 sm:px-5 lg:px-6 lg:pb-8 lg:pt-5">
            <div className="glass-card p-6 lg:p-8">
              <h1 className="mb-2 text-3xl font-bold text-gray-800 dark:text-white">{title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            </div>
          </section>
        </div>
      </div>

      <MobileNav />
    </main>
  )
}
