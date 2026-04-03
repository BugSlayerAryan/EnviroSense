"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, MapPin, Plus, Search, Trash2 } from "lucide-react"
import { DashboardBackground } from "@/components/dashboard/background"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { Navbar } from "@/components/dashboard/navbar"
import { Sidebar } from "@/components/dashboard/sidebar"
import { buildDashboardRoute } from "@/lib/location-route"

export const dynamic = 'force-dynamic'

const STORAGE_KEY = "enviromonitor.savedCities"

function normalizeCity(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

export default function SaveCityPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cityParam = searchParams.get("city")
  let cityCountry = null
  let cityName = null
  if (cityParam) {
    // Try to split "City, Country" format
    const parts = cityParam.split(",")
    if (parts.length >= 2) {
      cityName = parts[0].trim()
      cityCountry = parts.slice(1).join(",").trim()
    } else {
      cityName = cityParam.trim()
    }
  }
  const [mounted, setMounted] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [cities, setCities] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setCities(parsed.filter((item): item is string => typeof item === "string"))
        }
      }
    } catch {
      setCities([])
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cities))
  }, [cities, mounted])

  const hasSavedCities = cities.length > 0
  const trimmedInput = useMemo(() => normalizeCity(inputValue), [inputValue])

  const addCity = () => {
    const cityName = normalizeCity(inputValue)

    if (!cityName) {
      setError("Enter a city name to save it.")
      return
    }

    if (cities.some((city) => city.toLowerCase() === cityName.toLowerCase())) {
      setError("That city is already saved.")
      return
    }

    setError(null)
    setCities((current) => [cityName, ...current])
    setInputValue("")
    router.push(buildDashboardRoute(cityName))
  }

  const removeCity = (cityName: string) => {
    setCities((current) => current.filter((city) => city !== cityName))
  }

  return (
    <main className="relative h-dvh overflow-hidden">
      <DashboardBackground />

      <div className="relative z-10 flex h-full w-full">
        <Sidebar />

        <div className="min-w-0 flex flex-1 flex-col">
          <div className="sticky top-0 z-20 shrink-0 border-b border-white/30 dark:border-white/10">
            <Navbar />
          </div>

          <section className="dashboard-scroll flex-1 overflow-y-auto px-3 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_20px_60px_rgba(14,116,144,0.12)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/60 sm:p-6 lg:p-8"
            >
              <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Saved Locations</p>
                  <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
                    Save City
                  </h1>
                  {/* <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                    Add cities to local storage for quick access across the app. No backend required.
                  </p> */}
                  {cityParam && cityCountry && cityName && !cities.some((city) => city.toLowerCase() === `${cityName}, ${cityCountry}`.toLowerCase()) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300"
                        onClick={() => {
                          setCities((current) => [`${cityName}, ${cityCountry}`, ...current])
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Save current city: {cityName}, {cityCountry}
                      </button>
                    </div>
                  )}
                </div>
                <div className="inline-flex rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/85 dark:text-slate-300">
                  {hasSavedCities ? `${cities.length} cities saved` : "No cities saved yet"}
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm transition focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-200 dark:border-slate-700 dark:bg-slate-800/85 dark:focus-within:border-sky-500/40 dark:focus-within:ring-sky-500/20">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    aria-label="City name"
                    value={inputValue}
                    onChange={(event) => {
                      setInputValue(event.target.value)
                      if (error) setError(null)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addCity()
                    }}
                    placeholder="Search or type a city name..."
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  />
                </label>

                <button
                  type="button"
                  onClick={addCity}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-sky-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(14,165,233,0.25)] transition hover:scale-[1.01] hover:shadow-[0_14px_30px_rgba(14,165,233,0.3)]"
                >
                  <Plus className="h-4 w-4" />
                  Add City
                </button>
              </div>

              {error ? (
                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                  {error}
                </div>
              ) : null}

              <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 dark:border-slate-700 dark:bg-slate-800/70">
                  <MapPin className="h-3.5 w-3.5" />
                  {hasSavedCities ? `${cities.length} saved cities` : "No saved cities yet"}
                </span>
                {trimmedInput ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 dark:border-slate-700 dark:bg-slate-800/70">
                    Preview: {trimmedInput}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {hasSavedCities ? (
                  cities.map((city) => (
                    <motion.article
                      key={city}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22 }}
                      whileHover={{ y: -2 }}
                      onClick={() => router.push(buildDashboardRoute(city))}
                      className="flex h-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.1)] dark:border-slate-700 dark:bg-slate-800/85"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-sky-100 to-cyan-100 text-sky-600 shadow-sm dark:from-sky-500/20 dark:to-cyan-500/15 dark:text-sky-300">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{city}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Saved locally on this device</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeCity(city)
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </motion.article>
                  ))
                ) : (
                  <div className="col-span-1 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center dark:border-slate-700 dark:bg-slate-800/60 lg:col-span-2">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">No cities saved yet</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Add a city above to store it locally and reuse it later.</p>
                  </div>
                )}
              </div>
            </motion.section>
          </section>
        </div>
      </div>

      <MobileNav />
    </main>
  )
}
