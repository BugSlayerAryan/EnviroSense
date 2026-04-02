"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useTheme } from "next-themes"
import { useSearchParams } from "next/navigation"
import { fetchAqiData } from "@/api/api"
import { ChartSkeleton } from "@/components/dashboard/loading-states"

type AqiTrendPoint = {
  day: string
  aqi: number | null
}

type AqiTrendStore = Record<string, number>

type ApiTrendPoint = {
  day?: string
  date?: string
  aqi?: number | null
}

const AQI_TREND_HISTORY_KEY = "envirosense-aqi-trend-history-v1"

function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function getDateLabel(date = new Date()) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function readAqiTrendStore(): AqiTrendStore {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(AQI_TREND_HISTORY_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? (parsed as AqiTrendStore) : {}
  } catch {
    return {}
  }
}

function writeAqiTrendStore(store: AqiTrendStore) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(AQI_TREND_HISTORY_KEY, JSON.stringify(store))
  } catch {
    // Ignore storage failures.
  }
}

function buildLastSevenDaysAqi(currentAqi: number | null, store: AqiTrendStore) {
  const chartData: AqiTrendPoint[] = []

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - offset)
    const dateKey = getDateKey(date)
    const storedValue = store[dateKey]
    chartData.push({
      day: getDateLabel(date),
      aqi: typeof storedValue === "number" ? storedValue : offset === 0 ? currentAqi : null,
    })
  }

  return chartData
}

function AqiTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/40 bg-white/90 px-3 py-2 text-xs text-gray-700 backdrop-blur-md shadow-md dark:border-white/10 dark:bg-[#020617]/90 dark:text-gray-200">
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{payload[0].payload.day}</p>
      <p className="font-semibold text-red-500 dark:text-red-300">AQI: {payload[0].value}</p>
    </div>
  )
}

export function AqiTrendChart() {
  const searchParams = useSearchParams()
  const cityQuery = searchParams.get("city") ?? "New Delhi, India"
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const strokeGradient = isDark ? "url(#aqiStrokeDark)" : "url(#aqiStroke)"
  const fillGradient = isDark ? "url(#aqiFillDark)" : "url(#aqiFill)"
  const [data, setData] = useState<AqiTrendPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadTrend() {
      setIsLoading(true)
      try {
        const aqiData = await fetchAqiData(cityQuery)
        const currentAqi = typeof aqiData?.aqi === "number" ? aqiData.aqi : null
        const apiTrend = Array.isArray(aqiData?.trend)
          ? (aqiData.trend as ApiTrendPoint[])
              .map((point: ApiTrendPoint) => ({
                day: point.day ?? point.date ?? "",
                aqi: typeof point.aqi === "number" ? point.aqi : null,
              }))
              .filter((point) => point.day)
          : []

        if (apiTrend.length > 0) {
          if (isMounted) {
            setData(apiTrend.slice(-7))
          }
          return
        }

        const store = readAqiTrendStore()
        const todayKey = getDateKey()
        if (currentAqi !== null) {
          store[todayKey] = currentAqi
        }

        const chartData = buildLastSevenDaysAqi(currentAqi, store)
        writeAqiTrendStore(store)

        if (isMounted) {
          setData(chartData)
        }
      } catch {
        const store = readAqiTrendStore()
        const chartData = buildLastSevenDaysAqi(null, store)
        if (isMounted) {
          setData(chartData)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadTrend()
    return () => {
      isMounted = false
    }
  }, [cityQuery])

  const chartData = useMemo(() => data.slice(0, 7), [data])

  if (isLoading) {
    return <ChartSkeleton className="p-4 sm:p-5 md:p-6" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.4 }}
      whileHover={{ y: -2 }}
      className="glass-card glow-red p-4 sm:p-5 md:p-6 transition-all duration-300 ease-in-out"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-red-200/20 to-transparent dark:from-red-500/10" />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Air Quality Index</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Last 7 days</p>
        </div>
        <button className="rounded-lg bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-white/85 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15">
          View More
        </button>
      </div>

      <div className="h-40 w-full sm:h-44 md:h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="aqiStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
              <linearGradient id="aqiFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#fb923c" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="aqiStrokeDark" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
              <linearGradient id="aqiFillDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#fb923c" stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb"} />
            <XAxis dataKey="day" tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<AqiTooltip />} />
            <Area
              type="monotone"
              dataKey="aqi"
              stroke={strokeGradient}
              strokeWidth={3}
              fill={fillGradient}
              isAnimationActive={true}
              animationDuration={900}
              connectNulls
              dot={{ fill: "#ffffff", stroke: isDark ? "#fb923c" : "#f87171", strokeWidth: 1.5, r: 3.5 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
