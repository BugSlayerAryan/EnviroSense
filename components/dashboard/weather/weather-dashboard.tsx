"use client"

import dynamic from "next/dynamic"
import { type ComponentType, useEffect, useMemo, useState } from "react"
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
  RefreshCw,
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
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { fetchUvData, fetchWeatherData } from "@/api/api"
import { WeeklyForecast } from "@/components/dashboard/weather/weekly-forecast"
import type { WeeklyForecastDay } from "@/components/dashboard/weather/utils"
import { useSearchParams } from "next/navigation"
import { WeatherDashboardSkeleton } from "@/components/dashboard/loading-states"
import { useTheme } from "next-themes"
import type { CityMarker } from "@/components/dashboard/maps/types"

const MapView = dynamic(
  () => import("@/components/dashboard/maps/map-view").then((module) => module.MapView),
  { ssr: false },
)

type HourlyForecast = {
  time: string
  temp: number
  icon: "sunny" | "cloudy" | "rain"
  humidity: number
  rainChance: number
  rainMm?: number
}

type WeatherDetail = {
  label: string
  value: string
  icon: ComponentType<{ className?: string }>
  tone: "blue" | "green" | "amber" | "violet"
}

const fallbackHourlyForecast: HourlyForecast[] = []

const fallbackWeeklyForecast: WeeklyForecastDay[] = []

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

function formatMinutesAgo(updatedAt: Date | null, nowMs: number) {
  if (!updatedAt) return "Updating..."
  const elapsedMinutes = Math.max(0, Math.floor((nowMs - updatedAt.getTime()) / 60000))
  if (elapsedMinutes === 0) return "Updated just now"
  return `Updated ${elapsedMinutes}m ago`
}

function getUvLevelLabel(uv: number) {
  if (uv <= 2) return "Low"
  if (uv <= 5) return "Moderate"
  if (uv <= 7) return "High"
  if (uv <= 10) return "Very High"
  return "Extreme"
}

function LoadingCard() {
  return <div className="h-24 animate-pulse rounded-2xl bg-white/50 dark:bg-white/10" />
}

function getRainIntensityLabel(rainMm: number) {
  if (rainMm >= 12) return "Heavy"
  if (rainMm >= 4) return "Moderate"
  return "Light"
}

function formatValue(value: number | null, unit = "") {
  return typeof value === "number" ? `${value}${unit}` : "--"
}

function formatText(value: string | null) {
  return value ?? "--"
}

function formatRainIntensity(rainMm: number | null) {
  return typeof rainMm === "number" ? getRainIntensityLabel(rainMm) : "--"
}

function parseClockTime(value: string | null) {
  if (!value) return null
  const trimmed = value.trim()
  const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i)
  if (!match) return null

  let hour = Number(match[1])
  const minute = Number(match[2] ?? 0)
  const meridiem = match[3]?.toUpperCase() ?? null

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  if (meridiem === "PM" && hour < 12) hour += 12
  if (meridiem === "AM" && hour === 12) hour = 0

  return hour * 60 + minute
}

function parseDaylightHours(value: string | null) {
  if (!value) return null
  const match = value.match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const hours = Number(match[1])
  if (!Number.isFinite(hours)) return null
  return hours
}

