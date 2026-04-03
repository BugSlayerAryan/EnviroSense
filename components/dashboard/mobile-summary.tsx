"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useSearchParams } from "next/navigation"
import { Activity, CheckCircle2, CircleDot, Droplets, Gauge, MapPin, SunMedium, ThermometerSun, TriangleAlert, Wind } from "lucide-react"
import { fetchAqiData, fetchUvData, fetchWeatherData } from "@/api/api"
import { calculateEnvironmentScore, getAqiCategory } from "@/lib/environment-score-calculator"
import { cn } from "@/lib/utils"

type MobileSummaryProps = {
  city?: string
}

type Intel = {
  cityLabel: string
  score: number
  scoreCategory: string
  scoreColor: "green" | "yellow" | "orange" | "red" | "purple"
  shortRecommendation: string
  aqi: number | null
  aqiCategory: string
  temperature: number | null
  humidity: number | null
  windKmh: number | null
  uv: number | null
  pm25: number | null
  pm10: number | null
  source: string
  station: string
  updatedLabel: string
  insight: string
}

function oneLineRecommendation(score: number) {
  if (score >= 80) return "Excellent for normal outdoor activity"
  if (score >= 60) return "Good with basic precautions"
  if (score >= 40) return "Limit prolonged exposure"
  return "Avoid long outdoor exposure"
}

function insightFromAqi(aqi: number | null) {
  if (aqi === null) return "Live data is syncing"
  if (aqi <= 50) return "Good air quality"
  if (aqi <= 100) return "Safe for light outdoor activity"
  if (aqi <= 150) return "Sensitive groups should reduce exposure"
  return "Air quality is unhealthy"
}

function scoreColorClass(color: Intel["scoreColor"]) {
  switch (color) {
    case "green":
      return "text-emerald-600 dark:text-emerald-300"
    case "yellow":
      return "text-yellow-600 dark:text-yellow-300"
    case "orange":
      return "text-orange-600 dark:text-orange-300"
    case "red":
      return "text-red-600 dark:text-red-300"
    default:
      return "text-violet-600 dark:text-violet-300"
  }
}

function scoreTintClass(color: Intel["scoreColor"]) {
  switch (color) {
    case "green":
      return "from-emerald-200/45 to-emerald-50/20 dark:from-emerald-500/18 dark:to-emerald-400/6"
    case "yellow":
      return "from-yellow-200/50 to-amber-50/20 dark:from-yellow-500/18 dark:to-amber-400/6"
    case "orange":
      return "from-orange-200/50 to-amber-50/20 dark:from-orange-500/18 dark:to-amber-400/6"
    case "red":
      return "from-rose-200/50 to-orange-50/20 dark:from-rose-500/18 dark:to-orange-400/6"
    default:
      return "from-violet-200/45 to-indigo-50/20 dark:from-violet-500/16 dark:to-indigo-400/6"
  }
}

function getAqiTone(aqi: number | null) {
  if (aqi === null) {
    return {
      valueClass: "text-slate-700 dark:text-slate-200",
      badgeClass: "bg-slate-100/80 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
      tintClass: "from-slate-200/40 to-slate-50/20 dark:from-slate-500/15 dark:to-slate-400/5",
    }
  }
  if (aqi <= 50) {
    return {
      valueClass: "text-emerald-700 dark:text-emerald-300",
      badgeClass: "bg-emerald-100/85 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
      tintClass: "from-emerald-200/45 to-emerald-50/20 dark:from-emerald-500/18 dark:to-emerald-400/6",
    }
  }
  if (aqi <= 100) {
    return {
      valueClass: "text-yellow-700 dark:text-yellow-300",
      badgeClass: "bg-yellow-100/85 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
      tintClass: "from-yellow-200/45 to-amber-50/20 dark:from-yellow-500/18 dark:to-amber-400/6",
    }
  }
  if (aqi <= 150) {
    return {
      valueClass: "text-orange-700 dark:text-orange-300",
      badgeClass: "bg-orange-100/85 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
      tintClass: "from-orange-200/45 to-amber-50/20 dark:from-orange-500/18 dark:to-amber-400/6",
    }
  }
  return {
    valueClass: "text-rose-700 dark:text-rose-300",
    badgeClass: "bg-rose-100/85 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    tintClass: "from-rose-200/45 to-orange-50/20 dark:from-rose-500/18 dark:to-orange-400/6",
  }
}

