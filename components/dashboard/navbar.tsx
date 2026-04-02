"use client"

import { LocateFixed, Moon, RefreshCw, Search, Sun, UserRound } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Suspense } from "react"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { fetchWeatherData, reverseGeocodeCity } from "@/api/api"
import { useTheme } from "next-themes"
import { buildCityRoute, buildDashboardRoute, extractCityFromPathname, extractDashboardCityFromPathname, isDashboardRoute } from "@/lib/location-route"

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
  isDetectingLocation: boolean
  onUseCurrentLocation: () => void
}

type ActionButtonsProps = {
  mounted: boolean
  isDark: boolean
  onToggleTheme: () => void
}

function SearchBar({ value, onChange, onSubmit, isDetectingLocation, onUseCurrentLocation }: SearchBarProps) {
  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group relative mx-auto w-full max-w-150 min-w-0 flex-1 sm:min-w-70"
    >
      <div className="flex h-11 items-center rounded-xl border border-gray-200/80 bg-gray-100 px-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-all duration-200 ease-out group-hover:bg-gray-200/80 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-400/60 dark:border-white/15 dark:bg-white/10 dark:group-hover:bg-white/15 dark:focus-within:bg-white/15">
        <Search className="h-4.5 w-4.5 shrink-0 text-gray-500 dark:text-gray-300" />
        <input
          type="text"
          placeholder="Search city or location"
          className="ml-2.5 h-full w-full bg-transparent pr-2 text-sm text-gray-800 outline-none placeholder:truncate placeholder:text-gray-500 dark:text-white dark:placeholder:text-gray-400"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Search location"
        />

        <button
          type="button"
          onClick={onUseCurrentLocation}
          title="Use current location"
          aria-label="Use current location"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200/80 bg-white/90 text-gray-700 transition-all duration-200 ease-out hover:-translate-y-px hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 dark:border-white/15 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/15"
        >
          {isDetectingLocation ? <span className="inline-block h-3.5 w-3.5 rounded-full bg-blue-500/70 animate-pulse dark:bg-blue-300/70" /> : <LocateFixed className="h-3.5 w-3.5" />}
        </button>
      </div>
    </motion.form>
  )
}

function ActionButtons({ mounted, isDark, onToggleTheme }: ActionButtonsProps) {
  const actionButtonClass =
    "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200/80 bg-white/90 text-gray-700 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-all duration-200 ease-out hover:-translate-y-px hover:bg-white hover:shadow-[0_10px_20px_-14px_rgba(15,23,42,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 dark:border-white/15 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/15"

  return (
    <motion.div
      className="flex shrink-0 items-center gap-2 sm:gap-3"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: 0.06 }}
    >
      {mounted ? (
        <button
          type="button"
          onClick={onToggleTheme}
          className={actionButtonClass}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      ) : null}

      <button
        type="button"
        title="Profile"
        aria-label="Profile"
        className="group relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-gray-200/80 bg-white/90 text-sm font-medium text-gray-700 shadow-[0_2px_6px_-4px_rgba(15,23,42,0.18)] transition-all duration-200 ease-out hover:-translate-y-px hover:border-blue-200/90 hover:bg-white hover:shadow-[0_14px_26px_-16px_rgba(37,99,235,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 dark:border-white/15 dark:bg-white/10 dark:text-gray-100 dark:hover:border-blue-400/30 dark:hover:bg-white/15"
        aria-haspopup="menu"
      >
        <span className="pointer-events-none absolute inset-0 bg-linear-to-br from-blue-100/0 via-blue-100/0 to-blue-200/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:from-blue-500/0 dark:via-blue-500/0 dark:to-blue-500/10" />
        <span className="relative inline-flex h-7.5 w-7.5 items-center justify-center overflow-hidden rounded-[10px] bg-linear-to-br from-blue-600 via-blue-500 to-cyan-500 text-white shadow-[0_8px_16px_-10px_rgba(37,99,235,0.95)] transition-transform duration-200 group-hover:scale-[1.03]">
          <UserRound className="h-4.5 w-4.5" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-white dark:ring-slate-900">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
          </span>
        </span>
      </button>
    </motion.div>
  )
}


export function Navbar() {
  return (
    <Suspense fallback={<NavbarFallback />}>
      <NavbarClient />
    </Suspense>
  )
}

function NavbarFallback() {
  return (
    <div className="flex h-16 items-center gap-3 border-b border-white/30 px-4 dark:border-white/10">
      <div className="h-12 w-12 animate-pulse rounded-lg bg-white/20 dark:bg-white/10" />
      <div className="flex-1">
        <div className="h-11 animate-pulse rounded-xl bg-white/20 dark:bg-white/10" />
      </div>
      <div className="flex gap-3">
        <div className="h-11 w-11 animate-pulse rounded-xl bg-white/20 dark:bg-white/10" />
        <div className="h-11 w-11 animate-pulse rounded-xl bg-white/20 dark:bg-white/10" />
      </div>
    </div>
  )
}

