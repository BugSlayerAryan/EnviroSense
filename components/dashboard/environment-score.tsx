"use client"

import { ShieldCheck, TrendingUp, MapPin } from "lucide-react"
import { motion } from "framer-motion"
import { SemiCircleGauge } from "./gauge"

export function EnvironmentScore() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2 }}
      className="glass-card relative overflow-hidden p-0"
    >
      <div className="absolute inset-0 bg-linear-to-br from-white/20 via-transparent to-white/5 dark:from-white/5 dark:to-white/0" />

      <div className="relative z-10 grid grid-cols-1 gap-4 p-4 sm:gap-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:p-6">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">Environment Score</h2>
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                <MapPin className="h-3.5 w-3.5" />
                <span>New Delhi, India</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Updated just now</p>
            </div>
            <span className="rounded-full bg-yellow-200 px-2.5 py-1 text-[11px] font-semibold text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-300 sm:px-3 sm:text-xs">
              Moderate
            </span>
          </div>

          <div className="mb-3 flex items-end gap-2">
            <p className="text-4xl font-bold leading-none text-green-600 dark:text-white sm:text-5xl">72</p>
            <p className="pb-1 text-xs font-medium text-gray-600 dark:text-gray-300">/ 100</p>
          </div>

          <p className="mb-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
            Environmental conditions are suitable for outdoor activities. Sensitive individuals should take basic precautions.
          </p>

          <div className="mb-3 rounded-lg border border-white/40 bg-white/60 p-2.5 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-500 dark:text-emerald-300" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-800 dark:text-white">Recommendation:</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Outdoor activities are safe.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              <TrendingUp className="h-3 w-3 text-green-500 dark:text-emerald-300" />
              <span>+5 points in 24h</span>
            </div>
          </div>
        </div>

        <div className="flex h-full flex-col rounded-xl border border-white/40 bg-white/55 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/7 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-800 dark:text-white">Score Meter</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Target 80+</p>
          </div>

          <div className="relative flex flex-1 items-center justify-center py-1">
            <div className="absolute inset-0 rounded-full bg-linear-to-tr from-green-300/25 via-yellow-300/20 to-red-300/25 blur-2xl" />
            <SemiCircleGauge
              value={72}
              max={100}
              size={176}
              strokeWidth={14}
              valueLabel="Moderate"
              insight="Air quality remains stable today."
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
