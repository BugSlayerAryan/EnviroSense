import { DashboardBackground } from "@/components/dashboard/background"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { Navbar } from "@/components/dashboard/navbar"
import { Sidebar } from "@/components/dashboard/sidebar"
import { UvDashboard } from "@/components/dashboard/uvindex/uv-dashboard"
import { canonicalCountrySegment, cityFromRouteSegments } from "@/lib/location-route"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

type UvIndexCityPageProps = {
  params: Promise<{
    country: string
    city: string
  }>
}

export default async function UvIndexCityPage({ params }: UvIndexCityPageProps) {
  const resolvedParams = await params
  const normalizedCountry = canonicalCountrySegment(resolvedParams.country)

  if (normalizedCountry !== resolvedParams.country) {
    redirect(`/uv-index/${normalizedCountry}/${resolvedParams.city}`)
  }

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

          <UvDashboard initialCity={initialCity} />
        </div>
      </div>

      <MobileNav />
    </main>
  )
}
