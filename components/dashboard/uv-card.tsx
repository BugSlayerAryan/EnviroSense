
"use client"

import { AlertTriangle, Radiation, Sun, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { fetchUvData } from "@/api/api"
import { UvMetricSkeleton } from "@/components/dashboard/loading-states"

type UvCardProps = {
  initialCity?: string
}

export function UvCard({ initialCity }: UvCardProps) {
  const searchParams = useSearchParams()
  const cityQuery = initialCity ?? searchParams.get("city") ?? "New Delhi, IN"
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [uv, setUv] = useState<number | null>(null)
  const [sunlightHours, setSunlightHours] = useState<number | null>(null)
  const [radiation, setRadiation] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const uvLabel = useMemo(() => {
    if (uv === null) return "Unavailable"
    if (uv <= 2) return "Low"
    if (uv <= 5) return "Moderate"
    if (uv <= 7) return "High"
    if (uv <= 10) return "Very High"
    return "Extreme"
  }, [uv])

  const recommendation = useMemo(() => {
    if (uv === null) return "UV data unavailable"
    if (uv <= 2) return "Low exposure risk · Minimal protection required"
    if (uv <= 5) return "Moderate exposure · Recommended: SPF 30+ sunscreen"
    if (uv <= 7) return "High exposure · Recommended: Protective clothing & SPF 50+"
    if (uv <= 10) return "Very high exposure · Caution: Frequent sunscreen reapplication"
    return "Extreme exposure · Critical: Limit outdoor time 10 AM - 4 PM"
  }, [uv])

  const handleRefresh = async (requestedCity?: string, forceFresh = false) => {
    setIsRefreshing(true)
    setIsLoading(true)
    try {
      const data = await fetchUvData(requestedCity ?? cityQuery, !forceFresh)
      if (typeof data?.currentUv === "number") {
        setUv(Math.round(data.currentUv))
      } else {
        setUv(null)
      }
      setSunlightHours(typeof data?.sunlightHours === "number" ? data.sunlightHours : null)
      setRadiation(typeof data?.estimatedRadiationWm2 === "number" ? data.estimatedRadiationWm2 : null)
    } catch {
      setUv(null)
      setSunlightHours(null)
      setRadiation(null)
    }
    setIsRefreshing(false)
    setIsLoading(false)
  }

  useEffect(() => {
    void handleRefresh(cityQuery)
  }, [cityQuery])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void handleRefresh(cityQuery, true)
    }, 120000)

    return () => window.clearInterval(interval)
  }, [cityQuery])

  if (isLoading) {
    return <UvMetricSkeleton />
  }

  const normalizedUv = uv ?? 0
  const computedSunlight = sunlightHours ?? Number((12 - Math.min(normalizedUv, 11) * 0.35).toFixed(1))
  const computedRadiation = radiation ?? Number((normalizedUv * 20).toFixed(0))
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.3 }} whileHover={{ y: -2 }} className="glass-card glow-yellow flex flex-col p-3.5 shadow-md transition-all duration-300 ease-in-out sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white sm:text-base">Live UV Index</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Solar radiation index · Health protection data</p>
        </div>
        <button aria-label="Refresh UV data" title="Refresh" onClick={() => void handleRefresh(undefined, true)} className="rounded-lg bg-white/60 p-1.5 shadow-sm transition-all hover:bg-white/80 active:scale-95 dark:bg-white/10 dark:hover:bg-white/15">
          {isRefreshing ? <span className="inline-block h-4 w-4 rounded-full bg-yellow-400/70 animate-pulse dark:bg-yellow-300/70" /> : <RefreshCw className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />}
        </button>
      </div>

      <div className="mb-4 rounded-lg bg-linear-to-r from-yellow-100/50 to-orange-100/50 p-4 dark:from-yellow-500/15 dark:to-orange-500/15 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">{uv ?? "--"}</p>
            <span className="mt-2 inline-flex rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
              {uv === null ? "--" : uvLabel}
            </span>
          </div>
          <Sun className="mt-1 h-10 w-10 text-yellow-500 dark:text-yellow-400 sm:h-12 sm:w-12" />
        </div>
      </div>

      <div className="mt-auto space-y-2 text-xs text-gray-600 dark:text-gray-400 sm:space-y-2.5">
        <div className="flex items-center justify-between rounded-lg border border-white/20 bg-white/20 px-3 py-2 dark:border-white/10 dark:bg-white/5">
          <span className="flex items-center gap-2"><Sun className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />Sunlight</span>
          <strong className="text-gray-900 dark:text-white">{sunlightHours === null ? "--" : `${computedSunlight} hrs`}</strong>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-white/20 bg-white/20 px-3 py-2 dark:border-white/10 dark:bg-white/5">
          <span className="flex items-center gap-2"><Radiation className="h-4 w-4 text-orange-500 dark:text-orange-400" />Radiation</span>
          <strong className="text-gray-900 dark:text-white">{radiation === null ? "--" : `${computedRadiation} W/m²`}</strong>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>{recommendation}</span>
      </div>
    </motion.div>
  )
}
