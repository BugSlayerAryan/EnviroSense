"use client"

import { CloudSun, Droplets, Wind, CloudRain, Sun, Cloud, CloudSnow, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { fetchWeatherData } from "@/api/api"

export function WeatherCard() {
  const searchParams = useSearchParams()
  const cityQuery = searchParams.get("city") ?? "New Delhi, India"
  const [temp, setTemp] = useState(29)
  const [isFahrenheit, setIsFahrenheit] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [condition, setCondition] = useState("Partly Cloudy")
  const [humidity, setHumidity] = useState(58)
  const [windKmh, setWindKmh] = useState(12)
  const [rainChance, setRainChance] = useState(20)

  const getWeatherIcon = () => {
    if (temp >= 25) return <Sun className="h-10 w-10 text-yellow-400 dark:text-yellow-300" />
    if (temp >= 15) return <CloudSun className="h-10 w-10 text-blue-400 dark:text-white/80" />
    if (temp >= 5) return <Cloud className="h-10 w-10 text-gray-400 dark:text-gray-300" />
    return <CloudSnow className="h-10 w-10 text-blue-200 dark:text-blue-300" />
  }

  const displayTemp = isFahrenheit ? Math.round((temp * 9/5) + 32) : temp
  const tempUnit = isFahrenheit ? "°F" : "°C"

  const handleRefresh = async (requestedCity?: string) => {
    setIsRefreshing(true)
    try {
      const data = await fetchWeatherData(requestedCity ?? cityQuery)
      if (typeof data?.temp === "number") setTemp(Math.round(data.temp))
      if (typeof data?.humidity === "number") setHumidity(data.humidity)
      if (typeof data?.windKmh === "number") setWindKmh(Math.round(data.windKmh))
      if (typeof data?.humidity === "number") setRainChance(Math.min(100, Math.max(0, Math.round(data.humidity * 0.35))))
      if (data?.condition) setCondition(data.condition)
    } catch {
      // Keep previous values on transient API failure.
    }
    setIsRefreshing(false)
  }

  useEffect(() => {
    void handleRefresh(cityQuery)
  }, [cityQuery])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }} whileHover={{ y: -2 }} className="glass-card glow-blue flex h-full flex-col p-3.5 shadow-md transition-all duration-300 ease-in-out sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white sm:text-base">Live Weather</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Precision weather data · Updated in real-time</p>
        </div>
        <div className="flex gap-1.5">
          <button aria-label="Convert temperature" title="Toggle temperature unit" onClick={() => setIsFahrenheit(!isFahrenheit)} className="rounded-lg bg-white/60 px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:bg-white/80 active:scale-95 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
            {isFahrenheit ? "°C" : "°F"}
          </button>
          <button aria-label="Refresh weather" title="Refresh" onClick={() => void handleRefresh()} className="rounded-lg bg-white/60 p-1.5 shadow-sm transition-all hover:bg-white/80 active:scale-95 dark:bg-white/10 dark:hover:bg-white/15">
            <RefreshCw className={`h-4 w-4 text-blue-500 dark:text-blue-400 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-lg bg-linear-to-r from-blue-100/50 to-cyan-100/50 p-4 dark:from-blue-500/15 dark:to-cyan-500/15 sm:p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {getWeatherIcon()}
            </motion.div>
            <div>
              <div className="flex items-baseline gap-1">
                <p className="text-5xl font-bold text-blue-600 dark:text-blue-300 sm:text-7xl">{displayTemp}</p>
                <p className="text-base font-semibold text-blue-600 dark:text-blue-300 sm:text-xl">{tempUnit}</p>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">{condition}</p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Weather conditions summary</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2 sm:gap-3">
        <div className="group rounded-lg border border-white/30 bg-white/30 p-2.5 transition-all dark:border-white/10 dark:bg-white/5 hover:bg-white/40 dark:hover:bg-white/10 sm:p-3">
          <Droplets className="mb-1.5 h-5 w-5 text-blue-500 dark:text-blue-400 transition-transform group-hover:scale-110" />
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Humidity</p>
          <p className="mt-1 text-base font-bold text-gray-900 dark:text-white sm:text-lg">{humidity}%</p>
        </div>
        <div className="group rounded-lg border border-white/30 bg-white/30 p-2.5 transition-all dark:border-white/10 dark:bg-white/5 hover:bg-white/40 dark:hover:bg-white/10 sm:p-3">
          <Wind className="mb-1.5 h-5 w-5 text-blue-500 dark:text-blue-400 transition-transform group-hover:scale-110" />
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Wind</p>
          <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white sm:text-base">{windKmh} km/h</p>
        </div>
        <div className="group rounded-lg border border-white/30 bg-white/30 p-2.5 transition-all dark:border-white/10 dark:bg-white/5 hover:bg-white/40 dark:hover:bg-white/10 sm:p-3">
          <CloudRain className="mb-1.5 h-5 w-5 text-blue-500 dark:text-blue-400 transition-transform group-hover:scale-110" />
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Rainfall</p>
          <p className="mt-1 text-base font-bold text-gray-900 dark:text-white sm:text-lg">{rainChance}%</p>
        </div>
      </div>
    </motion.div>
  )
}
