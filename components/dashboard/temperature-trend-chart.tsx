"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useTheme } from "next-themes"
import { useSearchParams } from "next/navigation"
import { fetchWeatherData } from "@/api/api"
import { ChartSkeleton } from "@/components/dashboard/loading-states"

type TemperatureTrendPoint = {
  day: string
  temp: number
}

type ApiHistoryPoint = {
  day?: string
  date?: string
  temp?: number | null
}

function TempTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/40 bg-white/90 px-3 py-2 text-xs text-gray-700 backdrop-blur-md shadow-md dark:border-white/10 dark:bg-[#020617]/90 dark:text-gray-200">
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{payload[0].payload.day}</p>
      <p className="font-semibold text-blue-500 dark:text-blue-300">{payload[0].value}°C</p>
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
  const strokeGradient = isDark ? "url(#tempStrokeDark)" : "url(#tempStrokeLight)"
  const fillGradient = isDark ? "url(#tempFillDark)" : "url(#tempFillLight)"
  const [data, setData] = useState<TemperatureTrendPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadTrend() {
      setIsLoading(true)
      try {
        const weatherData = await fetchWeatherData(cityQuery)
        const history = Array.isArray(weatherData?.history) ? weatherData.history as ApiHistoryPoint[] : []
        const mapped = history
          .map((item) => ({
            day: item?.date ?? item?.day ?? "",
            temp: typeof item?.temp === "number" ? Math.round(item.temp) : null,
          }))
          .filter((item): item is TemperatureTrendPoint => Boolean(item.day) && typeof item.temp === "number")
          .slice(-7)

        if (isMounted && mapped.length > 0) {
          setData(mapped)
        } else if (isMounted) {
          setData([])
        }
      } catch {
        if (isMounted) {
          setData([])
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

  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.45 }}
        className="glass-card glow-blue p-4 sm:p-5 md:p-6"
      >
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Temperature data unavailable</p>
          <p className="mt-1 text-xs">--</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.45 }}
      whileHover={{ y: -2 }}
      className="glass-card glow-blue p-4 sm:p-5 md:p-6 transition-all duration-300 ease-in-out"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-blue-200/20 to-transparent dark:from-blue-500/10" />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Temperature Trend</h3>
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
              <linearGradient id="tempStrokeLight" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="tempFillLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="tempStrokeDark" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="tempFillDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb"} />
            <XAxis dataKey="day" tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<TempTooltip />} />
            <Area
              type="monotone"
              dataKey="temp"
              stroke={strokeGradient}
              strokeWidth={3}
              fill={fillGradient}
              isAnimationActive={true}
              animationDuration={900}
              dot={{ fill: "#ffffff", stroke: isDark ? "#a855f7" : "#60a5fa", strokeWidth: 1.5, r: 3.5 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