function getWeatherHeroTone(temperature: number | null, condition: string | null) {
  const value = condition?.toLowerCase() ?? ""

  if (value.includes("rain") || value.includes("shower")) {
    return {
      panel: "from-sky-100/70 via-cyan-50/40 to-blue-100/45 dark:from-sky-500/20 dark:via-cyan-500/10 dark:to-blue-500/8",
      badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
      accent: "text-sky-700 dark:text-sky-300",
    }
  }

  if (value.includes("cloud") || value.includes("haze")) {
    return {
      panel: "from-slate-100/70 via-slate-50/45 to-cyan-100/35 dark:from-slate-500/20 dark:via-slate-500/10 dark:to-cyan-500/8",
      badge: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200",
      accent: "text-slate-700 dark:text-slate-200",
    }
  }

  if (typeof temperature === "number" && temperature >= 32) {
    return {
      panel: "from-amber-100/75 via-orange-50/40 to-rose-100/35 dark:from-amber-500/20 dark:via-orange-500/10 dark:to-rose-500/8",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
      accent: "text-amber-700 dark:text-amber-300",
    }
  }

  return {
    panel: "from-sky-100/65 via-emerald-50/40 to-cyan-100/35 dark:from-sky-500/18 dark:via-emerald-500/10 dark:to-cyan-500/8",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    accent: "text-sky-700 dark:text-sky-300",
  }
}

function getWeatherInsight(temperature: number | null, humidity: number | null, windKmh: number | null, uvIndex: number | null, rainChance: number | null) {
  const firstLine = typeof humidity === "number" && humidity >= 75
    ? "High humidity — feels warmer"
    : typeof temperature === "number" && temperature >= 30
      ? "Warm weather — stay hydrated"
      : typeof temperature === "number" && temperature <= 18
        ? "Cooler air — feels crisp"
        : "Comfortable weather — easy to be outside"

  const secondLine = typeof rainChance === "number" && rainChance >= 40
    ? "Carry an umbrella if you are heading out"
    : typeof uvIndex === "number" && uvIndex >= 6
      ? "Good for short outdoor trips, avoid harsh sun"
      : typeof windKmh === "number" && windKmh >= 20
        ? "Good for short outdoor trips, lighter layers help"
        : "Good for short outdoor trips"

  return [firstLine, secondLine]
}

function getWeatherSummary(temperature: number | null, humidity: number | null, windKmh: number | null, conditionText: string | null) {
  if (typeof humidity === "number" && humidity >= 75) {
    return "Comfortable conditions with higher humidity and a warmer feel."
  }

  if (typeof windKmh === "number" && windKmh <= 10 && typeof temperature === "number" && temperature >= 24) {
    return `Comfortable conditions with moderate humidity and low wind.`
  }

  if (typeof temperature === "number" && temperature <= 18) {
    return "Cooler conditions with a crisp, calm feel."
  }

  if (conditionText?.toLowerCase().includes("rain")) {
    return "Rainy conditions with steady moisture in the air."
  }

  return "Comfortable conditions with moderate humidity and low wind."
}

function getPrecipitationStory(day: string | null, probability: number | null) {
  if (!day || typeof probability !== "number") return "Rain outlook is still building with live data."
  if (probability >= 70) return `Rain likely on ${day} with peak intensity.`
  if (probability >= 40) return `Rain possible on ${day}, so plan for changing conditions.`
  return `Light rain chance on ${day}, mostly manageable outdoors.`
}

function getDaylightProgress(sunriseText: string | null, sunsetText: string | null, daylightText: string | null, nowMs: number) {
  const sunriseMinutes = parseClockTime(sunriseText)
  const sunsetMinutes = parseClockTime(sunsetText)
  if (sunriseMinutes === null || sunsetMinutes === null || sunsetMinutes <= sunriseMinutes) {
    return {
      progress: 50,
      daylightLabel: daylightText ?? "--",
    }
  }

  const now = new Date(nowMs)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const progress = Math.min(100, Math.max(0, ((nowMinutes - sunriseMinutes) / (sunsetMinutes - sunriseMinutes)) * 100))

  return {
    progress,
    daylightLabel: daylightText ?? "--",
  }
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name?: string; payload?: { rainMm?: number; probability?: number } }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const rainMm = payload.find((item) => item.name === "rainMm")?.value ?? payload[0]?.payload?.rainMm
  const probability = payload.find((item) => item.name === "probability")?.value ?? payload[0]?.payload?.probability

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 text-xs text-slate-700 shadow-lg backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200">
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Day</p>
      <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-50">{label}</p>
      <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">Rain: {typeof rainMm === "number" ? rainMm.toFixed(1) : "0.0"} mm</p>
      {probability !== undefined ? <p className="text-[11px] text-sky-700 dark:text-sky-300">Probability: {probability}%</p> : null}
    </div>
  )
}