function NavbarClient() {
  const DEFAULT_CITY = "New Delhi, India"
  const INITIAL_LOCATION_CHECK_KEY = "envirosense-initial-location-check-v1"
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationError, setLocationError] = useState("")
  const [searchValue, setSearchValue] = useState(
    searchParams.get("city") ?? extractDashboardCityFromPathname(pathname) ?? extractCityFromPathname(pathname) ?? DEFAULT_CITY,
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const currentRouteCity = searchParams.get("city") ?? extractDashboardCityFromPathname(pathname) ?? extractCityFromPathname(pathname)
    const normalizedCity = (currentRouteCity ?? "").toLowerCase().replace(/\s+/g, " ").trim()
    const isDefaultCityRoute = normalizedCity.startsWith("new delhi")

    try {
      if (window.sessionStorage.getItem(INITIAL_LOCATION_CHECK_KEY) === "1") {
        return
      }

      window.sessionStorage.setItem(INITIAL_LOCATION_CHECK_KEY, "1")
    } catch {
      // If storage is unavailable, continue with best-effort behavior.
    }

    if (isDefaultCityRoute || !currentRouteCity) {
      void handleUseCurrentLocation()
    }
    // Run once per browser session to avoid repeatedly overriding user-selected cities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  useEffect(() => {
    setSearchValue(searchParams.get("city") ?? extractDashboardCityFromPathname(pathname) ?? extractCityFromPathname(pathname) ?? DEFAULT_CITY)
  }, [pathname, searchParams])

  const pushWithCity = (city: string) => {
    const trimmed = city.trim()
    if (!trimmed) return

    if (pathname.startsWith("/weather")) {
      router.push(buildCityRoute("/weather", trimmed))
      return
    }

    if (pathname.startsWith("/airqualit")) {
      router.push(buildCityRoute("/airqualit", trimmed))
      return
    }

    if (pathname.startsWith("/uv-index")) {
      router.push(buildCityRoute("/uv-index", trimmed))
      return
    }

    if (isDashboardRoute(pathname) || pathname === "/") {
      router.push(buildDashboardRoute(trimmed))
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.set("city", trimmed)
    const suffix = params.toString()
    router.push(suffix ? `${pathname}?${suffix}` : pathname)
  }

  const applyCityQuery = (city: string) => {
    pushWithCity(city)
  }

  const handleSearchSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = searchValue.trim()
    if (!trimmed) return
    setLocationError("")

    try {
      const weather = await fetchWeatherData(trimmed)
      const resolvedCity = typeof weather?.city === "string" ? weather.city.trim() : ""
      const resolvedCountry = typeof weather?.country === "string" ? weather.country.trim() : ""
      const nextCity = resolvedCity
        ? resolvedCountry
          ? `${resolvedCity}, ${resolvedCountry}`
          : resolvedCity
        : trimmed
      applyCityQuery(nextCity)
    } catch (error) {
      if (error instanceof Error && error.message === "CITY_NOT_FOUND") {
        router.push(`/city-not-found?city=${encodeURIComponent(trimmed)}`)
        return
      }

      applyCityQuery(trimmed)
    }
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser. Showing New Delhi by default.")
      setSearchValue(DEFAULT_CITY)
      pushWithCity(DEFAULT_CITY)
      return
    }

    setLocationError("")
    setIsDetectingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const reverse = await reverseGeocodeCity(latitude, longitude)
          const nextCity = reverse?.city || DEFAULT_CITY
          setSearchValue(nextCity)
          applyCityQuery(nextCity)
        } catch {
          setLocationError("Unable to resolve your location. Showing New Delhi by default.")
          setSearchValue(DEFAULT_CITY)
          pushWithCity(DEFAULT_CITY)
        } finally {
          setIsDetectingLocation(false)
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location access denied. Showing New Delhi by default.")
        } else {
          setLocationError("Could not fetch your current location. Showing New Delhi by default.")
        }
        setSearchValue(DEFAULT_CITY)
        pushWithCity(DEFAULT_CITY)
        setIsDetectingLocation(false)
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
    )
  }

  return (
    <header className="relative border-b border-white/20 bg-white/60 px-3 py-2.5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:px-4 lg:px-6">
      <div className="flex min-h-12 items-center gap-2 sm:gap-3 lg:gap-4">
        <div className="flex h-12 min-w-12 shrink-0 items-center justify-center lg:hidden">
          <Image src="/logo.png" alt="EnviroSense" width={52} height={52} className="h-12 w-12 shrink-0 object-contain" />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center">
          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            onSubmit={handleSearchSubmit}
            isDetectingLocation={isDetectingLocation}
            onUseCurrentLocation={handleUseCurrentLocation}
          />
        </div>

        <ActionButtons
          mounted={mounted}
          isDark={theme === "dark"}
          onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        />
      </div>

      {locationError ? (
        <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300" role="status" aria-live="polite">
          {locationError}
        </p>
      ) : null}
    </header>
  )
}
