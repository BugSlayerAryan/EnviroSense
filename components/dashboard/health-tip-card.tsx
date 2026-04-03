"use client"

import { useEffect, useState, type ComponentType } from "react"
import { motion } from "framer-motion"
import { HeartPulse, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react"
import { calculateEnvironmentScore, type EnvironmentalData, type ScoreResult } from "@/lib/environment-score-calculator"
import { EnvironmentScoreSkeleton } from "@/components/dashboard/loading-states"

type HealthTipCardProps = {
  city?: string
}

type HealthState = {
  title: string
  subtitle: string
  badge: string
  icon: ComponentType<{ className?: string }>
  gradient: string
  badgeClass: string
  actions: string[]
}

function getHealthState(score: number): HealthState {
  if (score >= 80) {
    return {
      title: "Excellent Conditions",
      subtitle: "Low immediate exposure risk",
      badge: "Low Risk",
      icon: ShieldCheck,
      gradient: "from-emerald-100/80 to-green-50/30 dark:from-emerald-500/15 dark:to-green-500/5",
      badgeClass:
        "border-emerald-300/50 bg-emerald-100/70 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200",
      actions: [
        "Keep windows open for natural ventilation.",
        "Outdoor activity is safe for most people.",
        "Maintain hydration and usual routines.",
      ],
    }
  }

  if (score >= 60) {
    return {
      title: "Moderate Conditions",
      subtitle: "Mild sensitivity possible",
      badge: "Moderate Risk",
      icon: HeartPulse,
      gradient: "from-amber-100/80 to-yellow-50/30 dark:from-amber-500/15 dark:to-yellow-500/5",
      badgeClass:
        "border-amber-300/50 bg-amber-100/70 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200",
      actions: [
        "Reduce prolonged outdoor exertion.",
        "Sensitive groups should wear a mask outdoors.",
        "Use indoor air circulation during peak traffic hours.",
      ],
    }
  }

  return {
    title: "Caution Advised",
    subtitle: "Elevated exposure risk",
    badge: "High Risk",
    icon: ShieldAlert,
    gradient: "from-rose-100/85 to-orange-50/30 dark:from-rose-500/15 dark:to-orange-500/5",
    badgeClass:
      "border-rose-300/50 bg-rose-100/70 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-200",
    actions: [
      "Limit outdoor exposure and avoid heavy activity.",
      "Keep windows closed and run an air purifier if available.",
      "Wear a high-filtration mask when outside.",
    ],
  }
}

export function HealthTipCard({ city }: HealthTipCardProps) {
  const [score, setScore] = useState<ScoreResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchScore = async () => {
      try {
        setLoading(true)

        const cityForApi = city?.trim() || "New Delhi, India"
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

        setScore(calculateEnvironmentScore(environmentalData))
      } catch {
        const defaultData: EnvironmentalData = {
          aqi: null,
          uv: null,
          temperature: null,
          humidity: null,
          windSpeed: null,
        }

        setScore(calculateEnvironmentScore(defaultData))
      } finally {
        setLoading(false)
      }
    }

    void fetchScore()
  }, [city])

  if (loading) {
    return <EnvironmentScoreSkeleton />
  }

  if (!score) {
    return <div className="glass-card p-4 text-center text-sm text-gray-500 dark:text-gray-400">Unable to load health tips</div>
  }

  const state = getHealthState(score.totalScore)
  const StateIcon = state.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.55 }}
      whileHover={{ y: -2 }}
      className="glass-card border border-white/40 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.1)] transition-all duration-200"
    >
      <div className={`pointer-events-none absolute inset-0 bg-linear-to-br ${state.gradient}`} />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full border border-white/50 bg-white/70 p-2 text-gray-700 shadow-sm dark:border-white/20 dark:bg-white/10 dark:text-gray-200">
              <StateIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Health Tip</h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{state.subtitle}</p>
            </div>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${state.badgeClass}`}>{state.badge}</span>
        </div>

        <div className="rounded-xl border border-white/50 bg-white/75 p-3 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-300" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{state.title}</p>
          </div>

          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {state.actions.map((action) => (
              <li key={action} className="flex items-start gap-2 leading-snug">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500/70 dark:bg-gray-300/80" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}
