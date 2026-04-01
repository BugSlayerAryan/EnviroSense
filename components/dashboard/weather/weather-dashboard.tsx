"use client"

import { type ComponentType, useState } from "react"
import { motion } from "framer-motion"
import {
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  Eye,
  Gauge,
  MapPin,
  MoonStar,
  Sun,
  Sunrise,
  Sunset,
  ThermometerSun,
  Wind,
} from "lucide-react"
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { WeeklyForecast } from "@/components/dashboard/weather/weekly-forecast"
import type { WeeklyForecastDay } from "@/components/dashboard/weather/utils"

type HourlyForecast = {
  time: string
  temp: number
  icon: "sunny" | "cloudy" | "rain"
  rainChance: number
}

type WeatherDetail = {
  label: string
  value: string
  icon: ComponentType<{ className?: string }>
  tone: "blue" | "green" | "amber" | "violet"
}

const hourlyForecast: HourlyForecast[] = [
  { time: "Now", temp: 29, icon: "sunny", rainChance: 12 },
  { time: "10 AM", temp: 31, icon: "sunny", rainChance: 8 },
  { time: "11 AM", temp: 32, icon: "sunny", rainChance: 7 },
  { time: "12 PM", temp: 33, icon: "cloudy", rainChance: 14 },
  { time: "1 PM", temp: 34, icon: "cloudy", rainChance: 21 },
  { time: "2 PM", temp: 34, icon: "rain", rainChance: 35 },
  { time: "3 PM", temp: 33, icon: "rain", rainChance: 48 },
  { time: "4 PM", temp: 32, icon: "cloudy", rainChance: 28 },
]

const dailyForecast: WeeklyForecastDay[] = [
  { day: "Mon", icon: "partly", max: 36, min: 25, rain: 10, current: 29 },
  { day: "Tue", icon: "rain", max: 34, min: 24, rain: 60 },
  { day: "Wed", icon: "cloud", max: 32, min: 23, rain: 35 },
  { day: "Thu", icon: "sun", max: 35, min: 25, rain: 12 },
  { day: "Fri", icon: "partly", max: 33, min: 24, rain: 18 },
  { day: "Sat", icon: "rain", max: 30, min: 23, rain: 70 },
  { day: "Sun", icon: "cloud", max: 31, min: 24, rain: 28 },
]

const precipitationSeries = [
  { hour: "06", intensity: 4, probability: 18 },
  { hour: "09", intensity: 8, probability: 24 },
  { hour: "12", intensity: 14, probability: 36 },
  { hour: "15", intensity: 22, probability: 55 },
  { hour: "18", intensity: 16, probability: 42 },
  { hour: "21", intensity: 9, probability: 28 },
]

const weatherDetails: WeatherDetail[] = [
  { label: "Humidity", value: "58%", icon: Droplets, tone: "blue" },
  { label: "Wind Speed", value: "12 km/h", icon: Wind, tone: "blue" },
  { label: "Pressure", value: "1008 hPa", icon: Gauge, tone: "violet" },
  { label: "UV Index", value: "8 (High)", icon: Sun, tone: "amber" },
  { label: "Visibility", value: "5.4 km", icon: Eye, tone: "green" },
  { label: "Dew Point", value: "20 deg C", icon: ThermometerSun, tone: "amber" },
]

const conditionSnapshot = [
  { label: "Humidity", value: "58%", icon: Droplets, color: "text-sky-600 dark:text-sky-300" },
  { label: "Wind", value: "12 km/h", icon: Wind, color: "text-cyan-600 dark:text-cyan-300" },
  { label: "Rain", value: "24%", icon: CloudRain, color: "text-blue-600 dark:text-blue-300" },
  { label: "UV", value: "8 High", icon: Sun, color: "text-amber-600 dark:text-amber-300" },
]

function getConditionIcon(icon: HourlyForecast["icon"]) {
  if (icon === "rain") return <CloudRain className="h-5 w-5 text-blue-500" />
  if (icon === "cloudy") return <Cloud className="h-5 w-5 text-slate-500" />
  return <CloudSun className="h-5 w-5 text-amber-500" />
}

function getDetailToneClasses(tone: WeatherDetail["tone"]) {
  if (tone === "amber") return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
  if (tone === "green") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
  if (tone === "violet") return "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
  return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const intensity = payload.find((item) => item.name === "intensity")?.value ?? payload[0]?.value
  const probability = payload.find((item) => item.name === "probability")?.value ?? payload[1]?.value

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 text-xs text-slate-700 shadow-lg backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200">
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}:00</p>
      <p className="mt-1 font-semibold">Intensity: {intensity}%</p>
      {probability !== undefined ? <p className="text-[11px] text-sky-700 dark:text-sky-300">Probability: {probability}%</p> : null}
    </div>
  )
}

