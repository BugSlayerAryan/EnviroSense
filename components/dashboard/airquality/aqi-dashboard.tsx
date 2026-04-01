"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Droplets,
  HeartPulse,
  MapPin,
  Sun,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Wind,
  ShieldCheck,
  Navigation,
  Factory,
  Car,
  Leaf,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type Pollutant = {
  key: string
  label: string
  value: number
  unit: string
  trend: "up" | "down"
  delta: string
  tone: "green" | "yellow" | "orange" | "red" | "blue"
  icon: React.ComponentType<{ className?: string }>
}

const pollutants: Pollutant[] = [
  { key: "pm25", label: "PM2.5", value: 85, unit: "ug/m3", trend: "up", delta: "+8%", tone: "red", icon: Factory },
  { key: "pm10", label: "PM10", value: 120, unit: "ug/m3", trend: "up", delta: "+6%", tone: "orange", icon: Car },
  { key: "co", label: "CO", value: 2.4, unit: "ppm", trend: "down", delta: "-3%", tone: "yellow", icon: Wind },
  { key: "no2", label: "NO2", value: 46, unit: "ppb", trend: "up", delta: "+2%", tone: "orange", icon: Navigation },
  { key: "so2", label: "SO2", value: 18, unit: "ppb", trend: "down", delta: "-4%", tone: "green", icon: Leaf },
  { key: "o3", label: "O3", value: 62, unit: "ppb", trend: "up", delta: "+5%", tone: "yellow", icon: Sun },
]

const hourlyAqi = [
  { time: "06:00", aqi: 82 },
  { time: "08:00", aqi: 91 },
  { time: "10:00", aqi: 102 },
  { time: "12:00", aqi: 121 },
  { time: "14:00", aqi: 132 },
  { time: "16:00", aqi: 148 },
  { time: "18:00", aqi: 141 },
  { time: "20:00", aqi: 136 },
]

const weeklyAqi = [
  { day: "Mon", aqi: 98 },
  { day: "Tue", aqi: 112 },
  { day: "Wed", aqi: 126 },
  { day: "Thu", aqi: 138 },
  { day: "Fri", aqi: 129 },
  { day: "Sat", aqi: 116 },
  { day: "Sun", aqi: 109 },
]

function getToneClasses(tone: Pollutant["tone"]) {
  switch (tone) {
    case "green":
      return "from-emerald-100/70 to-green-100/50 text-emerald-700 dark:from-emerald-500/20 dark:to-green-500/10 dark:text-emerald-300"
    case "yellow":
      return "from-yellow-100/70 to-amber-100/50 text-amber-700 dark:from-yellow-500/20 dark:to-amber-500/10 dark:text-yellow-300"
    case "orange":
      return "from-orange-100/70 to-amber-100/50 text-orange-700 dark:from-orange-500/20 dark:to-amber-500/10 dark:text-orange-300"
    case "red":
      return "from-red-100/70 to-orange-100/50 text-red-700 dark:from-red-500/20 dark:to-orange-500/10 dark:text-red-300"
    default:
      return "from-blue-100/70 to-cyan-100/50 text-blue-700 dark:from-blue-500/20 dark:to-cyan-500/10 dark:text-blue-300"
  }
}

function getToneBarClasses(tone: Pollutant["tone"]) {
  switch (tone) {
    case "green":
      return "from-emerald-400 to-green-500"
    case "yellow":
      return "from-yellow-400 to-amber-500"
    case "orange":
      return "from-orange-400 to-amber-500"
    case "red":
      return "from-red-400 to-orange-500"
    default:
      return "from-blue-400 to-cyan-500"
  }
}

function getAqiPointerClasses(aqi: number) {
  const percent = Math.min(Math.max((aqi / 500) * 100, 0), 100)
  const bucket = Math.round(percent / 5) * 5

  switch (bucket) {
    case 0:
      return "left-[0%]"
    case 5:
      return "left-[5%]"
    case 10:
      return "left-[10%]"
    case 15:
      return "left-[15%]"
    case 20:
      return "left-[20%]"
    case 25:
      return "left-[25%]"
    case 30:
      return "left-[30%]"
    case 35:
      return "left-[35%]"
    case 40:
      return "left-[40%]"
    case 45:
      return "left-[45%]"
    case 50:
      return "left-[50%]"
    case 55:
      return "left-[55%]"
    case 60:
      return "left-[60%]"
    case 65:
      return "left-[65%]"
    case 70:
      return "left-[70%]"
    case 75:
      return "left-[75%]"
    case 80:
      return "left-[80%]"
    case 85:
      return "left-[85%]"
    case 90:
      return "left-[90%]"
    case 95:
      return "left-[95%]"
    default:
      return "left-[100%]"
  }
}

