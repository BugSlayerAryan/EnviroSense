"use client"

import { HeartPulse } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { calculateEnvironmentScore, type EnvironmentalData } from "@/lib/environment-score-calculator"

type HealthTipCardProps = {
  city?: string
}

function getTipTone(score: number | null) {
  if (typeof score !== "number") {
    return {
      chipClass: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
      iconWrapClass: "bg-blue-100 dark:bg-blue-500/20",
      iconClass: "text-blue-600 dark:text-blue-400",
    }
  }

  if (score >= 80) {
    return {
      chipClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
      iconWrapClass: "bg-emerald-100 dark:bg-emerald-500/20",
      iconClass: "text-emerald-600 dark:text-emerald-300",
    }
  }

  if (score >= 60) {
    return {
      chipClass: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
      iconWrapClass: "bg-green-100 dark:bg-green-500/20",
      iconClass: "text-green-600 dark:text-green-300",
    }
  }

  if (score >= 40) {
    return {
      chipClass: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
      iconWrapClass: "bg-amber-100 dark:bg-amber-500/20",
      iconClass: "text-amber-600 dark:text-amber-300",
    }
  }

  if (score >= 20) {
    return {
      chipClass: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
      iconWrapClass: "bg-orange-100 dark:bg-orange-500/20",
      iconClass: "text-orange-600 dark:text-orange-300",
    }
  }

  return {
    chipClass: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    iconWrapClass: "bg-red-100 dark:bg-red-500/20",
    iconClass: "text-red-600 dark:text-red-300",
  }
}

export function HealthTipCard({ city }: HealthTipCardProps) {
  const searchParams = useSearchParams()
  const activeCity = city ?? searchParams.get("city") ?? "New Delhi, India"
  const [scoreValue, setScoreValue] = useState<number | null>(null)
  const [scoreCategory, setScoreCategory] = useState<string>("Loading")
  const [tipText, setTipText] = useState("Loading health advice for current environmental conditions...")

  useEffect(() => {
    let cancelled = false

    const loadTip = async () => {
      try {
        const cityForApi = activeCity.trim() || "New Delhi, India"
        const [aqiRes, weatherRes, uvRes] = await Promise.all([
          fetch(`/api/live/aqi?city=${encodeURIComponent(cityForApi)}`),
          fetch(`/api/live/weather?city=${encodeURIComponent(cityForApi)}`),
          fetch(`/api/live/uv?city=${encodeURIComponent(cityForApi)}`),
        ])

        const [aqiData, weatherData, uvData] = await Promise.all([
          aqiRes.ok ? aqiRes.json() : Promise.resolve({}),
          weatherRes.ok ? weatherRes.json() : Promise.resolve({}),
          uvRes.ok ? uvRes.json() : Promise.resolve({}),
        ])

        if (cancelled) return

        const environmentalData: EnvironmentalData = {
          aqi: aqiData?.aqi ?? null,
          uv: uvData?.currentUv ?? null,
          temperature: weatherData?.temp ?? null,
          humidity: weatherData?.humidity ?? null,
          windSpeed: weatherData?.windKmh ? weatherData.windKmh / 3.6 : null,
          pollutants: {
            pm25: aqiData?.pollutants?.pm25 ?? null,
            pm10: aqiData?.pollutants?.pm10 ?? null,
            no2: aqiData?.pollutants?.no2 ?? null,
          },
        }

        const score = calculateEnvironmentScore(environmentalData)
        setScoreValue(score.totalScore)
        setScoreCategory(score.category)
        setTipText(score.recommendation)
      } catch {
        if (cancelled) return
        setScoreValue(null)
        setScoreCategory("Moderate")
        setTipText("Current air quality is elevated. Individuals with asthma, allergies, or heart conditions should limit outdoor activities and wear appropriate protection.")
      }
    }

    void loadTip()

    return () => {
      cancelled = true
    }
  }, [activeCity])

  const tone = useMemo(() => getTipTone(scoreValue), [scoreValue])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.5 }}
      whileHover={{ y: -1 }}
      className="glass-card relative overflow-hidden p-5 shadow-md transition-all duration-300 ease-in-out"
    >
      <div className="relative z-10 flex gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${tone.iconWrapClass}`}>
          <HeartPulse className={`h-6 w-6 ${tone.iconClass}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Health Tip</h3>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.chipClass}`}>
              {typeof scoreValue === "number" ? `${scoreCategory} (${scoreValue}/100)` : scoreCategory}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {tipText}
          </p>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-tl-3xl bg-linear-to-tl from-red-300/20 to-transparent blur-2xl dark:from-red-500/10" />
    </motion.div>
  )
}