function pollutantStatus(value: number | null) {
  if (value === null) {
    return {
      label: "Unknown",
      dotClass: "bg-slate-400",
      textClass: "text-slate-600 dark:text-slate-300",
    }
  }
  if (value <= 12) {
    return {
      label: "Good",
      dotClass: "bg-emerald-500",
      textClass: "text-emerald-700 dark:text-emerald-300",
    }
  }
  if (value <= 35) {
    return {
      label: "Moderate",
      dotClass: "bg-yellow-500",
      textClass: "text-yellow-700 dark:text-yellow-300",
    }
  }
  return {
    label: "Poor",
    dotClass: "bg-orange-500",
    textClass: "text-orange-700 dark:text-orange-300",
  }
}

function pollutantProgressClass(value: number | null) {
  if (value === null || value <= 0) return "w-0"
  if (value <= 12) return "w-1/4"
  if (value <= 35) return "w-2/4"
  if (value <= 55) return "w-3/4"
  return "w-full"
}

function getInsightLines(aqi: number | null) {
  if (aqi === null) {
    return {
      primary: "Live feed is syncing right now.",
      secondary: "Latest guidance will appear in a moment.",
    }
  }
  if (aqi <= 100) {
    return {
      primary: "Safe for light outdoor activity.",
      secondary: "Sensitive individuals can keep exposure moderate.",
    }
  }
  return {
    primary: "Air stress is elevated today.",
    secondary: "Sensitive individuals should reduce outdoor time.",
  }
}

function compactAqiCategory(category: string, aqi: number | null) {
  const normalized = category.trim().toLowerCase()

  if (normalized.includes("sensitive") || (typeof aqi === "number" && aqi > 100 && aqi <= 150)) {
    return "Sensitive"
  }
  if (normalized.includes("unhealthy")) return "Unhealthy"
  if (normalized.includes("moderate")) return "Moderate"
  if (normalized.includes("good")) return "Good"
  if (normalized.includes("hazardous")) return "Hazardous"
  if (normalized.includes("very")) return "Very High"
  return category.split(" ").slice(0, 2).join(" ")
}

function splitCityLabel(cityLabel: string) {
  const [cityPart, countryPart] = cityLabel.split(",").map((part) => part.trim())
  return {
    city: cityPart || cityLabel,
    country: countryPart || "",
  }
}

function normalizeSource(source: string) {
  if (!source.trim()) return "Unknown"
  if (source.toLowerCase().includes("waqi")) return "WAQI"
  if (source.toLowerCase().includes("open-meteo")) return "Open-Meteo"
  return source
}

function useMobileDashboardIntel(city?: string) {
  const searchParams = useSearchParams()
  const activeCity = useMemo(() => {
    const candidate = city ?? searchParams.get("city") ?? "New Delhi, India"
    return candidate.trim() || "New Delhi, India"
  }, [city, searchParams])

  const [intel, setIntel] = useState<Intel | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [aqiData, weatherData, uvData] = await Promise.all([
        fetchAqiData(activeCity),
        fetchWeatherData(activeCity),
        fetchUvData(activeCity),
      ])

      const aqi = typeof aqiData?.aqi === "number" ? aqiData.aqi : null
      const uv = typeof uvData?.currentUv === "number" ? Number(uvData.currentUv.toFixed(1)) : null
      const temperature = typeof weatherData?.temp === "number" ? Math.round(weatherData.temp) : null
      const humidity = typeof weatherData?.humidity === "number" ? Math.round(weatherData.humidity) : null
      const windKmh = typeof weatherData?.windKmh === "number" ? Math.round(weatherData.windKmh) : null
      const pm25 = typeof aqiData?.pollutants?.pm25 === "number" ? Number(aqiData.pollutants.pm25.toFixed(1)) : null
      const pm10 = typeof aqiData?.pollutants?.pm10 === "number" ? Number(aqiData.pollutants.pm10.toFixed(1)) : null

      const score = calculateEnvironmentScore({
        aqi,
        uv,
        temperature,
        humidity,
        windSpeed: windKmh === null ? null : Number((windKmh / 3.6).toFixed(2)),
        pollutants: { pm25, pm10, no2: null },
      })

      setIntel({
        cityLabel: activeCity,
        score: score.totalScore,
        scoreCategory: score.category,
        scoreColor: score.categoryColor,
        shortRecommendation: oneLineRecommendation(score.totalScore),
        aqi,
        aqiCategory: compactAqiCategory(getAqiCategory(aqi), aqi),
        temperature,
        humidity,
        windKmh,
        uv,
        pm25,
        pm10,
        source: typeof aqiData?.provider === "string" ? aqiData.provider : "WAQI",
        station: typeof aqiData?.city === "string" && aqiData.city.trim() ? aqiData.city : activeCity,
        updatedLabel: "Updated just now",
        insight: insightFromAqi(aqi),
      })
    } catch {
      setIntel({
        cityLabel: activeCity,
        score: 50,
        scoreCategory: "Moderate",
        scoreColor: "yellow",
        shortRecommendation: "Live feed reconnecting",
        aqi: null,
        aqiCategory: "Unknown",
        temperature: null,
        humidity: null,
        windKmh: null,
        uv: null,
        pm25: null,
        pm10: null,
        source: "WAQI",
        station: activeCity,
        updatedLabel: "Updated just now",
        insight: "Data unavailable",
      })
    } finally {
      setLoading(false)
    }
  }, [activeCity])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const id = window.setInterval(() => {
      void load()
    }, 300000)
    return () => window.clearInterval(id)
  }, [load])

  return { intel, loading }
}