function getAqiPointerGlow(aqi: number) {
  if (aqi <= 50) return "from-emerald-500 via-green-400 to-emerald-600"
  if (aqi <= 100) return "from-yellow-500 via-amber-400 to-yellow-600"
  if (aqi <= 150) return "from-orange-500 via-amber-400 to-orange-600"
  if (aqi <= 200) return "from-red-500 via-rose-400 to-red-600"
  return "from-violet-500 via-fuchsia-400 to-violet-600"
}

function getAqiPointerLabel(aqi: number) {
  if (aqi <= 50) return "Good"
  if (aqi <= 100) return "Moderate"
  if (aqi <= 150) return "Unhealthy"
  if (aqi <= 200) return "Very Unhealthy"
  return "Hazardous"
}

function getBarWidthClass(value: number) {
  if (value >= 140) return "w-full"
  if (value >= 110) return "w-5/6"
  if (value >= 80) return "w-2/3"
  if (value >= 50) return "w-1/2"
  if (value >= 25) return "w-1/3"
  return "w-1/4"
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-white/40 bg-white/80 px-3 py-2 text-xs text-gray-700 backdrop-blur-md shadow-sm dark:border-white/10 dark:bg-[#020617]/90 dark:text-gray-200">
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-semibold text-gray-800 dark:text-white">AQI: {payload[0].value}</p>
    </div>
  )
}

function SkeletonCard() {
  return <div className="h-24 animate-pulse rounded-2xl bg-white/50 dark:bg-white/10" />
}

