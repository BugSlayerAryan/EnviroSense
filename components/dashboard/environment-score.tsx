"use client"

import { ShieldCheck, TrendingUp, MapPin, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { SemiCircleGauge } from "./gauge"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { calculateEnvironmentScore, type EnvironmentalData, type ScoreResult } from "@/lib/environment-score-calculator"
import { EnvironmentScoreSkeleton } from "@/components/dashboard/loading-states"

interface EnvironmentScoreProps {
  city?: string
}

function formatCityLabel(city: string) {
  return city.trim() || "Current location"
}

export function EnvironmentScore({ city }: EnvironmentScoreProps) {
  const searchParams = useSearchParams()
  const activeCity = city ?? searchParams.get("city") ?? "New Delhi, India"
  const cityLabel = formatCityLabel(activeCity)

  const [data, setData] = useState<EnvironmentalData | null>(null)
  const [score, setScore] = useState<ScoreResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showHealthTips, setShowHealthTips] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

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

        // Extract relevant fields
        const environmentalData: EnvironmentalData = {
          aqi: aqiData?.aqi ?? null,
          uv: uvData?.currentUv ?? null,
          temperature: weatherData?.temp ?? null,
          humidity: weatherData?.humidity ?? null,
          windSpeed: weatherData?.windKmh ? weatherData.windKmh / 3.6 : null, // Convert km/h to m/s
          pollutants: {
            pm25: aqiData?.pollutants?.pm25 ?? null,
            pm10: aqiData?.pollutants?.pm10 ?? null,
            no2: aqiData?.pollutants?.no2 ?? null,
          },
        }

        setData(environmentalData)
        const calculatedScore = calculateEnvironmentScore(environmentalData)
        setScore(calculatedScore)
      } catch (err) {
        console.error("Error fetching environment data:", err)
        setError("Failed to load environment data")
        // Fallback to default values
        const defaultData: EnvironmentalData = {
          aqi: null,
          uv: null,
          temperature: null,
          humidity: null,
          windSpeed: null,
        }
        setData(defaultData)
        setScore(calculateEnvironmentScore(defaultData))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeCity])

  if (loading) {
    return <EnvironmentScoreSkeleton />
  }

  if (!score) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="text-center text-gray-500">Unable to calculate environment score</div>
      </motion.div>
    )
  }

  const categoryColors: Record<string, string> = {
    green: "bg-green-200 text-green-700 dark:bg-green-500/20 dark:text-green-300",
    yellow: "bg-yellow-200 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
    orange: "bg-orange-200 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
    red: "bg-red-200 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    purple: "bg-purple-200 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  }

  const scoreColor: Record<ScoreResult["categoryColor"], string> = {
    green: "text-green-600 dark:text-emerald-300",
    yellow: "text-yellow-600 dark:text-yellow-300",
    orange: "text-orange-600 dark:text-orange-300",
    red: "text-red-600 dark:text-red-300",
    purple: "text-purple-600 dark:text-purple-300",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2 }}
      className="glass-card relative overflow-hidden p-0"
    >
      <div className="absolute inset-0 bg-linear-to-br from-white/20 via-transparent to-white/5 dark:from-white/5 dark:to-white/0" />

      <div className="relative z-10 grid grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:p-5">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">Environment Score</h2>
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                <MapPin className="h-3.5 w-3.5" />
                <span>{cityLabel}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Updated just now</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${categoryColors[score.categoryColor]}`}>
              {score.category}
            </span>
          </div>

          <div className="mb-2 flex items-end gap-2">
            <p className={`text-4xl font-bold leading-none sm:text-5xl ${scoreColor[score.categoryColor]}`}>
              {score.totalScore}
            </p>
            <p className="pb-1 text-xs font-medium text-gray-600 dark:text-gray-300">/ 100</p>
          </div>

          <p className="mb-2 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
            {score.recommendation}
          </p>

          <div className="mb-2 rounded-lg border border-white/40 bg-white/60 p-2 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-500 dark:text-emerald-300" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-800 dark:text-white">Recommendation:</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {score.totalScore >= 80
                    ? "Outdoor activities are safe for all individuals."
                    : score.totalScore >= 60
                      ? "Outdoor activities are safe with basic precautions."
                      : score.totalScore >= 40
                        ? "Sensitive groups should limit outdoor exposure."
                        : "Avoid extended outdoor activities."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              {score.trend.direction === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500 dark:text-emerald-300" />
              ) : (
                <TrendingUp className="h-3 w-3 rotate-180 text-red-500" />
              )}
              <span>
                {score.trend.direction === "up" ? "+" : "-"}
                {score.trend.change} points in 24h
              </span>
            </div>
          </div>

          {/* Health Tips Toggle */}
          <motion.div className="mt-2 border-t border-white/20 pt-2 dark:border-white/10">
            <button
              onClick={() => setShowHealthTips(!showHealthTips)}
              className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <AlertCircle className="h-4 w-4" />
              {showHealthTips ? "Hide" : "View"} Health Tips & Risk Groups
            </button>

            {showHealthTips && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.2 }}
                className="mt-2 space-y-2 border-t border-white/20 pt-2 dark:border-white/10"
              >
                {/* Health Tips */}
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Health Tips
                  </p>
                  <ul className="space-y-1">
                    {score.healthTips.slice(0, 3).map((tip, idx) => (
                      <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex gap-2">
                        <span className="shrink-0">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risk Groups */}
                {score.riskGroups.length > 1 && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      At-Risk Groups
                    </p>
                    <ul className="space-y-1">
                      {score.riskGroups.slice(0, 3).map((group, idx) => (
                        <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex gap-2">
                          <span className="shrink-0">•</span>
                          <span>{group}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>

        <div className="flex h-full flex-col rounded-xl border border-white/40 bg-white/55 p-2.5 backdrop-blur-xl dark:border-white/10 dark:bg-white/7 sm:p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-800 dark:text-white">Score Meter</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Target 80+</p>
          </div>

          <div className="relative flex flex-1 items-center justify-center py-0.5">
            <div className="absolute inset-0 rounded-full bg-linear-to-tr from-green-300/25 via-yellow-300/20 to-red-300/25 blur-2xl" />
            <SemiCircleGauge
              value={score.totalScore}
              max={100}
              size={150}
              strokeWidth={12}
              valueLabel={score.category}
              insight={`AQI: ${data?.aqi ?? "N/A"} | UV: ${data?.uv?.toFixed(1) ?? "N/A"}`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
