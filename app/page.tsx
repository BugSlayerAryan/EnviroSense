import { redirect } from "next/navigation"
import { buildDashboardRoute } from "@/lib/location-route"

export const dynamic = "force-dynamic"

type HomePageProps = {
  searchParams?: {
    city?: string | string[]
  }
}

function getCityFromSearchParams(searchParams?: HomePageProps["searchParams"]) {
  const city = searchParams?.city
  return Array.isArray(city) ? city[0] : city
}

export default function HomePage({ searchParams }: HomePageProps) {
  const city = getCityFromSearchParams(searchParams) ?? "New Delhi, IN"
  redirect(buildDashboardRoute(city))
}
