"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  CircleDot,
  Droplets,
  HeartPulse,
  MapPin,
  Minus,
  Sun,
  ThermometerSun,
  TrendingDown,
  TrendingUp,
  Wind,
  ShieldCheck,
  Navigation,
  Factory,
  Car,
  Clock3,
  Leaf,
  Sparkles,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { fetchAqiData, fetchUvData, fetchWeatherData } from "@/api/api"
import { useSearchParams } from "next/navigation"
import { AqiDashboardSkeleton } from "@/components/dashboard/loading-states"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import type { CityMarker } from "@/components/dashboard/maps/types"

const MapView = dynamic(
  () => import("@/components/dashboard/maps/map-view").then((module) => module.MapView),
  { ssr: false },
)

type Pollutant = {
  key: PollutantKey
  label: string
  value: number | null
  unit: string
  trend: "up" | "down" | "flat"
  delta: string
  tone: "green" | "yellow" | "orange" | "red" | "blue"
  icon: React.ComponentType<{ className?: string }>
}

type PollutantKey = "pm25" | "pm10" | "co" | "no2" | "so2" | "o3"

type PollutantMeta = {
  key: PollutantKey
  label: string
  unit: string
  tone: "green" | "yellow" | "orange" | "red" | "blue"
  icon: React.ComponentType<{ className?: string }>
}

type PollutantValues = Partial<Record<PollutantKey, number>>

type TrendPoint = {
  day: string
  aqi: number | null
}

type ApiTrendPoint = {
  day?: string
  date?: string
  aqi?: number | null
}

type HourlyPoint = {
  time: string
  aqi: number | null
}

type ApiHourlyPoint = {
  time?: string
  aqi?: number | null
}

const pollutantMeta: PollutantMeta[] = [
  { key: "pm25", label: "PM2.5", unit: "ug/m3", tone: "red", icon: Factory },
  { key: "pm10", label: "PM10", unit: "ug/m3", tone: "orange", icon: Car },
  { key: "co", label: "CO", unit: "ppm", tone: "yellow", icon: Wind },
  { key: "no2", label: "NO2", unit: "ppb", tone: "orange", icon: Navigation },
  { key: "so2", label: "SO2", unit: "ppb", tone: "green", icon: Leaf },
  { key: "o3", label: "O3", unit: "ppb", tone: "yellow", icon: Sun },
]

const POLLUTANT_DAY_SNAPSHOT_STORAGE_KEY = "envirosense-pollutant-daily-by-city-v1"

type PollutantSnapshotEntry = {
  date: string
  values: PollutantValues
}

type PollutantSnapshotStore = Record<string, PollutantSnapshotEntry>

function getLocalDateKey(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function normalizeCityKey(city: string) {
  return city.trim().toLowerCase()
}

function readPollutantSnapshotStore(): PollutantSnapshotStore {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(POLLUTANT_DAY_SNAPSHOT_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? (parsed as PollutantSnapshotStore) : {}
  } catch {
    return {}
  }
}

function writePollutantSnapshotStore(store: PollutantSnapshotStore) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(POLLUTANT_DAY_SNAPSHOT_STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Ignore storage failures (private mode/quota), UI will still show live values.
  }
}

function getAqiStatus(value: number | null) {
  if (typeof value !== "number") return "Unavailable"
  if (value <= 50) return "Good"
  if (value <= 100) return "Moderate"
  if (value <= 150) return "Unhealthy"
  if (value <= 200) return "Very Unhealthy"
  return "Hazardous"
}

function getAqiSeverityBarColor(value: number, isHighlight = false) {
  if (value <= 50) return isHighlight ? "#10b981" : "#34d399"
  if (value <= 100) return isHighlight ? "#d97706" : "#f59e0b"
  if (value <= 150) return isHighlight ? "#ea580c" : "#f97316"
  if (value <= 200) return isHighlight ? "#dc2626" : "#ef4444"
  return isHighlight ? "#7c3aed" : "#a855f7"
}

function getHourlyTrendStory(data: Array<{ time: string; aqi: number }>) {
  if (data.length < 3) return "Hourly AQI story will appear as more live points arrive."

  const first = data[0].aqi
  const last = data[data.length - 1].aqi
  const delta = last - first
  const peakPoint = data.reduce((peak, point) => (point.aqi > peak.aqi ? point : peak), data[0])
  const slope = delta / Math.max(data.length - 1, 1)

  if (slope >= 5) return `Air quality is rising sharply, peaking around ${peakPoint.time}.`
  if (slope >= 2) return `AQI is gradually rising through the day with a peak near ${peakPoint.time}.`
  if (slope <= -5) return "Air quality is improving quickly as the day progresses."
  if (slope <= -2) return "AQI is easing gradually with cleaner air later in the day."
  return `Stable air quality overall, with a mild peak around ${peakPoint.time}.`
}

function getWeeklyTrendStory(data: Array<{ day: string; aqi: number }>) {
  if (data.length < 3) return "Weekly AQI trend story will appear as history builds."

  const first = data[0].aqi
  const last = data[data.length - 1].aqi
  const delta = last - first
  const peakDay = data.reduce((peak, point) => (point.aqi > peak.aqi ? point : peak), data[0])

  if (delta >= 18) return `This week is trending worse, with the highest pollution on ${peakDay.day}.`
  if (delta >= 8) return `AQI is drifting upward this week, peaking on ${peakDay.day}.`
  if (delta <= -18) return "Air quality improved strongly compared with the start of the week."
  if (delta <= -8) return "AQI is gradually improving through the week."
  return `Weekly AQI is largely stable, with the highest reading on ${peakDay.day}.`
}

function getHourlyComparisonInsight(data: Array<{ time: string; aqi: number }>) {
  if (data.length < 2) return "Not enough hourly points for comparison insight yet."
  const first = data[0].aqi
  const last = data[data.length - 1].aqi
  if (first <= 0) return "Comparison insight will update with more reliable baseline points."

  const pct = Math.round((Math.abs(last - first) / first) * 100)
  if (last > first) return `Latest AQI is ${pct}% higher than the first reading today.`
  if (last < first) return `Latest AQI is ${pct}% lower than the first reading today.`
  return "Latest AQI is unchanged versus the first reading today."
}

function getWeeklyComparisonInsight(data: Array<{ day: string; aqi: number }>) {
  if (data.length < 2) return "Not enough weekly points for comparison insight yet."

  const latest = data[data.length - 1].aqi
  const previous = data[data.length - 2].aqi
  if (previous <= 0) return "Weekly comparison insight will update with more baseline data."

  const pct = Math.round((Math.abs(latest - previous) / previous) * 100)
  if (latest > previous) return `Today's AQI is ${pct}% higher than yesterday.`
  if (latest < previous) return `Today's AQI is ${pct}% lower than yesterday.`
  return "Today's AQI matches yesterday's level."
}

function AqiChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  const value = typeof payload[0]?.value === "number" ? payload[0].value : null
  const status = getAqiStatus(value)

  return (
    <div className="rounded-xl bg-white/92 px-3 py-2 text-xs text-gray-700 shadow-[0_10px_26px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:bg-slate-900/92 dark:text-gray-200">
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{label ?? "Now"}</p>
      <p className="mt-0.5 font-semibold text-gray-800 dark:text-white">AQI {value ?? "--"} ({status})</p>
    </div>
  )
}

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