function MetricPill({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/38 px-2.5 py-1.5 text-[11px] font-semibold text-gray-800 shadow-[0_4px_14px_rgba(0,0,0,0.06)] backdrop-blur-md transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-lg active:scale-[0.99] dark:bg-white/8 dark:text-gray-100 dark:border-white/10">
      <span className="inline-flex h-4 w-4 items-center justify-center">{icon}</span>
      <span>{value}</span>
    </div>
  )
}

function PollutantMiniCard({ label, value }: { label: string; value: number | null }) {
  const status = pollutantStatus(value)
  const progressClass = pollutantProgressClass(value)

  return (
    <article className="rounded-xl border border-white/20 bg-white/35 px-3 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-lg active:scale-[0.99] dark:bg-white/8 dark:border-white/10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-xl font-bold leading-none text-gray-900 dark:text-white">{value === null ? "--" : value.toFixed(1)}</p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">ug/m3</p>
      </div>
      <p className={cn("mt-1 inline-flex items-center gap-1 text-[11px] font-semibold", status.textClass)}>
        <span className={cn("h-1.5 w-1.5 rounded-full", status.dotClass)} />
        {status.label}
      </p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/55 dark:bg-white/10">
        <div className={cn("h-full rounded-full transition-all duration-300", status.dotClass, progressClass)} />
      </div>
    </article>
  )
}

