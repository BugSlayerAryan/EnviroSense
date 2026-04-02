"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { UvAlertCard } from "@/components/dashboard/uvindex/uv-alert-card"
import { UvExposureCard } from "@/components/dashboard/uvindex/uv-exposure-card"
import { UvHero } from "@/components/dashboard/uvindex/uv-hero"
import { UvHourlyChart } from "@/components/dashboard/uvindex/uv-hourly-chart"
import { UvRecommendations } from "@/components/dashboard/uvindex/uv-recommendations"
import { UvWeeklyForecast } from "@/components/dashboard/uvindex/uv-weekly-forecast"
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

  if (loading) {
    return (
      <section className="dashboard-scroll flex-1 overflow-y-auto px-3 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
        <UvDashboardSkeleton />
      </section>
    )
  }

  return (
    <section className="dashboard-scroll flex-1 overflow-y-auto px-3 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
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

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <UvHero uvValue={currentUv} location={location} currentTime={nowLabel} />
          <UvHourlyChart data={hourlyData} currentHour={new Date().getHours()} />
          <UvWeeklyForecast data={weeklyData} />

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <UvRecommendations uvValue={currentUv} />
            <UvExposureCard uvValue={currentUv} skinType={skinType} onSkinTypeChange={setSkinType} />
          </div>

          <UvAlertCard uvValue={currentUv} />
        </motion.div>
      )}
    </section>
  )
}
