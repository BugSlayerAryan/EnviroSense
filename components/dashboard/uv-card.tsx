
"use client"

import { AlertTriangle, Radiation, Sun, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

export function UvCard() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.3 }} whileHover={{ y: -2 }} className="glass-card glow-yellow flex flex-col p-4 shadow-md transition-all duration-300 ease-in-out sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white sm:text-base">UV Index</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Sun exposure level</p>
        </div>
        <button aria-label="Refresh UV data" title="Refresh" onClick={handleRefresh} className="rounded-lg bg-white/60 p-1.5 shadow-sm transition-all hover:bg-white/80 active:scale-95 dark:bg-white/10 dark:hover:bg-white/15">
          <RefreshCw className={`h-4 w-4 text-yellow-500 dark:text-yellow-400 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mb-5 rounded-lg bg-linear-to-r from-yellow-100/50 to-orange-100/50 p-4 dark:from-yellow-500/15 dark:to-orange-500/15 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">8</p>
            <span className="mt-2 inline-flex rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">High</span>
          </div>
          <Sun className="mt-1 h-10 w-10 text-yellow-500 dark:text-yellow-400 sm:h-12 sm:w-12" />
        </div>
      </div>

      <div className="mt-auto space-y-2.5 text-xs text-gray-600 dark:text-gray-400 sm:space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-white/20 bg-white/20 px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
          <span className="flex items-center gap-2"><Sun className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />Sunlight</span>
          <strong className="text-gray-900 dark:text-white">10 hrs</strong>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-white/20 bg-white/20 px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
          <span className="flex items-center gap-2"><Radiation className="h-4 w-4 text-orange-500 dark:text-orange-400" />Radiation</span>
          <strong className="text-gray-900 dark:text-white">160 W/m²</strong>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs font-medium text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>Apply sunscreen regularly</span>
      </div>
    </motion.div>
  )
}
