import { redirect } from "next/navigation"
import { buildDashboardRoute } from "@/lib/location-route"

// Use ISR with 5 second revalidation for better performance
// Home page redirects to dashboard, so this allows caching of the redirect while keeping data fresh
export const revalidate = 5

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
