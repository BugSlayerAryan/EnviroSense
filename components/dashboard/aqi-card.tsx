
"use client"

import { Wind, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

export function AqiCard() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }} whileHover={{ y: -2 }} className="glass-card glow-red flex h-full flex-col p-4 sm:p-5 transition-all duration-300 ease-in-out">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-white sm:text-base">Air Quality Index</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">PM2.5 · PM10 · CO</p>
        </div>
        <button aria-label="Refresh AQI data" title="Refresh" onClick={handleRefresh} className="rounded-xl bg-white/70 p-2 shadow-sm dark:bg-white/10 dark:shadow-[0_0_20px_rgba(248,113,113,0.4)] hover:scale-110 transition-transform">
          <RefreshCw className={`h-4 w-4 text-red-400 dark:text-white/80 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl bg-linear-to-r from-red-200/40 to-orange-200/40 p-4 dark:from-red-500/20 dark:to-orange-500/20">
        <div>
          <p className="text-4xl font-bold text-gray-800 dark:text-white sm:text-5xl">165</p>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-500/20 dark:text-red-300">Unhealthy</span>
        </div>
        <Wind className="h-10 w-10 text-red-400 dark:text-red-300 sm:h-12 sm:w-12" />
      </div>

      <div className="flex flex-col justify-between gap-4 border-t border-white/40 pt-4 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
        <div className="flex items-center justify-between rounded-lg bg-white/20 p-2.5 dark:bg-white/5 sm:p-3"><span>PM2.5</span><strong className="text-gray-800 dark:text-white">85 µg/m³</strong></div>
        <div className="flex items-center justify-between rounded-lg bg-white/20 p-2.5 dark:bg-white/5 sm:p-3"><span>PM10</span><strong className="text-gray-800 dark:text-white">120 µg/m³</strong></div>
        <div className="flex items-center justify-between rounded-lg bg-white/20 p-2.5 dark:bg-white/5 sm:p-3"><span>CO</span><strong className="text-gray-800 dark:text-white">2.4 ppm</strong></div>
      </div>
    </motion.div>
  )
}
