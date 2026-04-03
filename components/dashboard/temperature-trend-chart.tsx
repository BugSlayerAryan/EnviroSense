"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useTheme } from "next-themes"
import { useSearchParams } from "next/navigation"
import { fetchWeatherData } from "@/api/api"
import { ChartSkeleton } from "@/components/dashboard/loading-states"

type TemperaturePoint = {
  day: string
  temp: number | null
}

type ApiHistoryPoint = {
  day?: string
  date?: string
  temp?: number | null
}

type TempStore = Record<string, number>

const TEMP_TREND_HISTORY_KEY = "envirosense-temp-trend-history-v1"

function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function getDateLabel(date = new Date()) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function readTempStore(): TempStore {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(TEMP_TREND_HISTORY_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? (parsed as TempStore) : {}
  } catch {
    return {}
  }
}

function writeTempStore(store: TempStore) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(TEMP_TREND_HISTORY_KEY, JSON.stringify(store))
  } catch {
    // Ignore storage failures.
  }
}

function buildLastSevenDaysTemp(currentTemp: number | null, store: TempStore) {
  const chartData: TemperaturePoint[] = []

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - offset)
    const dateKey = getDateKey(date)
    const storedValue = store[dateKey]
    chartData.push({
      day: getDateLabel(date),
      temp: typeof storedValue === "number" ? storedValue : offset === 0 ? currentTemp : null,
    })
  }

  return chartData
}

function buildApiHistoryByDay(history: ApiHistoryPoint[]) {
  const byDay: Record<string, number> = {}
  for (const item of history) {
    const dayLabel = typeof item?.day === "string" && item.day.trim() ? item.day.trim() : null
    if (!dayLabel) continue
    const tempValue = typeof item?.temp === "number" ? Math.round(item.temp) : null
    if (tempValue === null) continue
    byDay[dayLabel] = tempValue
  }
  return byDay
}

function mergeHistoryIntoSeries(points: TemperaturePoint[], apiHistoryByDay: Record<string, number>) {
  return points.map((point) => {
    const apiTemp = apiHistoryByDay[point.day]
    if (typeof apiTemp === "number") {
      return { ...point, temp: apiTemp }
    }
    return point
  })
}

function getTempTrendInsight(points: TemperaturePoint[]) {
  const values = points.map((point) => point.temp).filter((value): value is number => typeof value === "number")
  if (values.length < 2) return "Temperature baseline still building"

  const first = values[0]
  const last = values[values.length - 1]
  const delta = last - first

  if (delta <= -2.5) return "Cooling trend across the week"
  if (delta >= 2.5) return "Warming trend across the week"
  return "Stable temperatures through the week"
}

function TemperatureTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as TemperaturePoint
  const value = typeof payload[0]?.value === "number" ? payload[0].value : null

  return (
    <div className="rounded-lg border border-white/40 bg-white/92 px-3 py-2 text-xs text-gray-700 shadow-lg backdrop-blur-md transition-all duration-200 ease-out animate-in fade-in zoom-in-95 dark:border-white/10 dark:bg-[#020617]/92 dark:text-gray-200">
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{point.day}</p>
      <p className="font-semibold text-blue-600 dark:text-blue-300">
        {point.day}: Temperature {value !== null ? `${value} C` : "--"}
      </p>
    </div>
  )
}

type TemperatureTrendChartProps = {
  initialCity?: string
}

export function TemperatureTrendChart({ initialCity }: TemperatureTrendChartProps) {
  const searchParams = useSearchParams()
  const cityQuery = initialCity ?? searchParams.get("city") ?? "New Delhi, IN"
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [data, setData] = useState<TemperaturePoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadTrend() {
      setIsLoading(true)
      try {
        const weatherData = await fetchWeatherData(cityQuery)
        const currentTemp = typeof weatherData?.temp === "number" ? weatherData.temp : null
        const apiHistoryRaw = Array.isArray(weatherData?.history) ? (weatherData.history as ApiHistoryPoint[]) : []
        const apiHistoryByDay = buildApiHistoryByDay(apiHistoryRaw)

        const store = readTempStore()
        const todayKey = getDateKey()
        if (currentTemp !== null) {
          store[todayKey] = currentTemp
        }

        const baseSeries = buildLastSevenDaysTemp(currentTemp, store)
        const chartData = mergeHistoryIntoSeries(baseSeries, apiHistoryByDay)

        for (const point of chartData) {
          if (typeof point.temp !== "number") continue
          const date = new Date(point.day)
          if (Number.isNaN(date.getTime())) continue
          store[getDateKey(date)] = point.temp
        }
        writeTempStore(store)

        if (isMounted) {
          setData(chartData)
        }
      } catch {
        const store = readTempStore()
        const chartData = buildLastSevenDaysTemp(null, store)
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
  const trendInsight = useMemo(() => getTempTrendInsight(chartData), [chartData])

  const yTicks = useMemo(() => {
    const values = chartData.map((point) => point.temp).filter((value): value is number => typeof value === "number")
    if (!values.length) return [20, 25, 30]

    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const low = Math.floor((minValue - 2) / 1) * 1
    const high = Math.ceil((maxValue + 2) / 1) * 1
    const mid = Number(((low + high) / 2).toFixed(1))
    return [low, mid, high]
  }, [chartData])

  if (isLoading) {
    return <ChartSkeleton className="p-4" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.5 }}
      whileHover={{ y: -2 }}
      className="glass-card border border-white/40 p-4 shadow-[0_12px_28px_rgba(59,130,246,0.12)] transition-all duration-200"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-blue-200/20 to-transparent dark:from-blue-500/10" />

      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Temperature Trend</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Last 7 days</p>
          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-200">
            {trendInsight}
          </p>
        </div>
        <button className="rounded-md bg-white/65 px-2.5 py-1 text-sm font-medium text-gray-700 opacity-80 shadow-sm transition-all duration-200 hover:opacity-100 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15">
          View More
        </button>
      </div>

      <div className="h-45 w-full md:h-50 lg:h-55">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="tempStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="tempStrokeDark" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
              <linearGradient id="tempFillDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.34} />
                <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.06} />
              </linearGradient>
              <filter id="tempLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke={isDark ? "#e2e8f0" : "#334155"}
              strokeOpacity={0.1}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              ticks={yTicks}
              tickFormatter={(value) => `${value}`}
              domain={["dataMin - 2", "dataMax + 2"]}
              tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={28}
              tickMargin={8}
            />
            <Tooltip
              cursor={{ stroke: isDark ? "rgba(147,197,253,0.35)" : "rgba(59,130,246,0.25)", strokeWidth: 1 }}
              content={<TemperatureTooltip />}
              offset={8}
              allowEscapeViewBox={{ x: false, y: false }}
              wrapperStyle={{ pointerEvents: "none", zIndex: 20 }}
            />
            <Area
              type="monotone"
              dataKey="temp"
              stroke={isDark ? "url(#tempStrokeDark)" : "url(#tempStroke)"}
              strokeWidth={3}
              fill={isDark ? "url(#tempFillDark)" : "url(#tempFill)"}
              isAnimationActive={true}
              animationDuration={900}
              connectNulls
              filter="url(#tempLineGlow)"
              dot={{ r: 6, fill: isDark ? "#bfdbfe" : "#2563eb", stroke: "#ffffff", strokeWidth: 1.5 }}
              activeDot={{ r: 8, fill: isDark ? "#93c5fd" : "#2563eb", stroke: "#ffffff", strokeWidth: 2, filter: "url(#tempLineGlow)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
