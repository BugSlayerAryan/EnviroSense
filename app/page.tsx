"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { reverseGeocodeCity } from "@/api/api"
import { DashboardHomeLoading } from "@/components/dashboard/route-loading"
import { buildDashboardRoute } from "@/lib/location-route"

const DEFAULT_CITY = "New Delhi, IN"

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const didRedirectRef = useRef(false)

  useEffect(() => {
    if (didRedirectRef.current) return
    didRedirectRef.current = true

    const cityFromQuery = searchParams.get("city")
    if (cityFromQuery?.trim()) {
      router.replace(buildDashboardRoute(cityFromQuery.trim()))
      return
    }

    if (!navigator.geolocation) {
      router.replace(buildDashboardRoute(DEFAULT_CITY))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const reverse = await reverseGeocodeCity(position.coords.latitude, position.coords.longitude, true)
          const detectedCity = typeof reverse?.city === "string" && reverse.city.trim() ? reverse.city.trim() : DEFAULT_CITY
          router.replace(buildDashboardRoute(detectedCity))
        } catch {
          router.replace(buildDashboardRoute(DEFAULT_CITY))
        }
      },
      () => {
        router.replace(buildDashboardRoute(DEFAULT_CITY))
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 },
    )
  }, [router, searchParams])

  return <DashboardHomeLoading />
}