export function AirQualityDashboard() {
  const city = "New Delhi, India"
  const [isLoading, setIsLoading] = useState(false)
  const [showError, setShowError] = useState(false)

  const currentAqi = 132
  const aqiCategory = "Unhealthy"
  const aqiPointerClass = getAqiPointerClasses(currentAqi)
  const aqiPointerGlow = getAqiPointerGlow(currentAqi)
  const aqiPointerLabel = getAqiPointerLabel(currentAqi)

  const handleRefresh = async () => {
    setShowError(false)
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    setIsLoading(false)
  }

  return (
    <section className="dashboard-scroll flex-1 overflow-y-auto px-3 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
      {showError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <p className="font-semibold">Unable to fetch latest AQI data.</p>
          <button
            type="button"
            onClick={() => setShowError(false)}
            className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="mb-5 rounded-2xl border border-white/40 bg-white/60 p-4 shadow-[0_8px_32px_rgba(31,38,135,0.15)] ring-1 ring-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:mb-6 sm:p-6"
      >
        <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-green-100/40 via-blue-100/40 to-yellow-100/40 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20" />
        <div className="relative z-10 mb-5">
          <h1 className="text-xl font-extrabold tracking-tight text-gray-800 dark:text-white sm:text-3xl">
            <span className="inline-block bg-linear-to-r from-[#60a5fa] via-[#34d399] to-[#60a5fa] bg-clip-text text-transparent">EnviroSense</span>
            <span className="ml-1 inline-block text-gray-800 dark:text-white sm:ml-2">AQI Dashboard</span>
          </h1>
          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
            Live air quality analytics and environmental recommendations
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/95 px-3 py-1.5 text-[11px] font-bold text-blue-700 shadow-sm dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300 sm:gap-2 sm:px-3.5 sm:text-xs"
            >
              <MapPin className="h-3.5 w-3.5" />
              {city}
            </motion.div>
            <h2 className="text-3xl font-bold text-green-600 dark:text-white sm:text-5xl">{currentAqi}</h2>
            <p className="mt-1 inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600 dark:bg-orange-500/20 dark:text-orange-300">
              {aqiCategory}
            </p>
            <p className="mt-3 max-w-xl text-xs text-gray-600 dark:text-gray-300 sm:text-sm">
              Sensitive groups should reduce prolonged outdoor exertion. Wear protective masks and prefer indoor activities in high traffic hours.
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-4 w-full rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:bg-white/80 dark:bg-white/10 dark:text-white sm:w-auto"
            >
              {isLoading ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>

          <div className="rounded-2xl border border-white/40 bg-white/60 p-3 ring-1 ring-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 sm:p-4">
            <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">AQI Indicator</p>
            <div className="relative h-4 w-full overflow-visible rounded-full bg-slate-200/80 dark:bg-slate-700/80" aria-label="AQI color scale">
              <div className="h-full w-full rounded-full bg-[linear-gradient(90deg,#22c55e_0%,#facc15_28%,#f97316_52%,#ef4444_74%,#a855f7_100%)]" />
              <div className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 ${aqiPointerClass}`}>
                <div className="relative flex flex-col items-center">
                  <span className={`pointer-events-none mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-white/85 bg-white/96 px-3 py-1 text-[10px] font-semibold text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-slate-900/96 dark:text-slate-100`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full bg-linear-to-br ${aqiPointerGlow} shadow-[0_0_0_3px_rgba(255,255,255,0.55)]`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                    </span>
                    <span>AQI {currentAqi}</span>
                    <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${aqiCategory === "Unhealthy" ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-300"}`}>
                      {aqiPointerLabel}
                    </span>
                  </span>

                  <span className={`absolute inset-0 -z-10 h-8 w-8 rounded-full bg-linear-to-br ${aqiPointerGlow} blur-sm`} />
                  <span className={`absolute inset-0 -z-10 h-8 w-8 animate-ping rounded-full bg-linear-to-br ${aqiPointerGlow} opacity-25`} />

                  <span className={`relative flex h-5 w-5 items-center justify-center rounded-full bg-linear-to-br ${aqiPointerGlow} shadow-[0_0_0_4px_rgba(255,255,255,0.65)] ring-2 ring-white dark:ring-slate-900`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                  </span>

                  <span className={`mt-1 h-4 w-0.5 rounded-full bg-linear-to-b ${aqiPointerGlow} opacity-80`} />
                  <span className={`mt-0.5 h-3.5 w-3.5 rotate-45 rounded-[3px] bg-linear-to-br ${aqiPointerGlow} shadow-[0_6px_18px_rgba(15,23,42,0.18)]`} />
                </div>
              </div>
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
              <span>Good</span>
              <span>Moderate</span>
              <span>High</span>
              <span>Unhealthy</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mb-6">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Pollutant Breakdown</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Real-time concentration metrics</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={`pollutant-skeleton-${idx}`} />)
          : pollutants.map((item, index) => {
              const Icon = item.icon
              const TrendIcon = item.trend === "up" ? TrendingUp : TrendingDown

              return (
                <motion.article
                  key={item.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.04 * index }}
                  whileHover={{ y: -3 }}
                  className="rounded-2xl border border-white/40 bg-white/60 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.15)] ring-1 ring-white/30 backdrop-blur-xl transition-all duration-300 ease-in-out dark:border-white/10 dark:bg-white/10 dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:p-4"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`rounded-xl bg-linear-to-r p-2 shadow-sm ${getToneClasses(item.tone)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                        item.trend === "up"
                          ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300"
                          : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
                      }`}
                    >
                      <TrendIcon className="h-3.5 w-3.5" />
                      {item.delta}
                    </div>
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{item.label}</p>
                  <div className="mt-1 flex items-end gap-1.5">
                    <p className="text-2xl font-bold leading-none text-gray-800 dark:text-white sm:text-3xl">{item.value}</p>
                    <p className="pb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{item.unit}</p>
                  </div>

                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/60 dark:bg-white/10">
                    <div className={`h-full rounded-full bg-linear-to-r ${getToneBarClasses(item.tone)} ${getBarWidthClass(item.value)}`} />
                  </div>
                </motion.article>
              )
            })}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-white/40 bg-white/60 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.15)] ring-1 ring-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:p-4"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">AQI Trend (Hourly)</h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Fine-grained variation for today</p>
            </div>
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:bg-white/10 dark:text-emerald-300">
              Live
            </span>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-1.5 text-xs sm:gap-2">
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Peak</p>
              <p className="font-bold text-gray-800 dark:text-white">148</p>
            </div>
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Lowest</p>
              <p className="font-bold text-gray-800 dark:text-white">82</p>
            </div>
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Avg</p>
              <p className="font-bold text-gray-800 dark:text-white">119</p>
            </div>
          </div>

          <div className="h-48 w-full rounded-xl border border-white/30 bg-white/40 p-2 sm:h-56 dark:border-white/10 dark:bg-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyAqi}>
                <defs>
                  <linearGradient id="hourlyStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="50%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#f87171" />
                  </linearGradient>
                  <linearGradient id="hourlyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="time" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="aqi"
                  stroke="url(#hourlyStroke)"
                  strokeWidth={3}
                  fill="url(#hourlyFill)"
                  dot={{ fill: "#fff", stroke: "#f87171", strokeWidth: 1.5, r: 3 }}
                  activeDot={{ r: 5 }}
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-white/40 bg-white/60 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.15)] ring-1 ring-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:p-4"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">AQI Trend (Weekly)</h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">7-day city-level trend</p>
            </div>
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:bg-white/10 dark:text-blue-300">
              7 Days
            </span>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-1.5 text-xs sm:gap-2">
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Highest</p>
              <p className="font-bold text-gray-800 dark:text-white">138</p>
            </div>
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Lowest</p>
              <p className="font-bold text-gray-800 dark:text-white">98</p>
            </div>
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Weekly Avg</p>
              <p className="font-bold text-gray-800 dark:text-white">118</p>
            </div>
          </div>

          <div className="h-48 w-full rounded-xl border border-white/30 bg-white/40 p-2 sm:h-56 dark:border-white/10 dark:bg-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAqi}>
                <defs>
                  <linearGradient id="weeklyBars" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="aqi" radius={[8, 8, 0, 0]} fill="url(#weeklyBars)" animationDuration={850} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.article>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-white/40 bg-white/60 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.15)] ring-1 ring-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:p-4"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">Weather</h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Local atmospheric conditions</p>
            </div>
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
              Updated 5m ago
            </span>
          </div>

          <div className="mb-3 rounded-xl border border-white/30 bg-linear-to-r from-blue-100/45 to-cyan-100/45 p-3 dark:border-white/10 dark:from-blue-500/15 dark:to-cyan-500/10 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Temp</p>
                <p className="mt-1 text-3xl font-bold leading-none text-gray-800 dark:text-white sm:text-4xl">29<span className="ml-1 text-base align-top sm:text-lg">deg C</span></p>
                <p className="mt-2 inline-flex rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300">Hazy</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-white/10">
                <Sun className="h-7 w-7 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/70 p-3 dark:bg-white/10">
              <div className="mb-2 inline-flex rounded-lg bg-blue-100 p-2 dark:bg-blue-500/20">
                <Droplets className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Humidity</p>
              <p className="mt-1 text-base font-bold text-gray-800 dark:text-white">58%</p>
            </div>
            <div className="rounded-xl bg-white/70 p-3 dark:bg-white/10">
              <div className="mb-2 inline-flex rounded-lg bg-cyan-100 p-2 dark:bg-cyan-500/20">
                <Wind className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Wind</p>
              <p className="mt-1 text-base font-bold text-gray-800 dark:text-white">12 km/h</p>
            </div>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-white/40 bg-white/60 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.15)] ring-1 ring-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">Map Overview</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">AQI map for New Delhi, India</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              Live Map
            </span>
          </div>

          <div className="-mx-3 -mb-3 h-56 overflow-hidden rounded-b-2xl border-t border-white/30 bg-white/40 sm:-mx-4 sm:-mb-4 sm:h-72 dark:border-white/10 dark:bg-white/5">
            <iframe
              title="New Delhi AQI map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=77.145%2C28.545%2C77.275%2C28.675&layer=mapnik&marker=28.6139%2C77.2090"
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </motion.article>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-white/40 bg-white/60 p-4 shadow-[0_8px_32px_rgba(31,38,135,0.15)] ring-1 ring-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:p-5"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-white">
                <HeartPulse className="h-4 w-4 text-red-500" />
                Health Recommendations
              </h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Personalized guidance for current AQI conditions</p>
            </div>
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:bg-red-500/20 dark:text-red-300">Priority</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/30 bg-white/70 p-3 dark:border-white/10 dark:bg-white/10">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Protection</p>
              <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white">Wear an N95 mask</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Especially near traffic corridors and crowded streets.</p>
            </div>

            <div className="rounded-xl border border-white/30 bg-white/70 p-3 dark:border-white/10 dark:bg-white/10">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Activity</p>
              <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white">Limit outdoor workouts</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Choose early morning or indoor sessions.</p>
            </div>

            <div className="rounded-xl border border-white/30 bg-white/70 p-3 dark:border-white/10 dark:bg-white/10">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Indoor Air</p>
              <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white">Run air purifier</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Keep windows closed during peak AQI hours.</p>
            </div>
          </div>
        </motion.article>
      </div>
    </section>
  )
}