function getAqiUiTone(aqi: number | null) {
  if (typeof aqi !== "number") {
    return {
      valueText: "text-slate-700 dark:text-slate-100",
      badge: "bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200",
    }
  }

  if (aqi <= 50) {
    return {
      valueText: "text-emerald-600 dark:text-emerald-300",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    }
  }

  if (aqi <= 100) {
    return {
      valueText: "text-amber-600 dark:text-amber-300",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    }
  }

  if (aqi <= 150) {
    return {
      valueText: "text-orange-600 dark:text-orange-300",
      badge: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
    }
  }

  if (aqi <= 200) {
    return {
      valueText: "text-rose-600 dark:text-rose-300",
      badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    }
  }

  return {
    valueText: "text-fuchsia-700 dark:text-fuchsia-300",
    badge: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
  }
}

function getCompactAqiCategory(aqi: number | null) {
  if (typeof aqi !== "number") return "--"
  if (aqi <= 50) return "Good"
  if (aqi <= 100) return "Moderate"
  if (aqi <= 150) return "Sensitive"
  if (aqi <= 200) return "Unhealthy"
  return "Hazardous"
}

function getHeroInsight(aqi: number | null) {
  if (typeof aqi !== "number") {
    return {
      line1: "Live AQI data is syncing now.",
      line2: "Health guidance updates in a moment.",
    }
  }
  if (aqi <= 100) {
    return {
      line1: "Safe for light outdoor activity.",
      line2: "Sensitive groups should monitor exposure.",
    }
  }
  return {
    line1: "Air quality stress is elevated.",
    line2: "Sensitive groups should limit exposure.",
  }
}

function getSmartAssistantLines(aqi: number | null) {
  if (typeof aqi !== "number") {
    return [
      "Live AQI feed is syncing now.",
      "Use moderate outdoor exposure until update.",
      "Mask is optional unless traffic is dense.",
    ]
  }

  if (aqi <= 50) {
    return [
      "Air quality is good right now.",
      "Ideal for outdoor activity.",
      "No mask required for most people.",
    ]
  }

  if (aqi <= 100) {
    return [
      "Air quality is acceptable now.",
      "Good for light outdoor activity.",
      "Sensitive groups should monitor exposure.",
    ]
  }

  if (aqi <= 150) {
    return [
      "Air quality stress is elevated.",
      "Limit long outdoor activity.",
      "Sensitive groups should wear a mask.",
    ]
  }

  return [
    "Air quality is unhealthy.",
    "Avoid prolonged outdoor activity.",
    "Mask strongly recommended outside.",
  ]
}

function parseHourLabel(label: string) {
  const value = label.trim().toLowerCase()
  if (!value) return null
  if (value === "now") return new Date().getHours()

  const match = value.match(/^(\d{1,2})(?::\d{2})?\s*(am|pm)?$/)
  if (!match) return null

  let hour = Number(match[1])
  if (!Number.isFinite(hour)) return null

  const meridiem = match[2]
  if (meridiem === "pm" && hour < 12) hour += 12
  if (meridiem === "am" && hour === 12) hour = 0
  if (hour < 0 || hour > 23) return null
  return hour
}

function formatHourLabel(hour24: number) {
  const normalized = ((hour24 % 24) + 24) % 24
  const hour12 = normalized % 12 === 0 ? 12 : normalized % 12
  const suffix = normalized >= 12 ? "PM" : "AM"
  return `${hour12} ${suffix}`
}

function getHeroTintClass(aqi: number | null) {
  if (typeof aqi !== "number") return "from-slate-100/60 via-slate-50/40 to-sky-100/40 dark:from-slate-500/20 dark:via-slate-500/10 dark:to-sky-500/10"
  if (aqi <= 50) return "from-emerald-100/65 via-cyan-100/45 to-teal-100/35 dark:from-emerald-500/18 dark:via-cyan-500/10 dark:to-teal-500/8"
  if (aqi <= 100) return "from-yellow-100/65 via-amber-100/45 to-orange-100/35 dark:from-yellow-500/18 dark:via-amber-500/10 dark:to-orange-500/8"
  return "from-orange-100/65 via-rose-100/45 to-red-100/35 dark:from-orange-500/18 dark:via-rose-500/10 dark:to-red-500/8"
}

