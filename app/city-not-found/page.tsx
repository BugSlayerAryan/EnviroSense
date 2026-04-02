"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { MapPinOff, RotateCcw, Search, Sparkles } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { DashboardBackground } from "@/components/dashboard/background"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { Navbar } from "@/components/dashboard/navbar"
import { Sidebar } from "@/components/dashboard/sidebar"
import { CityNotFoundLoading } from "@/components/dashboard/route-loading"

export const dynamic = 'force-dynamic'

const suggestedCities = ["Mumbai", "Delhi", "Bengaluru", "Kolkata", "Chennai"]

export default function CityNotFoundPage() {
  return (
    <Suspense fallback={<CityNotFoundLoading />}>
      <CityNotFoundContent />
    </Suspense>
  )
}

function CityNotFoundContent() {
  const searchParams = useSearchParams()
  const city = searchParams.get("city")?.trim() || "Unknown city"

  return (
    <main className="relative h-dvh overflow-hidden">
      <DashboardBackground />

      <div className="relative z-10 flex h-full w-full">
        <Sidebar />

        <div className="min-w-0 flex flex-1 flex-col">
          <div className="sticky top-0 z-20 shrink-0 border-b border-white/30 dark:border-white/10">
            <Navbar />
          </div>

          <section className="dashboard-scroll flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/35 bg-white/65 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55 sm:p-8"
            >
              <motion.div
                aria-hidden
                animate={{ x: [0, 10, 0], y: [0, -6, 0] }}
                transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-rose-400/20 blur-3xl dark:bg-rose-500/15"
              />
              <motion.div
                aria-hidden
                animate={{ x: [0, -8, 0], y: [0, 8, 0] }}
                transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/15"
              />

              <div className="relative z-10">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Search status
                </div>

                <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                  <div>
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/12 text-rose-600 ring-1 ring-rose-500/25 dark:bg-rose-500/20 dark:text-rose-300">
                      <MapPinOff className="h-7 w-7" />
                    </div>

                    <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                      We could not find weather data for this city
                    </h1>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                      The city name may be misspelled, unavailable right now, or not supported by the live weather provider.
                      Try searching a nearby major city.
                    </p>

                    <div className="mt-6 rounded-2xl border border-rose-200/70 bg-rose-50/80 p-4 dark:border-rose-500/25 dark:bg-rose-950/25">
                      <p className="text-xs font-semibold uppercase tracking-wide text-rose-700/90 dark:text-rose-300/90">Searched city</p>
                      <p className="mt-1 wrap-break-word text-lg font-semibold text-rose-900 dark:text-rose-100">{city}</p>
                    </div>

                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Back to Dashboard
                      </Link>
                      <Link
                        href="/?city=New%20Delhi"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300/80 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                      >
                        <Search className="h-4 w-4" />
                        Try New Delhi
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/70 bg-white/70 p-5 shadow-inner dark:border-white/10 dark:bg-slate-900/45">
                    <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Try one of these cities</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                      {suggestedCities.map((suggestedCity, index) => (
                        <motion.div
                          key={suggestedCity}
                          initial={{ opacity: 0, x: 18 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: 0.1 + index * 0.06 }}
                        >
                          <Link
                            href={`/?city=${encodeURIComponent(suggestedCity)}`}
                            className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-300 hover:border-cyan-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-cyan-400/50 dark:hover:text-white"
                          >
                            <span>{suggestedCity}</span>
                            <span className="text-xs opacity-60 transition-opacity group-hover:opacity-100">Use city</span>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        </div>
      </div>

      <MobileNav />
    </main>
  )
}