function LoadingCard() {
  return <div className="h-24 animate-pulse rounded-2xl bg-white/50 dark:bg-white/10" />
}

export function WeatherDashboard() {
  const [location] = useState("New Delhi, India")
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleRefresh = async () => {
    setHasError(false)
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    setIsLoading(false)
  }

  return (
    <section className="dashboard-scroll flex-1 overflow-y-auto px-3 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
      {hasError ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <p className="font-semibold">Unable to fetch weather feed.</p>
          <button
            type="button"
            onClick={() => setHasError(false)}
            className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04, duration: 0.35 }}
        className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_20px_60px_rgba(14,116,144,0.12)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/60 sm:p-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(14,165,233,0.16),transparent_42%),radial-gradient(circle_at_82%_16%,rgba(56,189,248,0.12),transparent_34%),linear-gradient(160deg,rgba(255,255,255,0.64),rgba(248,250,252,0.72))] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(14,165,233,0.24),transparent_42%),radial-gradient(circle_at_82%_16%,rgba(56,189,248,0.18),transparent_34%),linear-gradient(160deg,rgba(15,23,42,0.86),rgba(30,41,59,0.8))]" />
        <div className="relative z-10 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
              <span className="bg-linear-to-r from-[#60a5fa] via-[#34d399] to-[#60a5fa] bg-clip-text text-transparent">EnviroSense</span>
              <span className="ml-1.5 sm:ml-2">Weather Dashboard</span>
            </h1>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300 sm:text-sm">
              Real-time weather intelligence with forecasts and environmental context
            </p>

            <div className="mb-3 mt-4 inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50/95 px-3 py-1.5 text-[11px] font-bold text-sky-700 shadow-sm dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300 sm:gap-2 sm:text-xs">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </div>

            <h2 className="text-5xl font-black leading-none text-slate-900 dark:text-slate-50 sm:text-6xl">29 C</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300 sm:text-base">Feels like 32 deg C</p>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300">
              <CloudSun className="h-4 w-4" />
              Hazy Sunshine
            </div>

            <p className="mt-3 max-w-xl text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
              Warm and slightly hazy conditions throughout the afternoon. Carry hydration and avoid prolonged exposure in direct sunlight.
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 sm:w-auto"
            >
              {isLoading ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/90 backdrop-blur-xl dark:border-slate-600/70 dark:bg-slate-800/85 dark:ring-slate-600/60 sm:p-6">
            <p className="mb-4 text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">Condition Snapshot</p>
            <div className="grid grid-cols-2 gap-3">
              {conditionSnapshot.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 dark:border-slate-600 dark:bg-slate-900/90"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">{item.label}</p>
                      <Icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{item.value}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mb-6 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_16px_46px_rgba(15,23,42,0.08)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/65 dark:ring-slate-700/50 sm:p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">Hourly Forecast</h3>
          <p className="inline-flex w-fit items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300">Next 24 hours</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {Array.from({ length: 8 }).map((_, idx) => (
              <LoadingCard key={`hourly-skeleton-${idx}`} />
            ))}
          </div>
        ) : (
          <div className="dashboard-scroll flex gap-3 overflow-x-auto pb-1">
            {hourlyForecast.map((item, index) => (
              <motion.article
                key={item.time}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.04 * index }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="relative min-w-32 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.08)] ring-1 ring-white dark:border-slate-700 dark:bg-slate-800/90 dark:ring-slate-700/40"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-sky-100/70 blur-2xl dark:bg-sky-500/20" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">{item.time}</p>
                <div className="mt-2 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-600 dark:bg-slate-700/50">{getConditionIcon(item.icon)}</div>
                <p className="mt-2 text-xl font-bold leading-none text-slate-900 dark:text-slate-50">{item.temp} deg</p>
                <p className="mt-1 text-[11px] font-medium text-sky-700 dark:text-sky-300">Rain {item.rainChance}%</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.rainChance}%` }}
                    transition={{ duration: 0.6, delay: 0.05 * index }}
                    className="h-full rounded-full bg-linear-to-r from-sky-500 to-blue-600"
                  />
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      <WeeklyForecast
        data={dailyForecast}
        loading={isLoading}
        error={hasError ? "Unable to load weekly forecast." : null}
        onRetry={handleRefresh}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -2 }}
          className="rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_48px_rgba(14,116,144,0.12)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/50"
        >
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">Weather Details</h3>
              <p className="text-xs text-slate-500 dark:text-slate-300">Core atmospheric metrics at a glance</p>
            </div>
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-300">
              Live
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {weatherDetails.map((detail) => {
              const Icon = detail.icon
              return (
                <div
                  key={detail.label}
                  className="flex h-full min-h-28 flex-col justify-between rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.1)] dark:border-slate-700 dark:bg-slate-800/85"
                >
                  <div className={`mb-2 inline-flex w-fit rounded-lg p-2 ${getDetailToneClasses(detail.tone)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{detail.label}</p>
                    <p className="mt-1 text-base font-bold text-slate-900 dark:text-slate-50">{detail.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06 }}
          whileHover={{ y: -2 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_48px_rgba(14,116,144,0.12)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/50"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_14%,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_5%_80%,rgba(14,165,233,0.09),transparent_38%)] dark:bg-[radial-gradient(circle_at_85%_14%,rgba(56,189,248,0.22),transparent_34%),radial-gradient(circle_at_5%_80%,rgba(14,165,233,0.16),transparent_38%)]" />

          <div className="relative z-10 mb-4 flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">Precipitation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-300">Rain probability and intensity</p>
            </div>
            <div className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300">
              42% chance
            </div>
          </div>

          <div className="relative z-10 mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-200 bg-white/90 p-2.5 dark:border-slate-700 dark:bg-slate-800/80">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Peak Hour</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">03:00 PM</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/90 p-2.5 dark:border-slate-700 dark:bg-slate-800/80">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Max Chance</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">55%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/90 p-2.5 dark:border-slate-700 dark:bg-slate-800/80">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Intensity</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Moderate</p>
            </div>
          </div>

          <div className="relative z-10 h-52 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-inner dark:border-slate-700 dark:bg-slate-800/65">
            <div className="mb-2 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-300">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-4 rounded-full bg-blue-500" />
                Intensity
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-4 rounded-full bg-sky-300" />
                Probability
              </span>
            </div>
            <ResponsiveContainer width="100%" height="88%">
              <LineChart data={precipitationSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
                <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="probability" fill="#7dd3fc" fillOpacity={0.24} stroke="none" />
                <Line type="monotone" dataKey="intensity" stroke="#2563eb" strokeWidth={3} dot={{ r: 2.5 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.article>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        whileHover={{ y: -2 }}
        className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_48px_rgba(14,116,144,0.12)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/50"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(251,191,36,0.15),transparent_34%),radial-gradient(circle_at_86%_22%,rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_70%_86%,rgba(139,92,246,0.14),transparent_34%)] dark:bg-[radial-gradient(circle_at_12%_18%,rgba(251,191,36,0.18),transparent_34%),radial-gradient(circle_at_86%_22%,rgba(56,189,248,0.2),transparent_30%),radial-gradient(circle_at_70%_86%,rgba(139,92,246,0.2),transparent_34%)]" />

        <div className="relative z-10 mb-4 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">Sun & Moon</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300">Daily solar cycle and current lunar phase</p>
          </div>
          <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:border-violet-500/35 dark:bg-violet-500/15 dark:text-violet-300">
            Astronomical
          </span>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-3 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0.8, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-800/85"
          >
            <div className="mb-2 flex items-center justify-between">
              <Sunrise className="h-5 w-5 text-amber-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Sun</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Sunrise</p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-50">06:02 AM</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "42%" }}
                transition={{ duration: 0.7 }}
                className="h-full rounded-full bg-linear-to-r from-amber-400 to-orange-500"
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Golden hour starts soon after</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-800/85"
          >
            <div className="mb-2 flex items-center justify-between">
              <Sunset className="h-5 w-5 text-orange-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Sun</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Sunset</p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-50">06:48 PM</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "74%" }}
                transition={{ duration: 0.7, delay: 0.05 }}
                className="h-full rounded-full bg-linear-to-r from-orange-400 to-rose-500"
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Approx daylight: 12h 46m</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-800/85"
          >
            <div className="mb-2 flex items-center justify-between">
              <MoonStar className="h-5 w-5 text-violet-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Moon</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Moon Phase</p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-50">Waxing Crescent</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "36%" }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="h-full rounded-full bg-linear-to-r from-violet-400 to-indigo-500"
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Visible in early night sky</p>
          </motion.div>
        </div>
      </motion.article>

      <motion.article
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -2 }}
        className="rounded-2xl border border-white/40 bg-white/60 p-4 shadow-[0_8px_32px_rgba(31,38,135,0.15)] ring-1 ring-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_0_40px_rgba(0,0,0,0.5)]"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">Radar Map (Integration Ready)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Placeholder for weather radar or precipitation layers</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">Map Ready</span>
        </div>

        <div className="h-64 overflow-hidden rounded-xl border border-white/30 bg-white/40 sm:h-72 dark:border-white/10 dark:bg-white/5">
          <iframe
            title="New Delhi weather map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=77.145%2C28.545%2C77.275%2C28.675&layer=mapnik&marker=28.6139%2C77.2090"
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </motion.article>
    </section>
  )
}