type WeatherDashboardProps = {
  initialCity?: string
}

export function WeatherDashboard({ initialCity }: WeatherDashboardProps) {
  const searchParams = useSearchParams()
  const { resolvedTheme } = useTheme()
  const cityQuery = initialCity ?? searchParams.get("city") ?? "New Delhi, India"
  const [location, setLocation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [temperature, setTemperature] = useState<number | null>(null)
  const [feelsLike, setFeelsLike] = useState<number | null>(null)
  const [conditionText, setConditionText] = useState<string | null>(null)
  const [weatherUpdatedAt, setWeatherUpdatedAt] = useState<Date | null>(null)
  const [nowMs, setNowMs] = useState(Date.now())
  const [hourlyData, setHourlyData] = useState<HourlyForecast[]>(fallbackHourlyForecast)
  const [weeklyData, setWeeklyData] = useState<WeeklyForecastDay[]>(fallbackWeeklyForecast)
  const [humidity, setHumidity] = useState<number | null>(null)
  const [windKmh, setWindKmh] = useState<number | null>(null)
  const [currentRainChance, setCurrentRainChance] = useState<number | null>(null)
  const [pressure, setPressure] = useState<number | null>(null)
  const [visibilityKm, setVisibilityKm] = useState<number | null>(null)
  const [dewPoint, setDewPoint] = useState<number | null>(null)
  const [uvIndex, setUvIndex] = useState<number | null>(null)
  const [sunriseText, setSunriseText] = useState<string | null>(null)
  const [sunsetText, setSunsetText] = useState<string | null>(null)
  const [daylightText, setDaylightText] = useState<string | null>(null)
  const [moonPhaseLabel, setMoonPhaseLabel] = useState<string | null>(null)
  const [moonIllumination, setMoonIllumination] = useState<number | null>(null)
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

  const precipitationSeries = useMemo(
    () => weeklyData.slice(0, 7).map((item) => {
      const probability = Math.min(100, Math.max(0, Math.round(item.rain)))
      return {
        day: item.day,
        probability,
        rainMm: typeof item.rainMm === "number" ? item.rainMm : 0,
      }
    }),
    [weeklyData],
  )

  const averageRainChance = useMemo(() => {
    if (!precipitationSeries.length) return 0
    const total = precipitationSeries.reduce((sum, item) => sum + item.probability, 0)
    return Math.round(total / precipitationSeries.length)
  }, [precipitationSeries])

  const averageRainChanceLabel = precipitationSeries.length > 0 ? `${averageRainChance}%` : "--"

  const conditionSnapshot = useMemo(
    () => [
      { label: "Humidity", value: formatValue(humidity, "%"), icon: Droplets, color: "text-sky-600 dark:text-sky-300" },
      { label: "Wind", value: formatValue(windKmh, " km/h"), icon: Wind, color: "text-cyan-600 dark:text-cyan-300" },
      { label: "Rainfall", value: formatValue(currentRainChance, "%"), icon: CloudRain, color: "text-blue-600 dark:text-blue-300" },
      { label: "UV", value: typeof uvIndex === "number" ? `${uvIndex} ${getUvLevelLabel(uvIndex)}` : "--", icon: Sun, color: "text-amber-600 dark:text-amber-300" },
    ],
    [currentRainChance, humidity, uvIndex, windKmh],
  )

  const weatherDetails = useMemo(
    () => [
      { label: "Humidity", value: formatValue(humidity, "%"), icon: Droplets, tone: "blue" as const },
      { label: "Wind Speed", value: formatValue(windKmh, " km/h"), icon: Wind, tone: "blue" as const },
      { label: "Pressure", value: formatValue(pressure, " hPa"), icon: Gauge, tone: "violet" as const },
      { label: "UV Index", value: typeof uvIndex === "number" ? `${uvIndex} (${getUvLevelLabel(uvIndex)})` : "--", icon: Sun, tone: "amber" as const },
      { label: "Visibility", value: formatValue(visibilityKm, " km"), icon: Eye, tone: "green" as const },
      { label: "Dew Point", value: formatValue(dewPoint, " deg C"), icon: ThermometerSun, tone: "amber" as const },
    ],
    [dewPoint, humidity, pressure, uvIndex, visibilityKm, windKmh],
  )

  const peakPrecipitation = useMemo(() => {
    if (!precipitationSeries.length) {
      return { day: "--", probability: null as number | null, rainMm: null as number | null }
    }

    return precipitationSeries.reduce((peak, item) => {
      if (item.probability > peak.probability) return item
      return peak
    }, precipitationSeries[0])
  }, [precipitationSeries])

  const forecastDayCount = precipitationSeries.length

  const maxRainMm = useMemo(() => {
    if (!precipitationSeries.length) return 1
    return Math.max(1, ...precipitationSeries.map((item) => item.rainMm))
  }, [precipitationSeries])

  const handleRefresh = async (requestedCity?: string) => {
    setHasError(false)
    setIsLoading(true)
    try {
      const selectedCity = requestedCity ?? location ?? cityQuery
      const [weatherData, uvData] = await Promise.all([fetchWeatherData(selectedCity), fetchUvData(selectedCity)])

      setTemperature(typeof weatherData?.temp === "number" ? Math.round(weatherData.temp) : null)
      setFeelsLike(typeof weatherData?.feelsLike === "number" ? Math.round(weatherData.feelsLike) : null)
      setConditionText(typeof weatherData?.condition === "string" ? weatherData.condition : typeof weatherData?.description === "string" ? weatherData.description : null)
      if (weatherData?.city) {
        setLocation(weatherData?.country ? `${weatherData.city}, ${weatherData.country}` : weatherData.city)
      } else {
        setLocation(null)
      }

      setHourlyData(Array.isArray(weatherData?.hourly) ? weatherData.hourly : [])
      setWeeklyData(Array.isArray(weatherData?.daily) ? weatherData.daily : [])

      setHumidity(typeof weatherData?.humidity === "number" ? Math.round(weatherData.humidity) : null)
      setWindKmh(typeof weatherData?.windKmh === "number" ? Math.round(weatherData.windKmh) : null)
      if (typeof weatherData?.currentRainChance === "number") {
        setCurrentRainChance(Math.min(100, Math.max(0, Math.round(weatherData.currentRainChance))))
      } else if (Array.isArray(weatherData?.hourly) && weatherData.hourly.length > 0 && typeof weatherData.hourly[0]?.rainChance === "number") {
        setCurrentRainChance(Math.min(100, Math.max(0, Math.round(weatherData.hourly[0].rainChance))))
      } else {
        setCurrentRainChance(null)
      }
      setPressure(typeof weatherData?.pressure === "number" ? Math.round(weatherData.pressure) : null)
      setVisibilityKm(typeof weatherData?.visibilityKm === "number" ? Number(weatherData.visibilityKm) : null)
      if (typeof weatherData?.temp === "number" && typeof weatherData?.humidity === "number") {
        const temp = Math.round(weatherData.temp)
        const humidityValue = Math.round(weatherData.humidity)
        const a = 17.27
        const b = 237.7
        const alpha = ((a * temp) / (b + temp)) + Math.log(Math.max(humidityValue, 1) / 100)
        setDewPoint(Math.round((b * alpha) / (a - alpha)))
      } else {
        setDewPoint(null)
      }
      setUvIndex(typeof uvData?.currentUv === "number" ? Math.round(uvData.currentUv) : null)

      const lat = typeof weatherData?.coord?.lat === "number" && Number.isFinite(weatherData.coord.lat) ? weatherData.coord.lat : null
      const lon = typeof weatherData?.coord?.lon === "number" && Number.isFinite(weatherData.coord.lon) ? weatherData.coord.lon : null
      if (typeof lat === "number" && typeof lon === "number") {
        const markerCity = typeof weatherData?.city === "string" ? weatherData.city : selectedCity
        const markerCountry = typeof weatherData?.country === "string" ? weatherData.country : ""

        setMapCenter([lat, lon])
        setMapZoom(11)
        setMapMarker({
          id: "weather-searched-city",
          city: markerCity,
          country: markerCountry,
          lat,
          lng: lon,
          isCurrentLocation: true,
          data: {
            aqi: 0,
            temperature: typeof weatherData?.temp === "number" ? Math.round(weatherData.temp) : 0,
            uv: typeof uvData?.currentUv === "number" ? Math.round(uvData.currentUv) : 0,
          },
        })
      }

      if (weatherData?.astronomy) {
        setSunriseText(typeof weatherData.astronomy.sunrise === "string" ? weatherData.astronomy.sunrise : null)
        setSunsetText(typeof weatherData.astronomy.sunset === "string" ? weatherData.astronomy.sunset : null)
        setDaylightText(typeof weatherData.astronomy.daylightHours === "string" ? weatherData.astronomy.daylightHours : null)
        setMoonPhaseLabel(typeof weatherData.astronomy.moonPhaseLabel === "string" ? weatherData.astronomy.moonPhaseLabel : null)
        setMoonIllumination(typeof weatherData.astronomy.moonIllumination === "number" ? weatherData.astronomy.moonIllumination : null)
      } else {
        setSunriseText(null)
        setSunsetText(null)
        setDaylightText(null)
        setMoonPhaseLabel(null)
        setMoonIllumination(null)
      }

      setWeatherUpdatedAt(new Date())
    } catch {
      setHasError(true)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    void handleRefresh(cityQuery)
  }, [cityQuery])

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNowMs(Date.now())
    }, 60000)
    return () => window.clearInterval(timerId)
  }, [])

  useEffect(() => {
    const refreshId = window.setInterval(() => {
      void handleRefresh(cityQuery)
    }, 180000)
    return () => window.clearInterval(refreshId)
  }, [cityQuery])

  const weatherUpdatedLabel = formatMinutesAgo(weatherUpdatedAt, nowMs)
  const weatherHeroTone = useMemo(() => getWeatherHeroTone(temperature, conditionText), [conditionText, temperature])
  const weatherInsight = useMemo(
    () => getWeatherInsight(temperature, humidity, windKmh, uvIndex, currentRainChance),
    [currentRainChance, humidity, temperature, uvIndex, windKmh],
  )
  const weatherSummary = useMemo(
    () => getWeatherSummary(temperature, humidity, windKmh, conditionText),
    [conditionText, humidity, temperature, windKmh],
  )
  const precipitationStory = useMemo(
    () => getPrecipitationStory(peakPrecipitation.day, peakPrecipitation.probability),
    [peakPrecipitation.day, peakPrecipitation.probability],
  )
  const daylightTimeline = useMemo(
    () => getDaylightProgress(sunriseText, sunsetText, daylightText, nowMs),
    [daylightText, nowMs, sunriseText, sunsetText],
  )

  if (isLoading) {
    return (
      <section className="dashboard-scroll flex-1 overflow-y-auto px-3 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
        <WeatherDashboardSkeleton />
      </section>
    )
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03, duration: 0.3 }}
        className="relative mb-4 overflow-hidden rounded-3xl border border-white/15 bg-white/25 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-lg md:hidden dark:border-white/10 dark:bg-white/10"
      >
        <div className={`pointer-events-none absolute inset-0 bg-linear-to-br ${weatherHeroTone.panel}`} />
        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{formatText(location)}</span>
                <span className="rounded-full border border-white/30 bg-white/55 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                  Live
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="relative inline-flex items-center">
                  <span className={`pointer-events-none absolute inset-x-2 top-3 h-8 rounded-full bg-linear-to-r ${weatherHeroTone.panel} blur-2xl opacity-70`} />
                  <p className="relative text-6xl font-bold leading-none tracking-[-0.05em] text-slate-900 dark:text-white">
                    {typeof temperature === "number" ? temperature : "--"}°C
                  </p>
                </div>
                <p className={`text-sm font-semibold ${weatherHeroTone.accent}`}>
                  {formatText(conditionText)} • Feels like {typeof feelsLike === "number" ? `${feelsLike}°C` : "--"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/45 text-slate-700 shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] dark:border-white/10 dark:bg-white/10 dark:text-slate-100"
              aria-label="Refresh weather data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs opacity-70 dark:opacity-70">
            <span className="inline-flex items-center gap-1">
              <Sun className="h-3 w-3" />
              {weatherUpdatedLabel}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <ThermometerSun className="h-3 w-3" />
              {typeof pressure === "number" ? `${pressure} hPa` : "-- hPa"}
            </span>
          </div>

          <div className="border-l-2 border-blue-300 pl-3 text-xs font-medium leading-relaxed text-slate-700 dark:border-blue-400 dark:text-slate-200">
            <p>{weatherInsight[0]}</p>
            <p className="mt-0.5">{weatherInsight[1]}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {conditionSnapshot.map((item) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={`mobile-${item.label}`}
                  whileTap={{ scale: 1.02 }}
                  whileHover={{ scale: 1.02 }}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 shadow-[0_4px_14px_rgba(15,23,42,0.035)] backdrop-blur-md transition-all duration-200 dark:border-white/10 dark:bg-white/10"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">{item.label}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{item.value}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04, duration: 0.35 }}
        className="relative mb-6 hidden overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_20px_60px_rgba(14,116,144,0.12)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/60 sm:p-6 md:block"
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
              {formatText(location)}
            </div>

            <h2 className="text-5xl font-black leading-none text-slate-900 dark:text-slate-50 sm:text-6xl">
              {typeof temperature === "number" ? temperature : "--"} <span className="text-3xl sm:text-4xl">deg</span>
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300 sm:text-base">
              Feels like {typeof feelsLike === "number" ? `${feelsLike} deg C` : "--"}
            </p>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300">
              <CloudSun className="h-4 w-4" />
              {formatText(conditionText)}
            </div>

            <p className="mt-3 max-w-xl text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
              Warm and slightly hazy conditions throughout the afternoon. Carry hydration and avoid prolonged exposure in direct sunlight.
            </p>

            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 sm:w-auto"
            >
              {isLoading ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/90 backdrop-blur-xl dark:border-slate-600/70 dark:bg-slate-800/85 dark:ring-slate-600/60 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-2">
              <p className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">Condition Snapshot</p>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-300">
                {weatherUpdatedLabel}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {conditionSnapshot.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 dark:border-slate-600 dark:bg-slate-900/90">
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
          <p className="inline-flex w-fit items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300">
            Next 24 hours
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {Array.from({ length: 8 }).map((_, idx) => (
              <LoadingCard key={`hourly-skeleton-${idx}`} />
            ))}
          </div>
        ) : (
          <div className="dashboard-scroll flex gap-3 overflow-x-auto pb-1">
            {hourlyData.length > 0 ? (
              hourlyData.map((item, index) => (
              <motion.article
                key={`${item.time}-${index}`}
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
                <p className="mt-1 text-[11px] font-medium text-sky-700 dark:text-sky-300">Humidity {item.humidity}%</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(Math.max(item.humidity, 0), 100)}%` }}
                    transition={{ duration: 0.6, delay: 0.05 * index }}
                    className="h-full rounded-full bg-linear-to-r from-sky-500 to-blue-600"
                  />
                </div>
              </motion.article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                Hourly weather data is unavailable.
              </div>
            )}
          </div>
        )}
      </div>

      <WeeklyForecast
        title="7-Day Forecast"
        subtitle="Daily min/max temperatures and conditions from OpenWeather"
        data={weeklyData}
        loading={isLoading}
        error={hasError ? "Unable to load weekly forecast." : null}
        onRetry={handleRefresh}
      />

      <div className="mb-6 space-y-4 md:hidden">
        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          whileHover={{ y: -1 }}
          className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md shadow-sm"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Weather Summary</p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200">{weatherSummary}</p>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.03 }}
          whileHover={{ y: -1 }}
          className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Weather Details</p>
              <p className="mt-1 text-xs text-slate-500/90 dark:text-slate-300/90">Live atmospheric signals</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300">{weatherUpdatedLabel}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {weatherDetails.map((detail) => {
              const Icon = detail.icon
              return (
                <motion.div
                  key={`mobile-detail-${detail.label}`}
                  whileTap={{ scale: 1.02 }}
                  whileHover={{ scale: 1.02 }}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 shadow-sm transition-all duration-200 backdrop-blur-md"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">{detail.label}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{detail.value}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.06 }}
          whileHover={{ y: -1 }}
          className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md shadow-sm"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Precipitation</p>
              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-200">{precipitationStory}</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300">{averageRainChanceLabel}</span>
          </div>

          <div className="mt-3 h-52 rounded-2xl border border-white/10 bg-white/10 p-2 backdrop-blur-md">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={precipitationSeries}>
                <defs>
                  <linearGradient id="precipLineGradientMobile" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="precipFillGradientMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" strokeOpacity={0.08} />
                <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="chance" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={22} />
                <YAxis yAxisId="rain" orientation="right" domain={[0, Math.ceil(maxRainMm)]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={22} />
                <Tooltip content={<ChartTooltip />} />
                <Area yAxisId="chance" type="monotone" dataKey="probability" stroke="none" fill="url(#precipFillGradientMobile)" />
                <Line
                  yAxisId="rain"
                  type="monotone"
                  dataKey="rainMm"
                  stroke="url(#precipLineGradientMobile)"
                  strokeWidth={3}
                  dot={(props: any) => {
                    const isPeak = props?.payload?.day === peakPrecipitation.day
                    return (
                      <g key={`rain-dot-${props?.cx}-${props?.cy}-${props?.payload?.day}`}>
                        {isPeak ? <circle cx={props.cx} cy={props.cy} r={8} fill="rgba(59,130,246,0.16)" /> : null}
                        <circle cx={props.cx} cy={props.cy} r={isPeak ? 4.5 : 2.8} fill="#fff" stroke={isPeak ? "#2563eb" : "#60a5fa"} strokeWidth={1.5} />
                        {isPeak ? <text x={props.cx} y={props.cy - 12} textAnchor="middle" className="fill-sky-700 text-[10px] font-semibold dark:fill-sky-300">Peak</text> : null}
                      </g>
                    )
                  }}
                  activeDot={{ r: 5.5, fill: "#fff", stroke: "#2563eb", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.09 }}
          whileHover={{ y: -1 }}
          className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Sun & Moon</p>
              <p className="mt-1 text-xs text-slate-500/90 dark:text-slate-300/90">Daylight {daylightTimeline.daylightLabel}</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-300">Secondary</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Sunrise className="h-4 w-4 text-amber-500" />
            <span>{formatText(sunriseText)}</span>
            <div className="h-px flex-1 bg-white/20" />
            <Sunset className="h-4 w-4 text-orange-500" />
            <span>{formatText(sunsetText)}</span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${daylightTimeline.progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full rounded-full bg-linear-to-r from-amber-400 via-orange-400 to-violet-400"
            />
          </div>
        </motion.article>
      </div>

      <div className="mb-6 hidden grid-cols-1 gap-4 lg:grid-cols-2 md:grid">
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
              {weatherUpdatedLabel}
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
              <p className="text-xs text-slate-500 dark:text-slate-300">{forecastDayCount}-day rain probability and rainfall volume</p>
            </div>
            <div className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300">
              {averageRainChanceLabel} avg chance
            </div>
          </div>

          <div className="relative z-10 mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-200 bg-white/90 p-2.5 dark:border-slate-700 dark:bg-slate-800/80">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Peak Day</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{peakPrecipitation.day}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/90 p-2.5 dark:border-slate-700 dark:bg-slate-800/80">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Max Chance</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{formatValue(peakPrecipitation.probability, "%")}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/90 p-2.5 dark:border-slate-700 dark:bg-slate-800/80">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Intensity</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{formatRainIntensity(peakPrecipitation.rainMm)}</p>
            </div>
          </div>

          <div className="relative z-10 h-52 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-inner dark:border-slate-700 dark:bg-slate-800/65">
            <div className="mb-2 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-300">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-4 rounded-full bg-blue-500" />
                Rain (mm)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-4 rounded-full bg-sky-300" />
                Probability
              </span>
            </div>
            <ResponsiveContainer width="100%" height="88%">
              <LineChart data={precipitationSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
                <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="chance" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="rain" orientation="right" domain={[0, Math.ceil(maxRainMm)]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area yAxisId="chance" type="monotone" dataKey="probability" fill="#7dd3fc" fillOpacity={0.24} stroke="none" />
                <Line yAxisId="rain" type="monotone" dataKey="rainMm" stroke="#2563eb" strokeWidth={3} dot={{ r: 2.5 }} activeDot={{ r: 5 }} />
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
        className="relative mb-6 hidden overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_48px_rgba(14,116,144,0.12)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/50 md:block"
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
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-50">{formatText(sunriseText)}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <motion.div initial={{ width: 0 }} animate={{ width: "42%" }} transition={{ duration: 0.7 }} className="h-full rounded-full bg-linear-to-r from-amber-400 to-orange-500" />
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Golden hour starts soon after</p>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-800/85">
            <div className="mb-2 flex items-center justify-between">
              <Sunset className="h-5 w-5 text-orange-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Sun</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Sunset</p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-50">{formatText(sunsetText)}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <motion.div initial={{ width: 0 }} animate={{ width: "74%" }} transition={{ duration: 0.7, delay: 0.05 }} className="h-full rounded-full bg-linear-to-r from-orange-400 to-rose-500" />
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Approx daylight: {formatText(daylightText)}</p>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-800/85">
            <div className="mb-2 flex items-center justify-between">
              <MoonStar className="h-5 w-5 text-violet-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Moon</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Moon Phase</p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-50">{formatText(moonPhaseLabel)}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.max(typeof moonIllumination === "number" ? moonIllumination : 0, 0), 100)}%` }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="h-full rounded-full bg-linear-to-r from-violet-400 to-indigo-500"
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Illumination {formatValue(moonIllumination, "%")}</p>
          </motion.div>
        </div>
      </motion.article>

      <motion.article
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -2 }}
        className="hidden rounded-2xl border border-white/40 bg-white/60 p-4 shadow-[0_8px_32px_rgba(31,38,135,0.15)] ring-1 ring-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] md:block"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">Radar Map (Integration Ready)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Placeholder for weather radar or precipitation layers</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">Map Ready</span>
        </div>

        <div className="h-64 overflow-hidden rounded-xl border border-white/30 bg-white/40 sm:h-72 dark:border-white/10 dark:bg-white/5">
          <MapView
            markers={mapMarker ? [mapMarker] : []}
            center={mapCenter}
            zoom={mapZoom}
            activeLayer="weather"
            tileUrl={tileUrl}
            tileAttribution={tileAttribution}
          />
        </div>
      </motion.article>
    </section>
  )
}