function getAqiFocusCardClasses(aqi: number | null) {
  if (typeof aqi !== "number") {
    return {
      panel: "from-slate-100/70 via-slate-50/40 to-sky-100/35 dark:from-slate-600/20 dark:via-slate-500/10 dark:to-sky-500/8",
      glow: "drop-shadow-[0_6px_18px_rgba(71,85,105,0.35)]",
      badge: "bg-slate-100/70 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200",
    }
  }
  if (aqi <= 50) {
    return {
      panel: "from-emerald-100/75 via-teal-100/45 to-cyan-100/35 dark:from-emerald-500/22 dark:via-teal-500/12 dark:to-cyan-500/10",
      glow: "drop-shadow-[0_8px_20px_rgba(16,185,129,0.35)]",
      badge: "bg-emerald-100/75 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    }
  }
  if (aqi <= 100) {
    return {
      panel: "from-amber-100/75 via-yellow-100/45 to-orange-100/35 dark:from-amber-500/22 dark:via-yellow-500/12 dark:to-orange-500/10",
      glow: "drop-shadow-[0_8px_20px_rgba(245,158,11,0.35)]",
      badge: "bg-amber-100/75 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    }
  }
  if (aqi <= 150) {
    return {
      panel: "from-orange-100/80 via-amber-100/45 to-rose-100/30 dark:from-orange-500/24 dark:via-amber-500/12 dark:to-rose-500/10",
      glow: "drop-shadow-[0_8px_20px_rgba(249,115,22,0.35)]",
      badge: "bg-orange-100/75 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200",
    }
  }
  return {
    panel: "from-rose-100/80 via-red-100/45 to-orange-100/30 dark:from-rose-500/24 dark:via-red-500/12 dark:to-orange-500/10",
    glow: "drop-shadow-[0_8px_20px_rgba(239,68,68,0.35)]",
    badge: "bg-rose-100/75 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
  }
}

function normalizeSourceLabel(source: string) {
  const value = source.trim().toLowerCase()
  if (!value) return "Unknown"
  if (value.includes("open-meteo")) return "Open-Meteo"
  if (value.includes("waqi")) return "WAQI"
  return source
}

function getPollutantBarWidthClass(key: PollutantKey, value: number) {
  if (key === "co") {
    if (value >= 300) return "w-full"
    if (value >= 220) return "w-5/6"
    if (value >= 150) return "w-2/3"
    if (value >= 90) return "w-1/2"
    if (value >= 40) return "w-1/3"
    return "w-1/4"
  }

  if (value >= 140) return "w-full"
  if (value >= 110) return "w-5/6"
  if (value >= 80) return "w-2/3"
  if (value >= 50) return "w-1/2"
  if (value >= 25) return "w-1/3"
  return "w-1/4"
}

function getPollutantSeverityTone(value: number | null) {
  if (typeof value !== "number") {
    return {
      cardTint: "bg-slate-50/35 dark:bg-slate-500/8",
      barTint: "from-slate-400 to-slate-500",
    }
  }

  if (value <= 35) {
    return {
      cardTint: "bg-emerald-50/35 dark:bg-emerald-500/10",
      barTint: "from-emerald-400 to-green-500",
    }
  }

  if (value <= 80) {
    return {
      cardTint: "bg-yellow-50/35 dark:bg-yellow-500/10",
      barTint: "from-yellow-400 to-amber-500",
    }
  }

  if (value <= 140) {
    return {
      cardTint: "bg-orange-50/35 dark:bg-orange-500/10",
      barTint: "from-orange-400 to-amber-500",
    }
  }

  return {
    cardTint: "bg-red-50/35 dark:bg-red-500/10",
    barTint: "from-red-400 to-rose-500",
  }
}

function SkeletonCard() {
  return <div className="h-24 animate-pulse rounded-2xl bg-white/50 dark:bg-white/10" />
}

function formatValue(value: number | null, suffix = "") {
  return typeof value === "number" ? `${value}${suffix}` : "--"
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

type HealthGuidance = {
  priorityLabel: string
  priorityClasses: string
  priorityNote: string
  cards: Array<{ label: string; title: string; description: string }>
}

function getAqiHealthGuidance(aqi: number): HealthGuidance {
  if (aqi <= 50) {
    return {
      priorityLabel: "Low",
      priorityClasses: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
      priorityNote: "Air quality is supportive for most outdoor plans.",
      cards: [
        {
          label: "Protection",
          title: "Light protection is enough",
          description: "A basic mask is optional unless near heavy traffic or construction areas.",
        },
        {
          label: "Activity",
          title: "Outdoor workouts are safe",
          description: "Normal outdoor activity is generally fine for most people.",
        },
        {
          label: "Indoor Air",
          title: "Natural ventilation is okay",
          description: "Keep windows open for fresh air if local traffic is low.",
        },
      ],
    }
  }

  if (aqi <= 100) {
    return {
      priorityLabel: "Moderate",
      priorityClasses: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
      priorityNote: "Sensitive groups should reduce prolonged outdoor exposure.",
      cards: [
        {
          label: "Protection",
          title: "Carry a mask outdoors",
          description: "Sensitive people should use a good-quality mask during longer outdoor exposure.",
        },
        {
          label: "Activity",
          title: "Reduce intense outdoor sessions",
          description: "Prefer moderate exercise and take breaks away from busy roads.",
        },
        {
          label: "Indoor Air",
          title: "Limit dusty air entry",
          description: "Use fans or purifier mode when traffic pollution rises.",
        },
      ],
    }
  }

  if (aqi <= 150) {
    return {
      priorityLabel: "High",
      priorityClasses: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
      priorityNote: "Reduce outdoor exposure and use protection during busy hours.",
      cards: [
        {
          label: "Protection",
          title: "Wear an N95 mask",
          description: "Use an N95 or equivalent, especially near traffic corridors and crowded streets.",
        },
        {
          label: "Activity",
          title: "Limit outdoor workouts",
          description: "Choose early morning windows or move workouts indoors.",
        },
        {
          label: "Indoor Air",
          title: "Run air purifier",
          description: "Keep windows closed during peak AQI hours and use purifier filtration.",
        },
      ],
    }
  }

  if (aqi <= 200) {
    return {
      priorityLabel: "Very High",
      priorityClasses: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
      priorityNote: "Health risk is elevated. Prioritize indoor safety and filtration.",
      cards: [
        {
          label: "Protection",
          title: "Strict mask use outdoors",
          description: "Use a well-fitted N95/P100 mask for any necessary outdoor exposure.",
        },
        {
          label: "Activity",
          title: "Avoid outdoor exertion",
          description: "Postpone running, cycling, and prolonged outdoor activity.",
        },
        {
          label: "Indoor Air",
          title: "Seal indoor environment",
          description: "Close windows and run purifier at higher speed during pollution spikes.",
        },
      ],
    }
  }

  return {
    priorityLabel: "Critical",
    priorityClasses: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    priorityNote: "Severe conditions. Avoid outdoor exposure whenever possible.",
    cards: [
      {
        label: "Protection",
        title: "Avoid outdoor exposure",
        description: "Stay indoors as much as possible and use high-grade masks if stepping out is unavoidable.",
      },
      {
        label: "Activity",
        title: "Suspend outdoor activity",
        description: "Avoid all intense physical activity outside until AQI improves.",
      },
      {
        label: "Indoor Air",
        title: "Maximum indoor protection",
        description: "Keep indoor air filtered continuously and reduce infiltration from outside air.",
      },
    ],
  }
}

type AirQualityDashboardProps = {
  initialCity?: string
}

export function AirQualityDashboard({ initialCity }: AirQualityDashboardProps) {
  const searchParams = useSearchParams()
  const { resolvedTheme } = useTheme()
  const cityQuery = initialCity ?? searchParams.get("city") ?? "New Delhi, India"
  const [city, setCity] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showError, setShowError] = useState(false)
  const [currentAqi, setCurrentAqi] = useState<number | null>(null)
  const [aqiSource, setAqiSource] = useState("WAQI")
  const [aqiStation, setAqiStation] = useState<string | null>(null)
  const [aqiSyncedAt, setAqiSyncedAt] = useState<Date | null>(null)
  const [hourlyAqi, setHourlyAqi] = useState<HourlyPoint[]>([])
  const [weeklyAqi, setWeeklyAqi] = useState<TrendPoint[]>([])
  const [pollutantValues, setPollutantValues] = useState<PollutantValues | null>(null)
  const [previousPollutantValues, setPreviousPollutantValues] = useState<Partial<PollutantValues> | null>(null)
  const [weatherTemp, setWeatherTemp] = useState<number | null>(null)
  const [weatherCondition, setWeatherCondition] = useState<string | null>(null)
  const [weatherHumidity, setWeatherHumidity] = useState<number | null>(null)
  const [weatherWindKmh, setWeatherWindKmh] = useState<number | null>(null)
  const [uvIndex, setUvIndex] = useState<number | null>(null)
  const [weatherUpdatedAt, setWeatherUpdatedAt] = useState<Date | null>(null)
  const [timeNowMs, setTimeNowMs] = useState(Date.now())
  const [isHourlyInteractive, setIsHourlyInteractive] = useState(false)
  const [isWeeklyInteractive, setIsWeeklyInteractive] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629])
  const [mapZoom, setMapZoom] = useState(5)
  const [mapMarker, setMapMarker] = useState<CityMarker | null>(null)

  const tileUrl = useMemo(() => {
    return resolvedTheme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  }, [resolvedTheme])

  const tileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO'

  const healthCardMeta = {
    Protection: {
      Icon: ShieldCheck,
      iconWrap: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
      actionChip: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
      actionText: "Do now",
    },
    Activity: {
      Icon: Navigation,
      iconWrap: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
      actionChip: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
      actionText: "Plan",
    },
    "Indoor Air": {
      Icon: Wind,
      iconWrap: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
      actionChip: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
      actionText: "Home",
    },
  } as const

  const hasAqiValue = typeof currentAqi === "number"

  const healthGuidance = useMemo(() => (hasAqiValue ? getAqiHealthGuidance(currentAqi) : null), [hasAqiValue, currentAqi])
  const aqiCategory = hasAqiValue ? getAqiPointerLabel(currentAqi) : "--"
  const compactAqiCategory = useMemo(() => getCompactAqiCategory(currentAqi), [currentAqi])
  const heroInsight = useMemo(() => getHeroInsight(currentAqi), [currentAqi])
  const smartAssistantLines = useMemo(() => getSmartAssistantLines(currentAqi), [currentAqi])
  const heroTintClass = useMemo(() => getHeroTintClass(currentAqi), [currentAqi])
  const aqiFocus = useMemo(() => getAqiFocusCardClasses(currentAqi), [currentAqi])
  const trustSource = useMemo(() => normalizeSourceLabel(aqiSource), [aqiSource])
  const trustStation = useMemo(() => {
    const station = aqiStation ?? city ?? cityQuery
    return station.split(",")[0].trim()
  }, [aqiStation, city, cityQuery])
  const trustUpdatedLabel = useMemo(() => {
    if (!aqiSyncedAt) return "Updated just now"
    const elapsedMinutes = Math.max(0, Math.floor((timeNowMs - aqiSyncedAt.getTime()) / 60000))
    if (elapsedMinutes === 0) return "Updated just now"
    return `Updated ${elapsedMinutes}m ago`
  }, [aqiSyncedAt, timeNowMs])
  const aqiPercentage = hasAqiValue ? Math.min(Math.max((currentAqi / 500) * 100, 0), 100) : 0
  const aqiPointerGlow = hasAqiValue ? getAqiPointerGlow(currentAqi) : "from-slate-400 via-slate-300 to-slate-500"
  const aqiPointerLabel = hasAqiValue ? getAqiPointerLabel(currentAqi) : "--"
  const aqiUiTone = useMemo(() => getAqiUiTone(currentAqi), [currentAqi])

  const pollutants: Pollutant[] = useMemo(() => {
    return pollutantMeta.map((item) => {
      const value = pollutantValues?.[item.key] ?? null
      const previous = previousPollutantValues?.[item.key]
      if (typeof value !== "number" || typeof previous !== "number" || previous <= 0) {
        return {
          ...item,
          value,
          trend: "flat",
          delta: "--",
        }
      }

      const deltaRaw = ((value - previous) / previous) * 100
      const deltaRounded = Math.round(deltaRaw)
      const trend: Pollutant["trend"] = deltaRounded > 0 ? "up" : deltaRounded < 0 ? "down" : "flat"
      const deltaLabel = deltaRounded > 0 ? `+${deltaRounded}%` : `${deltaRounded}%`

      return {
        ...item,
        value,
        trend,
        delta: deltaLabel,
      }
    })
  }, [pollutantValues, previousPollutantValues])

  const weatherUpdatedLabel = useMemo(() => {
    if (!weatherUpdatedAt) return "Updating..."
    const elapsedMinutes = Math.max(0, Math.floor((timeNowMs - weatherUpdatedAt.getTime()) / 60000))
    if (elapsedMinutes === 0) return "Updated just now"
    return `Updated ${elapsedMinutes}m ago`
  }, [timeNowMs, weatherUpdatedAt])

  const hourlyChartData = useMemo(
    () => hourlyAqi.filter((point) => typeof point.aqi === "number") as Array<{ time: string; aqi: number }>,
    [hourlyAqi],
  )

  const trendIntelligence = useMemo(() => {
    if (hourlyChartData.length < 4) return "AQI trend is stabilizing today"

    const midpoint = Math.floor(hourlyChartData.length / 2)
    const firstValues = hourlyChartData.slice(0, midpoint).map((point) => point.aqi)
    const secondValues = hourlyChartData.slice(midpoint).map((point) => point.aqi)
    const firstAvg = firstValues.reduce((sum, value) => sum + value, 0) / Math.max(firstValues.length, 1)
    const secondAvg = secondValues.reduce((sum, value) => sum + value, 0) / Math.max(secondValues.length, 1)
    const delta = secondAvg - firstAvg

    if (delta <= -8) return "AQI improving today"
    if (delta >= 8) return "AQI rising this evening"
    return "AQI trend is mostly stable"
  }, [hourlyChartData])

  const bestTimeOutside = useMemo(() => {
    if (hourlyChartData.length === 0) return "Best time to go outside: check shortly"

    const pointsWithHour = hourlyChartData
      .map((point) => ({
        hour: parseHourLabel(point.time),
        aqi: point.aqi,
      }))
      .filter((item): item is { hour: number; aqi: number } => typeof item.hour === "number")

    if (pointsWithHour.length === 0) return "Best time to go outside: check shortly"

    const morning = pointsWithHour.filter((item) => item.hour >= 6 && item.hour <= 9)
    if (morning.length > 0) {
      return "Best time to go outside: 6-9 AM"
    }

    const bestPoint = pointsWithHour.reduce((best, current) => (current.aqi < best.aqi ? current : best), pointsWithHour[0])
    const endHour = (bestPoint.hour + 2) % 24
    return `Best time to go outside: ${formatHourLabel(bestPoint.hour)}-${formatHourLabel(endHour)}`
  }, [hourlyChartData])

  const weeklyChartData = useMemo(
    () => weeklyAqi.filter((point) => typeof point.aqi === "number") as Array<{ day: string; aqi: number }>,
    [weeklyAqi],
  )

  const hourlyTrendStory = useMemo(() => getHourlyTrendStory(hourlyChartData), [hourlyChartData])
  const weeklyTrendStory = useMemo(() => getWeeklyTrendStory(weeklyChartData), [weeklyChartData])
  const hourlyComparisonInsight = useMemo(() => getHourlyComparisonInsight(hourlyChartData), [hourlyChartData])
  const weeklyComparisonInsight = useMemo(() => getWeeklyComparisonInsight(weeklyChartData), [weeklyChartData])

  const hourlyNowLabel = useMemo(() => {
    if (hourlyChartData.length === 0) return null
    const currentHour = new Date(timeNowMs).getHours()
    const best = hourlyChartData
      .map((point) => ({ point, hour: parseHourLabel(point.time) }))
      .filter((item): item is { point: { time: string; aqi: number }; hour: number } => typeof item.hour === "number")
      .reduce<{ point: { time: string; aqi: number }; hour: number } | null>((closest, current) => {
        if (!closest) return current
        const closestDelta = Math.abs(closest.hour - currentHour)
        const currentDelta = Math.abs(current.hour - currentHour)
        return currentDelta < closestDelta ? current : closest
      }, null)

    return best?.point.time ?? null
  }, [hourlyChartData, timeNowMs])

  const weeklyPeakDay = useMemo(() => {
    if (weeklyChartData.length === 0) return null
    return weeklyChartData.reduce((peak, item) => (item.aqi > peak.aqi ? item : peak), weeklyChartData[0]).day
  }, [weeklyChartData])

  const hourlyStats = useMemo(() => {
    if (hourlyChartData.length === 0) {
      return { peak: null as number | null, lowest: null as number | null, avg: null as number | null }
    }

    const values = hourlyChartData.map((item) => item.aqi)
    const peak = Math.max(...values)
    const lowest = Math.min(...values)
    const avg = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    return { peak, lowest, avg }
  }, [hourlyChartData])

  const weeklyStats = useMemo(() => {
    if (weeklyChartData.length === 0) {
      return { highest: null as number | null, lowest: null as number | null, avg: null as number | null }
    }

    const values = weeklyChartData.map((item) => item.aqi)
    const highest = Math.max(...values)
    const lowest = Math.min(...values)
    const avg = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    return { highest, lowest, avg }
  }, [weeklyChartData])

  const handleRefresh = async (requestedCity?: string) => {
    setShowError(false)
    setIsLoading(true)
    try {
      const selectedCity = requestedCity ?? city ?? cityQuery
      const fetchCity = selectedCity.split(",")[0].trim()
      const data = await fetchAqiData(fetchCity)
      setCurrentAqi(typeof data?.aqi === "number" ? data.aqi : null)
      setAqiSource(typeof data?.provider === "string" && data.provider.trim() ? data.provider : "WAQI")
      setAqiStation(typeof data?.city === "string" && data.city.trim() ? data.city : fetchCity)
      setAqiSyncedAt(new Date())
      const apiHourly = Array.isArray(data?.hourly)
        ? (data.hourly as ApiHourlyPoint[])
            .map((point) => ({
              time: point.time ?? "",
              aqi: typeof point.aqi === "number" ? point.aqi : null,
            }))
            .filter((point) => point.time)
        : []
      setHourlyAqi(apiHourly)
      if (data?.city) {
        setCity(data.city)
      } else {
        setCity(null)
      }

      try {
        const [weatherData, uvData] = await Promise.all([fetchWeatherData(fetchCity), fetchUvData(fetchCity)])
        setWeatherTemp(typeof weatherData?.temp === "number" ? Math.round(weatherData.temp) : null)
        setWeatherHumidity(typeof weatherData?.humidity === "number" ? Math.round(weatherData.humidity) : null)
        setWeatherWindKmh(typeof weatherData?.windKmh === "number" ? Math.round(weatherData.windKmh) : null)
        setUvIndex(typeof uvData?.currentUv === "number" ? Number(uvData.currentUv.toFixed(1)) : null)
        const conditionRaw = typeof weatherData?.condition === "string" ? weatherData.condition : typeof weatherData?.description === "string" ? weatherData.description : null
        setWeatherCondition(conditionRaw ? toTitleCase(conditionRaw) : null)
        setWeatherUpdatedAt(conditionRaw || typeof weatherData?.temp === "number" ? new Date() : null)

        const lat = typeof weatherData?.coord?.lat === "number" ? weatherData.coord.lat : null
        const lon = typeof weatherData?.coord?.lon === "number" ? weatherData.coord.lon : null
        if (typeof lat === "number" && typeof lon === "number") {
          const markerCity = typeof weatherData?.city === "string" ? weatherData.city : fetchCity
          const markerCountry = typeof weatherData?.country === "string" ? weatherData.country : ""

          setMapCenter([lat, lon])
          setMapZoom(11)
          setMapMarker({
            id: "aqi-searched-city",
            city: markerCity,
            country: markerCountry,
            lat,
            lng: lon,
            isCurrentLocation: true,
            data: {
              aqi: typeof data?.aqi === "number" ? data.aqi : 0,
              temperature: typeof weatherData?.temp === "number" ? Math.round(weatherData.temp) : 0,
              uv: 0,
            },
          })
        }
      } catch {
        setWeatherTemp(null)
        setWeatherHumidity(null)
        setWeatherWindKmh(null)
        setUvIndex(null)
        setWeatherCondition(null)
        setWeatherUpdatedAt(null)
      }

      const apiPollutants = data?.pollutants
      if (apiPollutants) {
        setPollutantValues((prev) => {
          const nextValues: PollutantValues = {
            pm25: typeof apiPollutants.pm25 === "number" ? apiPollutants.pm25 : prev?.pm25,
            pm10: typeof apiPollutants.pm10 === "number" ? apiPollutants.pm10 : prev?.pm10,
            co: typeof apiPollutants.co === "number" ? apiPollutants.co : prev?.co,
            no2: typeof apiPollutants.no2 === "number" ? apiPollutants.no2 : prev?.no2,
            so2: typeof apiPollutants.so2 === "number" ? apiPollutants.so2 : prev?.so2,
            o3: typeof apiPollutants.o3 === "number" ? apiPollutants.o3 : prev?.o3,
          }

          const apiPrevious = data?.previousPollutants
          const previousFromApi: Partial<PollutantValues> = {
            pm25: typeof apiPrevious?.pm25 === "number" ? apiPrevious.pm25 : undefined,
            pm10: typeof apiPrevious?.pm10 === "number" ? apiPrevious.pm10 : undefined,
            co: typeof apiPrevious?.co === "number" ? apiPrevious.co : undefined,
            no2: typeof apiPrevious?.no2 === "number" ? apiPrevious.no2 : undefined,
            so2: typeof apiPrevious?.so2 === "number" ? apiPrevious.so2 : undefined,
            o3: typeof apiPrevious?.o3 === "number" ? apiPrevious.o3 : undefined,
          }
          const hasApiBaseline = Object.values(previousFromApi).some((value) => typeof value === "number")

          const snapshotStore = readPollutantSnapshotStore()
          const cityKey = normalizeCityKey(fetchCity)
          const todayKey = getLocalDateKey(0)
          const yesterdayKey = getLocalDateKey(-1)
          const existing = snapshotStore[cityKey]

          if (hasApiBaseline) {
            setPreviousPollutantValues(previousFromApi)
          } else if (existing?.date === yesterdayKey) {
            setPreviousPollutantValues(existing.values)
          } else if (existing && existing.date !== todayKey) {
            // Fall back to the latest older snapshot if exact yesterday data is unavailable.
            setPreviousPollutantValues(existing.values)
          } else {
            setPreviousPollutantValues(null)
          }

          snapshotStore[cityKey] = {
            date: todayKey,
            values: nextValues,
          }
          writePollutantSnapshotStore(snapshotStore)

          const apiTrend = Array.isArray(data?.trend)
            ? (data.trend as ApiTrendPoint[])
                .map((point: ApiTrendPoint) => ({
                  day: point.day ?? point.date ?? "",
                  aqi: typeof point.aqi === "number" ? point.aqi : null,
                }))
                .filter((point) => point.day)
            : []

          if (apiTrend.length > 0) {
            setWeeklyAqi(apiTrend.slice(-7))
          } else {
            setWeeklyAqi([])
          }

          return nextValues
        })
      } else {
        setPollutantValues(null)
        setPreviousPollutantValues(null)
        setWeeklyAqi([])
      }
    } catch {
      setShowError(true)
      setHourlyAqi([])
      setWeeklyAqi([])
      setUvIndex(null)
      setAqiSource("WAQI")
      setAqiStation(cityQuery)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    void handleRefresh(cityQuery)
  }, [cityQuery])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void handleRefresh(cityQuery)
    }, 120000)

    return () => window.clearInterval(intervalId)
  }, [cityQuery])

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setTimeNowMs(Date.now())
    }, 60000)

    return () => window.clearInterval(timerId)
  }, [])

  if (isLoading) {
    return (
      <section className="dashboard-scroll flex-1 overflow-y-auto px-2 pb-20 pt-3 sm:px-4 md:px-6 lg:px-8 lg:pb-8 lg:pt-6">
        <AqiDashboardSkeleton />
      </section>
    )
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
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04, duration: 0.3 }}
        whileTap={{ scale: 0.998 }}
        className="mb-4 rounded-2xl border border-white/20 bg-white/30 p-4 shadow-[0_6px_20px_rgba(0,0,0,0.08)] backdrop-blur-lg transition-transform duration-200 hover:scale-[1.01] md:hidden"
      >
        <div className={`pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br ${heroTintClass}`} />
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-white/40 to-transparent" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
              <MapPin className="mr-1 inline h-3.5 w-3.5" />
              {city ?? cityQuery}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/45 px-2.5 py-1 text-[10px] font-medium text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-gray-200">
              Live
              <CircleDot className="h-2.5 w-2.5 animate-pulse text-rose-500 dark:text-rose-300" />
            </span>
          </div>

          <div className={cn("rounded-xl border border-white/20 bg-linear-to-br py-2.5 text-center shadow-[0_6px_16px_rgba(0,0,0,0.08)] dark:border-white/10", aqiFocus.panel)}>
            <div className="relative inline-block">
              <span className={cn("pointer-events-none absolute inset-0 -z-10 rounded-full blur-2xl", aqiFocus.glow)} />
              <motion.p
                initial={{ scale: 0.94, opacity: 0.8 }}
                animate={{ scale: [1, 1.02, 1], opacity: 1 }}
                transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.5 }}
                className={cn("text-6xl font-bold leading-none tracking-tight", aqiUiTone.valueText)}
              >
                {formatValue(currentAqi)}
              </motion.p>
            </div>
            <span className={cn("mt-2 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-medium", aqiFocus.badge)}>{compactAqiCategory}</span>
          </div>

          <div className="group rounded-xl border border-white/20 bg-white/30 px-3 py-2 shadow-inner dark:border-white/10 dark:bg-white/8">
            <div className="mb-1 flex items-center justify-between text-[10px] text-gray-600 dark:text-gray-300">
              <span className="font-medium">AQI Scale</span>
              <span className="opacity-80">0-500</span>
            </div>
            <div className="relative h-2.5 w-full rounded-full bg-white/50 dark:bg-white/10">
              <div className="h-full w-full rounded-full bg-[linear-gradient(90deg,#22c55e_0%,#84cc16_20%,#facc15_40%,#f97316_62%,#ef4444_82%,#a855f7_100%)]" />
              <motion.div
                className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                animate={{ left: `${aqiPercentage}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <span className={cn("absolute inset-0 -z-10 block h-4 w-4 rounded-full bg-linear-to-br blur-md opacity-75", aqiPointerGlow)} />
                <span className={cn("relative block h-4 w-4 rounded-full border border-white bg-linear-to-br shadow-[0_0_0_2px_rgba(255,255,255,0.65),0_6px_16px_rgba(15,23,42,0.22)]", aqiPointerGlow)} />
                <span className="absolute left-1/2 top-[calc(100%+2px)] h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[2px] bg-white/80 dark:bg-white/30" />
              </motion.div>
            </div>
            <div className="mt-1 grid grid-cols-5 text-[9px] text-gray-500 transition-opacity duration-200 opacity-70 group-hover:opacity-100 group-active:opacity-100 dark:text-gray-400">
              <span>Good</span>
              <span>Fair</span>
              <span>Mod</span>
              <span>Poor</span>
              <span className="text-right">Haz</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/20 bg-white/35 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:border-white/10 dark:bg-white/8">
            <p className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-gray-800 dark:text-gray-100">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-300" />
              Smart Insight
            </p>
            <p className="line-clamp-1 text-xs text-gray-700/90 dark:text-gray-200/90">✅ {smartAssistantLines[0]}</p>
            <p className="line-clamp-1 text-xs text-gray-700/85 dark:text-gray-300/85">🏃 {smartAssistantLines[1]}</p>
            <p className="line-clamp-1 text-xs text-gray-700/80 dark:text-gray-300/80">😷 {smartAssistantLines[2]}</p>
          </div>

          <div className="rounded-lg border border-white/15 bg-white/20 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/8">
            <p className="truncate text-xs text-gray-700/75 dark:text-gray-300/85">
              <span className="inline-flex items-center gap-1 text-rose-500 dark:text-rose-300">
                <CircleDot className="h-3 w-3 animate-pulse" /> Live
              </span>
              <span className="mx-1">•</span>{trustSource}
              <span className="mx-1">•</span>{trustUpdatedLabel}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-gray-600/80 dark:text-gray-400/90">
              <MapPin className="mr-1 inline h-3 w-3" />
              {trustStation} station • Data confidence: high
            </p>
          </div>

          <div className="flex flex-wrap gap-2 border-y border-white/20 py-2 dark:border-white/10">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/45 px-2.5 py-1 text-xs font-medium text-gray-800 shadow-sm transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] dark:bg-white/10 dark:text-gray-100"><ThermometerSun className="h-3.5 w-3.5 text-rose-500 dark:text-rose-300" />{formatValue(weatherTemp, "C")}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/45 px-2.5 py-1 text-xs font-medium text-gray-800 shadow-sm transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] dark:bg-white/10 dark:text-gray-100"><Droplets className="h-3.5 w-3.5 text-blue-500 dark:text-blue-300" />{formatValue(weatherHumidity, "%")}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/45 px-2.5 py-1 text-xs font-medium text-gray-800 shadow-sm transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] dark:bg-white/10 dark:text-gray-100"><Wind className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-300" />{formatValue(weatherWindKmh, " km/h")}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/45 px-2.5 py-1 text-xs font-medium text-gray-800 shadow-sm transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] dark:bg-white/10 dark:text-gray-100"><Sun className="h-3.5 w-3.5 text-amber-500 dark:text-amber-300" />UV {formatValue(uvIndex)}</span>
          </div>

          <div className="rounded-lg bg-white/30 px-3 py-2 text-xs text-gray-700 dark:bg-white/8 dark:text-gray-200">
            <p className="inline-flex items-center gap-1 font-medium"><TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />{trendIntelligence}</p>
            <p className="mt-1 inline-flex items-center gap-1 opacity-85"><Clock3 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />{bestTimeOutside}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            <div className="rounded-lg bg-white/25 px-3 py-2 dark:bg-white/8">
              <p className="text-[11px] uppercase tracking-wide opacity-70">PM2.5</p>
              <p className="mt-0.5 text-sm">{formatValue(pollutantValues?.pm25 ?? null)}</p>
            </div>
            <div className="rounded-lg bg-white/25 px-3 py-2 dark:bg-white/8">
              <p className="text-[11px] uppercase tracking-wide opacity-70">PM10</p>
              <p className="mt-0.5 text-sm">{formatValue(pollutantValues?.pm10 ?? null)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="mb-4 hidden rounded-xl border border-white/50 bg-white/70 p-3 shadow-[0_14px_36px_rgba(15,23,42,0.12)] ring-1 ring-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] md:block md:p-5 lg:mb-6 lg:p-6"
      >
        <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-sky-100/55 via-emerald-100/45 to-amber-100/50 dark:from-sky-500/15 dark:via-emerald-500/10 dark:to-amber-500/10" />
        <div className="relative z-10 mb-5">
          <h1 className="text-xl font-extrabold tracking-tight text-gray-800 dark:text-white sm:text-3xl">
            <span className="inline-block bg-linear-to-r from-sky-500 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">EnviroSense</span>
            <span className="ml-1 inline-block text-gray-800 dark:text-white sm:ml-2">AQI Dashboard</span>
          </h1>
          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
            Live air quality analytics and environmental recommendations
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-3 sm:gap-4 md:gap-5 md:grid-cols-[minmax(0,1fr)_420px] lg:grid-cols-[minmax(0,1fr)_560px] lg:items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/95 px-3 py-1.5 text-[11px] font-bold text-blue-700 shadow-sm dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300 sm:gap-2 sm:px-3.5 sm:text-xs"
            >
              <MapPin className="h-3.5 w-3.5" />
              {city ?? "--"}
            </motion.div>
            <h2 className={`text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl ${aqiUiTone.valueText}`}>{formatValue(currentAqi)}</h2>
            <p className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${aqiUiTone.badge}`}>
              {aqiCategory}
            </p>
            <p className="mt-2 max-w-md text-xs text-gray-600 dark:text-gray-300 sm:mt-3 sm:max-w-lg sm:text-sm md:text-base">
              Live air quality insights with health-first guidance. Adjust outdoor plans, exercise intensity, and mask usage based on current risk.
            </p>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="mt-4 inline-flex rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:bg-white/80 dark:bg-white/10 dark:text-white"
            >
              {isLoading ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>

          <div className="rounded-xl border border-white/50 bg-white/75 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.08)] ring-1 ring-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 sm:rounded-2xl sm:p-4 md:p-4.5 lg:p-5">
            <div className="mb-2 flex items-center justify-between sm:mb-3">
              <p className="text-xs font-semibold text-gray-800 dark:text-white sm:text-sm">AQI Indicator</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-700/60 dark:text-slate-200 sm:px-2.5 sm:py-1 sm:text-[10px]">Scale 0-500</span>
            </div>
            <div className="relative mt-5 pb-12 sm:mt-6 sm:pb-14 md:mt-8">
              <div className="relative h-6 w-full overflow-visible rounded-full bg-slate-200/80 dark:bg-slate-700/80 sm:h-7 md:h-8" aria-label="AQI color scale">
                <div className="h-full w-full rounded-full bg-[linear-gradient(90deg,#22c55e_0%,#84cc16_20%,#facc15_40%,#f97316_62%,#ef4444_82%,#a855f7_100%)]" />
                <motion.div
                  className="pointer-events-none absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                  animate={{ left: `${aqiPercentage}%` }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <div className="relative flex flex-col items-center">
                    <span className={`absolute inset-0 -z-10 h-7 w-7 rounded-full bg-linear-to-br ${aqiPointerGlow} blur-md opacity-70`} />
                    <span className={`relative flex h-4.5 w-4.5 items-center justify-center rounded-full bg-linear-to-br ${aqiPointerGlow} shadow-[0_0_0_3px_rgba(255,255,255,0.7),0_6px_14px_rgba(15,23,42,0.2)] ring-2 ring-white dark:ring-slate-900`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                    </span>
                    <span className={`absolute left-1/2 top-[calc(100%+4px)] h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-linear-to-br ${aqiPointerGlow} shadow-[0_5px_14px_rgba(15,23,42,0.18)]`} />
                    <span className={`absolute left-1/2 bottom-[calc(100%+10px)] -translate-x-1/2 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${aqiCategory === "Unhealthy" ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-300"}`}>
                      AQI {formatValue(currentAqi)}
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>
            <div className="mt-0 grid grid-cols-5 text-[10px] font-medium sm:text-[11px]">
              <span className="text-emerald-600 dark:text-emerald-300">Good</span>
              <span className="text-lime-600 dark:text-lime-300">Fair</span>
              <span className="text-amber-600 dark:text-amber-300">Moderate</span>
              <span className="text-orange-600 dark:text-orange-300">Unhealthy</span>
              <span className="text-right text-fuchsia-700 dark:text-fuchsia-300">Hazardous</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mb-4 sm:mb-6">
        <div className="mb-2 flex flex-col gap-0.5 sm:mb-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xs font-semibold text-gray-800 dark:text-white sm:text-sm">Pollutant Breakdown</h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">Real-time concentration metrics vs previous-day baseline</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-3 md:gap-4 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={`pollutant-skeleton-${idx}`} />)
          : pollutants.map((item, index) => {
              const Icon = item.icon
              const TrendIcon = item.trend === "up" ? TrendingUp : item.trend === "down" ? TrendingDown : Minus
              const toneValue = typeof item.value === "number" ? item.value : 0
              const severity = getPollutantSeverityTone(item.value)

              return (
                <motion.article
                  key={item.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.04 * index }}
                  whileHover={{ y: -2 }}
                  className={cn(
                    "h-full rounded-xl border border-white/20 p-3 shadow-sm backdrop-blur-lg transition-all duration-200 ease-in-out",
                    severity.cardTint,
                    "dark:border-white/10 sm:rounded-2xl sm:border-white/40 sm:bg-white/60 sm:p-3 sm:shadow-[0_8px_32px_rgba(31,38,135,0.15)] sm:ring-1 sm:ring-white/30 sm:backdrop-blur-xl dark:sm:bg-white/10 dark:sm:shadow-[0_0_40px_rgba(0,0,0,0.5)] md:p-4"
                  )}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/40 text-gray-700 dark:bg-white/10 dark:text-gray-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${
                        item.trend === "up"
                          ? "bg-red-100/50 text-red-600 dark:bg-red-500/15 dark:text-red-300"
                          : item.trend === "down"
                            ? "bg-emerald-100/50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : "bg-slate-100/50 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300"
                      }`}
                    >
                      <TrendIcon className="h-3.5 w-3.5" />
                      {item.delta}
                    </div>
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{item.label}</p>
                  <div className="mt-1 flex items-end gap-1.5">
                    <p className="text-lg font-semibold leading-none text-gray-800 dark:text-white md:text-2xl">{formatValue(item.value)}</p>
                    <p className="pb-0.5 text-xs opacity-60 text-gray-600 dark:text-gray-300">{item.unit}</p>
                  </div>

                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/55 dark:bg-white/10">
                    <div className={`h-full rounded-full bg-linear-to-r transition-all duration-300 ${severity.barTint} ${getPollutantBarWidthClass(item.key as PollutantKey, toneValue)}`} />
                  </div>
                </motion.article>
              )
            })}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-6 sm:gap-4 md:gap-5 xl:grid-cols-2">
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-white/20 bg-white/30 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/10 sm:p-4"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold text-gray-800 dark:text-white sm:text-base">AQI Trend (Hourly)</h3>
              <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">Fine-grained variation for today</p>
            </div>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-semibold text-emerald-600 dark:bg-white/10 dark:text-emerald-300 sm:px-2.5 sm:py-1 sm:text-[11px]">
              Live
            </span>
          </div>

          <p className="mb-3 rounded-lg bg-white/50 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-200">
            {hourlyTrendStory}
          </p>

          <div className="mb-3 grid grid-cols-3 gap-1.5 text-xs sm:gap-2">
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">Peak</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatValue(hourlyStats.peak)}</p>
            </div>
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">Lowest</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatValue(hourlyStats.lowest)}</p>
            </div>
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatValue(hourlyStats.avg)}</p>
            </div>
          </div>

          <div
            className="h-52 w-full rounded-xl border border-white/20 bg-white/35 p-2 transition-all duration-200 sm:h-60 dark:border-white/10 dark:bg-white/5"
            onMouseEnter={() => setIsHourlyInteractive(true)}
            onMouseLeave={() => setIsHourlyInteractive(false)}
            onTouchStart={() => setIsHourlyInteractive(true)}
            onTouchEnd={() => setIsHourlyInteractive(false)}
          >
            {hourlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyChartData}>
                  <defs>
                    <linearGradient id="hourlyStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="38%" stopColor="#facc15" />
                      <stop offset="68%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="hourlyStrokeGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                      <stop offset="38%" stopColor="#facc15" stopOpacity={0.35} />
                      <stop offset="68%" stopColor="#f97316" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="hourlyFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.24} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.5)" strokeOpacity={0.08} />
                  <XAxis dataKey="time" tick={{ fill: "#6b7280", fontSize: 10 }} minTickGap={16} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} width={26} axisLine={false} tickLine={false} />
                  <Tooltip content={<AqiChartTooltip />} cursor={{ stroke: "rgba(148,163,184,0.28)", strokeDasharray: "4 4" }} />
                  {hourlyNowLabel ? (
                    <ReferenceLine
                      x={hourlyNowLabel}
                      stroke="rgba(59,130,246,0.55)"
                      strokeDasharray="3 3"
                      label="Now"
                    />
                  ) : null}
                  <Area
                    type="monotone"
                    dataKey="aqi"
                    stroke="url(#hourlyStrokeGlow)"
                    strokeWidth={isHourlyInteractive ? 8 : 7}
                    fill="transparent"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="aqi"
                    stroke="url(#hourlyStroke)"
                    strokeWidth={isHourlyInteractive ? 3.5 : 3}
                    fill="url(#hourlyFill)"
                    dot={(props: any) => {
                      const isNow = props?.payload?.time === hourlyNowLabel
                      return (
                        <g key={`hourly-dot-${props?.cx}-${props?.cy}-${props?.payload?.time}`}>
                          {isNow ? <circle cx={props.cx} cy={props.cy} r={9} fill="rgba(59,130,246,0.2)" /> : null}
                          <circle cx={props.cx} cy={props.cy} r={isNow ? 4.8 : 3} fill="#ffffff" stroke={isNow ? "#3b82f6" : "#f87171"} strokeWidth={isNow ? 2 : 1.4} />
                        </g>
                      )
                    }}
                    activeDot={{ r: 7, fill: "#fff", stroke: "#f97316", strokeWidth: 2.2 }}
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/40 bg-white/20 text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                Hourly AQI data is unavailable.
              </div>
            )}
          </div>

          <p className="mt-2 rounded-lg bg-white/45 px-2.5 py-2 text-xs text-gray-700 dark:bg-white/10 dark:text-gray-200">
            {hourlyComparisonInsight}
          </p>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-white/20 bg-white/30 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/10 sm:p-4"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold text-gray-800 dark:text-white sm:text-base">AQI Trend (Weekly)</h3>
              <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">7-day city-level trend</p>
            </div>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-semibold text-blue-600 dark:bg-white/10 dark:text-blue-300 sm:px-2.5 sm:py-1 sm:text-[11px]">
              7 Days
            </span>
          </div>

          <p className="mb-3 rounded-lg bg-white/50 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-200">
            {weeklyTrendStory}
          </p>

          <div className="mb-3 grid grid-cols-3 gap-1.5 text-xs sm:gap-2">
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">Highest</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatValue(weeklyStats.highest)}</p>
            </div>
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">Lowest</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatValue(weeklyStats.lowest)}</p>
            </div>
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">Weekly Avg</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatValue(weeklyStats.avg)}</p>
            </div>
          </div>

          <div
            className="h-52 w-full rounded-xl border border-white/20 bg-white/35 p-2 transition-all duration-200 sm:h-60 dark:border-white/10 dark:bg-white/5"
            onMouseEnter={() => setIsWeeklyInteractive(true)}
            onMouseLeave={() => setIsWeeklyInteractive(false)}
            onTouchStart={() => setIsWeeklyInteractive(true)}
            onTouchEnd={() => setIsWeeklyInteractive(false)}
          >
            {weeklyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData}>
                  <defs>
                    <linearGradient id="weeklyBars" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.5)" strokeOpacity={0.08} />
                  <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} width={28} axisLine={false} tickLine={false} />
                  <Tooltip content={<AqiChartTooltip />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
                  <Bar
                    dataKey="aqi"
                    radius={[10, 10, 0, 0]}
                    barSize={isWeeklyInteractive ? 24 : 22}
                    fill="url(#weeklyBars)"
                    animationDuration={850}
                  >
                    {weeklyChartData.map((entry, index) => {
                      const isPeak = weeklyPeakDay === entry.day
                      return (
                        <Cell
                          key={`weekly-cell-${entry.day}-${index}`}
                          fill={getAqiSeverityBarColor(entry.aqi, isPeak)}
                          opacity={isWeeklyInteractive && !isPeak ? 0.92 : 1}
                          stroke={isPeak ? "rgba(255,255,255,0.75)" : "transparent"}
                          strokeWidth={isPeak ? 1.3 : 0}
                        />
                      )
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/40 bg-white/20 text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                Weekly AQI data is unavailable.
              </div>
            )}
          </div>

          <p className="mt-2 rounded-lg bg-white/45 px-2.5 py-2 text-xs text-gray-700 dark:bg-white/10 dark:text-gray-200">
            {weeklyComparisonInsight}
          </p>
        </motion.article>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-6 sm:gap-4 md:gap-5 xl:grid-cols-[1fr_1fr]">
        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-white/40 bg-white/60 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.15)] ring-1 ring-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:p-4"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold text-gray-800 dark:text-white sm:text-base">Weather</h3>
              <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">Local atmospheric conditions</p>
            </div>
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
              {weatherUpdatedLabel}
            </span>
          </div>

          <div className="mb-3 rounded-xl border border-white/30 bg-linear-to-r from-blue-100/45 to-cyan-100/45 p-3 dark:border-white/10 dark:from-blue-500/15 dark:to-cyan-500/10 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Temp</p>
                <p className="mt-1 text-3xl font-bold leading-none text-gray-800 dark:text-white sm:text-4xl">{formatValue(weatherTemp)}<span className="ml-1 text-base align-top sm:text-lg">{typeof weatherTemp === "number" ? "deg C" : ""}</span></p>
                <p className="mt-2 inline-flex rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300">{weatherCondition ?? "--"}</p>
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
              <p className="mt-1 text-base font-bold text-gray-800 dark:text-white">{formatValue(weatherHumidity, "%")}</p>
            </div>
            <div className="rounded-xl bg-white/70 p-3 dark:bg-white/10">
              <div className="mb-2 inline-flex rounded-lg bg-cyan-100 p-2 dark:bg-cyan-500/20">
                <Wind className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Wind</p>
              <p className="mt-1 text-base font-bold text-gray-800 dark:text-white">{formatValue(weatherWindKmh, " km/h")}</p>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">AQI map for {city ?? "--"}</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              Live Map
            </span>
          </div>

          <div className="-mx-3 -mb-3 h-56 overflow-hidden rounded-b-2xl border-t border-white/30 bg-white/40 sm:-mx-4 sm:-mb-4 sm:h-72 dark:border-white/10 dark:bg-white/5">
            <MapView
              markers={mapMarker ? [mapMarker] : []}
              center={mapCenter}
              zoom={mapZoom}
              activeLayer="aqi"
              tileUrl={tileUrl}
              tileAttribution={tileAttribution}
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
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${healthGuidance?.priorityClasses ?? "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300"}`}>
              {healthGuidance?.priorityLabel ?? "--"}
            </span>
          </div>

          <div className="mb-3 rounded-xl border border-white/30 bg-white/70 p-3 dark:border-white/10 dark:bg-white/10 sm:p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
                AQI {formatValue(currentAqi)}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200">
                {aqiCategory}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{healthGuidance?.priorityNote ?? "AQI data is not available right now."}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {healthGuidance ? healthGuidance.cards.map((card) => (
              (() => {
                const meta = healthCardMeta[card.label as keyof typeof healthCardMeta]
                const Icon = meta?.Icon ?? ShieldCheck
                return (
                  <div
                    key={card.label}
                    className="group rounded-xl border border-white/30 bg-white/70 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/80 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${meta?.iconWrap ?? "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300"}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{card.label}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta?.actionChip ?? "bg-slate-50 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300"}`}>
                        {meta?.actionText ?? "Action"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{card.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{card.description}</p>
                  </div>
                )
              })()
            )) : (
              <div className="rounded-xl border border-dashed border-white/30 bg-white/60 p-3 text-sm text-gray-500 dark:border-white/10 dark:bg-white/10 dark:text-gray-300 sm:col-span-3">
                Health guidance is unavailable until AQI data is fetched.
              </div>
            )}
          </div>
        </motion.article>
      </div>
    </section>
  )
}
