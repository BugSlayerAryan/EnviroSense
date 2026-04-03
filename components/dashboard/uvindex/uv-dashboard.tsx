"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { UvAlertCard } from "@/components/dashboard/uvindex/uv-alert-card"
import { UvExposureCard } from "@/components/dashboard/uvindex/uv-exposure-card"
import { UvHero } from "@/components/dashboard/uvindex/uv-hero"
import { UvHourlyChart } from "@/components/dashboard/uvindex/uv-hourly-chart"
import { UvRecommendations } from "@/components/dashboard/uvindex/uv-recommendations"
import { UvWeeklyForecast } from "@/components/dashboard/uvindex/uv-weekly-forecast"
import { MetricCardSkeleton, ChartSkeleton, ForecastListSkeleton } from "@/components/dashboard/loading-states"
import type { DailyUvPoint, HourlyUvPoint } from "@/components/dashboard/uvindex/utils"
import { fetchUvData } from "@/api/api"
import { useSearchParams } from "next/navigation"
import { UvDashboardSkeleton } from "@/components/dashboard/loading-states"

const hourlyUvData: HourlyUvPoint[] = []

const weeklyUvData: DailyUvPoint[] = []

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-44 animate-pulse rounded-3xl border border-slate-200/80 bg-white/70 dark:border-slate-700 dark:bg-slate-800/65" />
      <div className="h-72 animate-pulse rounded-3xl border border-slate-200/80 bg-white/70 dark:border-slate-700 dark:bg-slate-800/65" />
      <div className="h-64 animate-pulse rounded-3xl border border-slate-200/80 bg-white/70 dark:border-slate-700 dark:bg-slate-800/65" />
    </div>
  )
}

type UvDashboardProps = {
  initialCity?: string
}

export function UvDashboard({ initialCity }: UvDashboardProps) {
  const searchParams = useSearchParams()
  const cityQuery = initialCity ?? searchParams.get("city") ?? "New Delhi, India"
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [skinType, setSkinType] = useState("Type III")
  const [currentUv, setCurrentUv] = useState<number | null>(null)
  const [location, setLocation] = useState<string | null>(null)
  const [hourlyData, setHourlyData] = useState<HourlyUvPoint[]>(hourlyUvData)
  const [weeklyData, setWeeklyData] = useState<DailyUvPoint[]>(weeklyUvData)

  const nowLabel = useMemo(() => {
    return new Date().toLocaleString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }, [])

  const refreshData = async (requestedCity?: string) => {
    setError(null)
    setLoading(true)
    try {
      const selectedCity = requestedCity ?? location ?? cityQuery
      const data = await fetchUvData(selectedCity)
      setCurrentUv(typeof data?.currentUv === "number" ? data.currentUv : null)
      setHourlyData(Array.isArray(data?.hourly) ? data.hourly : [])
      setWeeklyData(Array.isArray(data?.weekly) ? data.weekly : [])
      if (data?.location) {
        setLocation(data.location)
      } else {
        setLocation(null)
      }
    } catch {
      setError("Unable to fetch UV index data.")
    }
    setLoading(false)
  }

  useEffect(() => {
    void refreshData(cityQuery)
  }, [cityQuery])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshData(cityQuery)
    }, 180000)

    return () => window.clearInterval(intervalId)
  }, [cityQuery])


  // Per-card loading skeletons
  const renderHero = loading ? <MetricCardSkeleton /> : <UvHero uvValue={currentUv} location={location} currentTime={nowLabel} />
  const renderHourlyChart = loading ? <ChartSkeleton className="min-h-90" /> : <UvHourlyChart data={hourlyData} currentHour={new Date().getHours()} />
  const renderWeekly = loading ? <ForecastListSkeleton rows={7} /> : <UvWeeklyForecast data={weeklyData} />
  const renderRecommendations = loading ? <MetricCardSkeleton /> : <UvRecommendations uvValue={currentUv} />
  const renderExposure = loading ? <MetricCardSkeleton /> : <UvExposureCard uvValue={currentUv} skinType={skinType} onSkinTypeChange={setSkinType} />
  const renderAlert = loading ? <MetricCardSkeleton /> : <UvAlertCard uvValue={currentUv} />

  return (
    <section className="dashboard-scroll relative isolate flex-1 overflow-y-auto bg-slate-50 px-3 pb-24 pt-4 dark:bg-slate-950 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(14,165,233,0.1),transparent_34%),radial-gradient(circle_at_88%_4%,rgba(59,130,246,0.08),transparent_28%)] dark:bg-[radial-gradient(circle_at_14%_8%,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_88%_4%,rgba(96,165,250,0.14),transparent_28%)]" />

      <div className="relative z-10">
        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => void refreshData()}
              className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : null}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          {renderHero}
          {renderHourlyChart}
          {renderWeekly}

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {renderRecommendations}
            {renderExposure}
          </div>

          {renderAlert}
        </motion.div>
      </div>
    </section>
  )
}
