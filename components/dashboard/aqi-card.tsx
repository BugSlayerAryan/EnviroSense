
"use client"

import { Wind, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { fetchAqiData } from "@/api/api"
import { AqiMetricSkeleton } from "@/components/dashboard/loading-states"

type AqiCardProps = {
  initialCity?: string
}

export function AqiCard({ initialCity }: AqiCardProps) {
  const searchParams = useSearchParams()
  const cityQuery = initialCity ?? searchParams.get("city") ?? "New Delhi, IN"
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [aqi, setAqi] = useState<number | null>(null)
  const [pm25, setPm25] = useState<number | null>(null)
  const [pm10, setPm10] = useState<number | null>(null)
  const [co, setCo] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const aqiLabel = useMemo(() => {
    if (aqi === null) return "Unavailable"
    if (aqi <= 50) return "Good"
    if (aqi <= 100) return "Moderate"
    if (aqi <= 150) return "Unhealthy for Sensitive Groups"
    if (aqi <= 200) return "Unhealthy"
    return "Very Unhealthy"
  }, [aqi])

  const handleRefresh = async (requestedCity?: string) => {
    setIsRefreshing(true)
    setIsLoading(true)
    try {
      const data = await fetchAqiData((requestedCity ?? cityQuery).split(",")[0].trim())
      setAqi(typeof data?.aqi === "number" ? data.aqi : null)
      setPm25(typeof data?.pollutants?.pm25 === "number" ? Number(data.pollutants.pm25.toFixed(1)) : null)
      setPm10(typeof data?.pollutants?.pm10 === "number" ? Number(data.pollutants.pm10.toFixed(1)) : null)
      setCo(typeof data?.pollutants?.co === "number" ? Number(data.pollutants.co.toFixed(1)) : null)
    } catch {
      setAqi(null)
      setPm25(null)
      setPm10(null)
      setCo(null)
    }
    setIsRefreshing(false)
    setIsLoading(false)
  }

  useEffect(() => {
    void handleRefresh(cityQuery)
  }, [cityQuery])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void handleRefresh(cityQuery)
    }, 120000)

    return () => window.clearInterval(interval)
  }, [cityQuery])

  if (isLoading) {
    return <AqiMetricSkeleton />
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }} whileHover={{ y: -2 }} className="glass-card glow-red flex h-full flex-col p-3.5 sm:p-4 transition-all duration-300 ease-in-out">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-white sm:text-base">Live Air Quality</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Real-time monitoring · PM2.5, PM10, CO</p>
        </div>
        <button aria-label="Refresh AQI data" title="Refresh" onClick={() => void handleRefresh()} className="rounded-xl bg-white/70 p-2 shadow-sm dark:bg-white/10 dark:shadow-[0_0_20px_rgba(248,113,113,0.4)] hover:scale-110 transition-transform">
          {isRefreshing ? <span className="inline-block h-4 w-4 rounded-full bg-red-400/70 animate-pulse dark:bg-red-300/70" /> : <RefreshCw className="h-4 w-4 text-red-400 dark:text-white/80" />}
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-xl bg-linear-to-r from-red-200/40 to-orange-200/40 p-4 dark:from-red-500/20 dark:to-orange-500/20">
        <div>
          <p className="text-4xl font-bold text-gray-800 dark:text-white sm:text-5xl">{aqi ?? "--"}</p>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-500/20 dark:text-red-300">
            {aqi === null ? "--" : aqiLabel}
          </span>
        </div>
        <Wind className="h-10 w-10 text-red-400 dark:text-red-300 sm:h-12 sm:w-12" />
      </div>

      <div className="flex flex-col justify-between gap-3 border-t border-white/40 pt-3 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
        <div className="flex items-center justify-between rounded-lg bg-white/20 p-2.5 dark:bg-white/5 sm:p-3"><span>PM2.5</span><strong className="text-gray-800 dark:text-white">{pm25 ?? "--"}{pm25 !== null ? " µg/m³" : ""}</strong></div>
        <div className="flex items-center justify-between rounded-lg bg-white/20 p-2.5 dark:bg-white/5 sm:p-3"><span>PM10</span><strong className="text-gray-800 dark:text-white">{pm10 ?? "--"}{pm10 !== null ? " µg/m³" : ""}</strong></div>
        <div className="flex items-center justify-between rounded-lg bg-white/20 p-2.5 dark:bg-white/5 sm:p-3"><span>CO</span><strong className="text-gray-800 dark:text-white">{co ?? "--"}{co !== null ? " ppm" : ""}</strong></div>
      </div>
    </motion.div>
  )
}