function UnifiedSmartCard({ intel }: { intel: Intel }) {
  const scoreTint = scoreTintClass(intel.scoreColor)
  const aqiTone = getAqiTone(intel.aqi)
  const lines = getInsightLines(intel.aqi)
  const location = splitCityLabel(intel.cityLabel)
  const sourceLabel = normalizeSource(intel.source)

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileTap={{ scale: 0.995 }}
      className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/30 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-all duration-200 ease-out dark:bg-white/6 dark:border-white/12"
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-linear-to-br", scoreTint)} />
      <div className={cn("pointer-events-none absolute inset-0 bg-linear-to-tr opacity-55", aqiTone.tintClass)} />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/40 to-transparent" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/35 blur-2xl dark:bg-white/10" />

      <div className="relative space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[11px] font-semibold text-gray-700 dark:text-gray-200">
            <MapPin className="mr-1 inline h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
            {location.city}
            {location.country ? <span className="ml-1 opacity-70">{location.country}</span> : null}
          </p>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/50 px-2 py-0.5 text-[10px] font-semibold text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-gray-200">
            Smart Live
            <CircleDot className="h-2.5 w-2.5 animate-pulse text-rose-500 dark:text-rose-300" />
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/20 bg-white/35 px-3 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.05)] backdrop-blur-md dark:bg-white/8 dark:border-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">Environment</p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <p className={cn("text-3xl leading-none font-bold motion-safe:animate-pulse", scoreColorClass(intel.scoreColor))}>{intel.score}</p>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200">
                {intel.scoreCategory}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-white/20 bg-white/35 px-3 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.05)] backdrop-blur-md dark:bg-white/8 dark:border-white/10">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">AQI</p>
              <Gauge className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="mt-1 flex items-end justify-between gap-2">
              <p className={cn("text-2xl leading-none font-semibold motion-safe:animate-pulse", aqiTone.valueClass)}>{intel.aqi ?? "--"}</p>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", aqiTone.badgeClass)}>{intel.aqiCategory}</span>
            </div>
          </div>
        </div>

        <p className="truncate border-t border-white/20 pt-2 text-xs opacity-70 text-gray-700 dark:text-gray-300 dark:border-white/10">
          <span className="inline-flex items-center gap-1 text-rose-500 dark:text-rose-300">
            <CircleDot className="h-3 w-3 animate-pulse" /> Live
          </span>
          <span className="mx-1">•</span>{intel.updatedLabel}
          <span className="mx-1">•</span>{sourceLabel}
          <span className="mx-1">•</span>{intel.station} Station
        </p>

        <div className="flex flex-wrap gap-2">
          <MetricPill icon={<ThermometerSun className="h-3.5 w-3.5 text-rose-500 dark:text-rose-300" />} value={intel.temperature === null ? "--" : `${intel.temperature} C`} />
          <MetricPill icon={<Droplets className="h-3.5 w-3.5 text-blue-500 dark:text-blue-300" />} value={intel.humidity === null ? "--" : `${intel.humidity}%`} />
          <MetricPill icon={<Wind className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-300" />} value={intel.windKmh === null ? "--" : `${intel.windKmh} km/h`} />
          <MetricPill icon={<SunMedium className="h-3.5 w-3.5 text-amber-500 dark:text-amber-300" />} value={intel.uv === null ? "UV --" : `UV ${intel.uv.toFixed(1)}`} />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <PollutantMiniCard label="PM2.5" value={intel.pm25} />
          <PollutantMiniCard label="PM10" value={intel.pm10} />
        </div>

        <div className="rounded-xl border border-white/20 bg-linear-to-r from-sky-100/55 to-indigo-100/40 px-3 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:from-sky-500/15 dark:to-indigo-500/10">
          <p className="inline-flex items-center gap-1 text-xs font-semibold text-gray-800 dark:text-gray-100">
            <Activity className="h-3.5 w-3.5" /> Smart Insight
          </p>
          <p className="mt-1 line-clamp-1 text-xs text-gray-700 dark:text-gray-200">
            <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
            {lines.primary}
          </p>
          <p className="line-clamp-1 text-xs text-gray-700 dark:text-gray-200">
            <TriangleAlert className="mr-1 inline h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />
            {lines.secondary}
          </p>
        </div>
      </div>
    </motion.article>
  )
}

export function StickyHeader({ intel }: { intel: Intel | null }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const scrollRoot = document.querySelector(".dashboard-scroll") as HTMLElement | null
    if (!scrollRoot) return

    const onScroll = () => setVisible(scrollRoot.scrollTop > 90)
    onScroll()
    scrollRoot.addEventListener("scroll", onScroll, { passive: true })
    return () => scrollRoot.removeEventListener("scroll", onScroll)
  }, [])

  if (!intel || !visible) return null

  return (
    <div className="fixed left-4 right-4 top-18 z-30 rounded-full border border-white/55 bg-white/82 px-3 py-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 md:hidden">
      <div className="flex items-center justify-center gap-2.5 text-[11px] font-semibold text-gray-800 dark:text-white">
        <span>AQI {intel.aqi ?? "--"}</span>
        <span className="text-gray-400">|</span>
        <span className="inline-flex items-center gap-1"><ThermometerSun className="h-3 w-3 text-red-500 dark:text-red-300" />{intel.temperature === null ? "--" : `${intel.temperature}°C`}</span>
        <span className="text-gray-400">|</span>
        <span className="inline-flex items-center gap-1"><SunMedium className="h-3 w-3 text-yellow-500 dark:text-yellow-300" />UV {intel.uv === null ? "--" : intel.uv.toFixed(1)}</span>
      </div>
    </div>
  )
}

export function MobileSummary({ city }: MobileSummaryProps) {
  const { intel, loading } = useMobileDashboardIntel(city)

  if (loading || !intel) {
    return (
      <section className="grid gap-3 md:hidden">
        <div className="h-72 animate-pulse rounded-2xl border border-white/20 bg-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-white/6 dark:border-white/12" />
      </section>
    )
  }

  return (
    <section className="grid gap-3 md:hidden">
      <UnifiedSmartCard intel={intel} />
      <StickyHeader intel={intel} />
    </section>
  )
}
