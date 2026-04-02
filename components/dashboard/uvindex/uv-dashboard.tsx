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

const hourlyUvData: HourlyUvPoint[] = [
  { time: "07:00", hour24: 7, uv: 0.8 },
  { time: "08:00", hour24: 8, uv: 1.6 },
  { time: "09:00", hour24: 9, uv: 3.4 },
  { time: "10:00", hour24: 10, uv: 5.8 },
  { time: "11:00", hour24: 11, uv: 8.4 },
  { time: "12:00", hour24: 12, uv: 10.2 },
  { time: "13:00", hour24: 13, uv: 9.7 },
  { time: "14:00", hour24: 14, uv: 8.3 },
  { time: "15:00", hour24: 15, uv: 6.2 },
  { time: "16:00", hour24: 16, uv: 3.7 },
  { time: "17:00", hour24: 17, uv: 1.9 },
  { time: "18:00", hour24: 18, uv: 0.9 },
]

const weeklyUvData: DailyUvPoint[] = [
  { day: "Mon", uvMax: 9.7 },
  { day: "Tue", uvMax: 8.8 },
  { day: "Wed", uvMax: 10.4 },
  { day: "Thu", uvMax: 7.1 },
  { day: "Fri", uvMax: 9.1 },
  { day: "Sat", uvMax: 6.4 },
  { day: "Sun", uvMax: 8.2 },
]

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-44 animate-pulse rounded-3xl border border-slate-200/80 bg-white/70 dark:border-slate-700 dark:bg-slate-800/65" />
      <div className="h-72 animate-pulse rounded-3xl border border-slate-200/80 bg-white/70 dark:border-slate-700 dark:bg-slate-800/65" />
      <div className="h-64 animate-pulse rounded-3xl border border-slate-200/80 bg-white/70 dark:border-slate-700 dark:bg-slate-800/65" />
    </div>
  )
}

export function UvDashboard() {
  const searchParams = useSearchParams()
  const cityQuery = searchParams.get("city") ?? "New Delhi, India"
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skinType, setSkinType] = useState("Type III")
  const [currentUv, setCurrentUv] = useState(9.7)
  const [location, setLocation] = useState("New Delhi, India")
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
      const selectedCity = requestedCity ?? location
      const data = await fetchUvData(selectedCity)
      if (typeof data?.currentUv === "number") {
        setCurrentUv(data.currentUv)
      }
      if (Array.isArray(data?.hourly) && data.hourly.length > 0) {
        setHourlyData(data.hourly)
      }
      if (Array.isArray(data?.weekly) && data.weekly.length > 0) {
        setWeeklyData(data.weekly)
      }
      if (data?.location) {
        setLocation(data.location)
      } else {
        setLocation(selectedCity)
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
