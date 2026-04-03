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

function getAqiLabel(value: number | null) {
  if (value === null) return "Unknown"
  if (value <= 50) return "Good"
  if (value <= 100) return "Moderate"
  if (value <= 150) return "Poor"
  return "Unhealthy"
}

function getAqiColor(value: number | null) {
  if (value === null) return "#9ca3af"
  if (value <= 50) return "#22c55e"
  if (value <= 100) return "#eab308"
  if (value <= 150) return "#f97316"
  return "#ef4444"
}

function getAqiTextClass(value: number | null) {
  if (value === null) return "text-gray-500 dark:text-gray-300"
  if (value <= 50) return "text-green-600 dark:text-green-300"
  if (value <= 100) return "text-yellow-600 dark:text-yellow-300"
  if (value <= 150) return "text-orange-600 dark:text-orange-300"
  return "text-red-600 dark:text-red-300"
}

function getAqiTrendInsight(points: AqiTrendPoint[]) {
  const values = points.map((point) => point.aqi).filter((value): value is number => typeof value === "number")
  if (values.length < 2) return "AQI trend is stabilizing"

  const first = values[0]
  const last = values[values.length - 1]
  const delta = last - first

  if (delta <= -8) return "Air quality improving this week"
  if (delta >= 8) return "AQI rising this week"
  return "Air quality is mostly stable this week"
}

function buildAqiGradientStops(points: AqiTrendPoint[]) {
  const normalized = points.map((point) => point.aqi)
  const size = Math.max(1, normalized.length - 1)

  return normalized.map((value, index) => ({
    offset: `${(index / size) * 100}%`,
    color: getAqiColor(value ?? null),
  }))
}

function AqiTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as AqiTrendPoint
  const value = typeof payload[0]?.value === "number" ? payload[0].value : null

  return (
    <div className="rounded-lg border border-white/40 bg-white/90 px-3 py-2 text-xs text-gray-700 backdrop-blur-md shadow-md dark:border-white/10 dark:bg-[#020617]/90 dark:text-gray-200">
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{point.day}</p>
      <p className={`font-semibold ${getAqiTextClass(value)}`}>
        {point.day}: AQI {value ?? "--"} ({getAqiLabel(value)})
      </p>
    </div>
  )
}

type AqiTrendChartProps = {
  initialCity?: string
}

export function AqiTrendChart({ initialCity }: AqiTrendChartProps) {
  const searchParams = useSearchParams()
  const cityQuery = initialCity ?? searchParams.get("city") ?? "New Delhi, IN"
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
  const aqiGradientStops = useMemo(() => buildAqiGradientStops(chartData), [chartData])
  const trendInsight = useMemo(() => getAqiTrendInsight(chartData), [chartData])

  const yTicks = useMemo(() => {
    const maxAqi = Math.max(160, ...chartData.map((point) => point.aqi ?? 0))
    if (maxAqi <= 100) return [0, 50, 100]
    if (maxAqi <= 200) return [0, 50, 100, 150, 200]
    return [0, 50, 100, 150, 200, 300]
  }, [chartData])

  if (isLoading) {
    return <ChartSkeleton className="p-4" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.4 }}
      whileHover={{ y: -2 }}
      className="glass-card glow-red border border-white/40 p-4 shadow-[0_12px_32px_rgba(239,68,68,0.12)] transition-all duration-200 ease-in-out"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-red-200/20 to-transparent dark:from-red-500/10" />

      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Air Quality Index Trend</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Last 7 days</p>
          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-200">
            {trendInsight}
          </p>
        </div>
        <button className="rounded-md bg-white/65 px-2.5 py-1 text-sm font-medium text-gray-700 opacity-80 shadow-sm transition-all duration-200 hover:opacity-100 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15">
          View More
        </button>
      </div>

      <div className="h-36 w-full sm:h-40 md:h-44 lg:h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="aqiStroke" x1="0" y1="0" x2="1" y2="0">
                {aqiGradientStops.map((stop, index) => (
                  <stop key={`aqi-stop-${index}`} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
              <linearGradient id="aqiFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#fb923c" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="aqiStrokeDark" x1="0" y1="0" x2="1" y2="0">
                {aqiGradientStops.map((stop, index) => (
                  <stop key={`aqi-stop-dark-${index}`} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
              <linearGradient id="aqiFillDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#fb923c" stopOpacity={0.06} />
              </linearGradient>
              <filter id="aqiDotGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.07)" : "rgba(148,163,184,0.22)"} />
            <XAxis dataKey="day" tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis ticks={yTicks} tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={26} />
            <Tooltip content={<AqiTooltip />} />
            <Area
              type="monotone"
              dataKey="aqi"
              stroke={strokeGradient}
              strokeWidth={3}
              fill={fillGradient}
              isAnimationActive={true}
              animationDuration={950}
              connectNulls
              dot={({ cx, cy, payload, index }: any) => {
                if (typeof cx !== "number" || typeof cy !== "number") return null
                return (
                  <circle
                    key={`aqi-dot-${payload?.day ?? "day"}-${index ?? 0}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={getAqiColor(payload?.aqi ?? null)}
                    stroke="#ffffff"
                    strokeWidth={1.2}
                    filter="url(#aqiDotGlow)"
                  />
                )
              }}
              activeDot={{ r: 6, fill: isDark ? "#fda4af" : "#ef4444" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
