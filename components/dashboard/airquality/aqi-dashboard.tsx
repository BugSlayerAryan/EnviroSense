"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Droplets,
  HeartPulse,
  MapPin,
  Minus,
  Sun,
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
import { fetchAqiData, fetchWeatherData } from "@/api/api"
import { useSearchParams } from "next/navigation"
import { AqiDashboardSkeleton } from "@/components/dashboard/loading-states"
import { useTheme } from "next-themes"
import type { CityMarker } from "@/components/dashboard/maps/types"

const MapView = dynamic(
  () => import("@/components/dashboard/maps/map-view").then((module) => module.MapView),
  { ssr: false },
)

type Pollutant = {
  key: string
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

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-white/40 bg-white/85 px-3 py-2 text-xs text-gray-700 backdrop-blur-md shadow-sm dark:border-white/10 dark:bg-[#020617]/90 dark:text-gray-200">
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-semibold text-gray-800 dark:text-white">AQI: {payload[0].value ?? "--"}</p>
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

function getBarWidthClass(value: number) {
  if (value >= 140) return "w-full"
  if (value >= 110) return "w-5/6"
  if (value >= 80) return "w-2/3"
  if (value >= 50) return "w-1/2"
  if (value >= 25) return "w-1/3"
  return "w-1/4"
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
  const [hourlyAqi, setHourlyAqi] = useState<HourlyPoint[]>([])
  const [weeklyAqi, setWeeklyAqi] = useState<TrendPoint[]>([])
  const [pollutantValues, setPollutantValues] = useState<PollutantValues | null>(null)
  const [previousPollutantValues, setPreviousPollutantValues] = useState<Partial<PollutantValues> | null>(null)
  const [weatherTemp, setWeatherTemp] = useState<number | null>(null)
  const [weatherCondition, setWeatherCondition] = useState<string | null>(null)
  const [weatherHumidity, setWeatherHumidity] = useState<number | null>(null)
  const [weatherWindKmh, setWeatherWindKmh] = useState<number | null>(null)
  const [weatherUpdatedAt, setWeatherUpdatedAt] = useState<Date | null>(null)
  const [timeNowMs, setTimeNowMs] = useState(Date.now())
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

  const weeklyChartData = useMemo(
    () => weeklyAqi.filter((point) => typeof point.aqi === "number") as Array<{ day: string; aqi: number }>,
    [weeklyAqi],
  )

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
        const weatherData = await fetchWeatherData(fetchCity)
        setWeatherTemp(typeof weatherData?.temp === "number" ? Math.round(weatherData.temp) : null)
        setWeatherHumidity(typeof weatherData?.humidity === "number" ? Math.round(weatherData.humidity) : null)
        setWeatherWindKmh(typeof weatherData?.windKmh === "number" ? Math.round(weatherData.windKmh) : null)
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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="mb-4 rounded-xl border border-white/50 bg-white/70 p-3 shadow-[0_14px_36px_rgba(15,23,42,0.12)] ring-1 ring-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:mb-5 sm:rounded-2xl sm:p-4 md:p-5 lg:mb-6 lg:p-6"
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
              className="mt-3 w-full rounded-lg bg-white/70 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:bg-white/80 dark:bg-white/10 dark:text-white sm:mt-4 sm:w-auto sm:rounded-xl sm:py-2"
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

                    <span
                      className={`absolute left-1/2 top-[calc(100%+4px)] h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-linear-to-br ${aqiPointerGlow} shadow-[0_5px_14px_rgba(15,23,42,0.18)]`}
                    />

                    <span
                      className={`absolute left-1/2 bottom-[calc(100%+10px)] -translate-x-1/2 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${aqiCategory === "Unhealthy" ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-300"}`}
                    >
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

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:gap-4 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={`pollutant-skeleton-${idx}`} />)
          : pollutants.map((item, index) => {
              const Icon = item.icon
              const TrendIcon = item.trend === "up" ? TrendingUp : item.trend === "down" ? TrendingDown : Minus
              const toneValue = typeof item.value === "number" ? item.value : 0

              return (
                <motion.article
                  key={item.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.04 * index }}
                  whileHover={{ y: -3 }}
                  className="rounded-lg border border-white/40 bg-white/60 p-2 shadow-[0_8px_32px_rgba(31,38,135,0.15)] ring-1 ring-white/30 backdrop-blur-xl transition-all duration-300 ease-in-out dark:border-white/10 dark:bg-white/10 dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:rounded-2xl sm:p-3 md:p-4"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`rounded-xl bg-linear-to-r p-2 shadow-sm ${getToneClasses(item.tone)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                        item.trend === "up"
                          ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300"
                          : item.trend === "down"
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300"
                      }`}
                    >
                      <TrendIcon className="h-3.5 w-3.5" />
                      {item.delta}
                    </div>
                  </div>

                  <p className="text-[10px] font-semibold uppercase tracking-tight text-gray-500 dark:text-gray-400 sm:text-xs sm:tracking-wide">{item.label}</p>
                  <div className="mt-1 flex items-end gap-1">
                    <p className="text-lg font-bold leading-none text-gray-800 dark:text-white sm:text-xl md:text-2xl">{formatValue(item.value)}</p>
                    <p className="pb-0.5 text-[9px] font-medium text-gray-500 dark:text-gray-400 sm:pb-1 sm:text-xs">{item.unit}</p>
                  </div>

                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/60 dark:bg-white/10">
                    <div className={`h-full rounded-full bg-linear-to-r ${getToneBarClasses(item.tone)} ${getBarWidthClass(toneValue)}`} />
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
          className="rounded-2xl border border-white/40 bg-white/60 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.15)] ring-1 ring-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:p-4"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold text-gray-800 dark:text-white sm:text-base">AQI Trend (Hourly)</h3>
              <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">Fine-grained variation for today</p>
            </div>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-semibold text-emerald-600 dark:bg-white/10 dark:text-emerald-300 sm:px-2.5 sm:py-1 sm:text-[11px]">
              Live
            </span>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-1.5 text-xs sm:gap-2">
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-[9px] text-gray-500 dark:text-gray-400 sm:text-[10px]">Peak</p>
              <p className="font-bold text-gray-800 dark:text-white">{formatValue(hourlyStats.peak)}</p>
            </div>
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Lowest</p>
              <p className="font-bold text-gray-800 dark:text-white">{formatValue(hourlyStats.lowest)}</p>
            </div>
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Avg</p>
              <p className="font-bold text-gray-800 dark:text-white">{formatValue(hourlyStats.avg)}</p>
            </div>
          </div>

          <div className="h-48 w-full rounded-xl border border-white/30 bg-white/40 p-2 sm:h-56 dark:border-white/10 dark:bg-white/5">
            {hourlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyChartData}>
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
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/40 bg-white/20 text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                Hourly AQI data is unavailable.
              </div>
            )}
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
              <h3 className="text-xs font-semibold text-gray-800 dark:text-white sm:text-base">AQI Trend (Weekly)</h3>
              <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">7-day city-level trend</p>
            </div>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-semibold text-blue-600 dark:bg-white/10 dark:text-blue-300 sm:px-2.5 sm:py-1 sm:text-[11px]">
              7 Days
            </span>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-1.5 text-xs sm:gap-2">
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Highest</p>
              <p className="font-bold text-gray-800 dark:text-white">{formatValue(weeklyStats.highest)}</p>
            </div>
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Lowest</p>
              <p className="font-bold text-gray-800 dark:text-white">{formatValue(weeklyStats.lowest)}</p>
            </div>
            <div className="rounded-lg bg-white/70 px-2.5 py-2 text-center dark:bg-white/10">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Weekly Avg</p>
              <p className="font-bold text-gray-800 dark:text-white">{formatValue(weeklyStats.avg)}</p>
            </div>
          </div>

          <div className="h-48 w-full rounded-xl border border-white/30 bg-white/40 p-2 sm:h-56 dark:border-white/10 dark:bg-white/5">
            {weeklyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData}>
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
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/40 bg-white/20 text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                Weekly AQI data is unavailable.
              </div>
            )}
          </div>
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
