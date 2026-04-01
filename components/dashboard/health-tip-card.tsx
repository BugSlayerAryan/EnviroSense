"use client"

import { HeartPulse } from "lucide-react"
import { motion } from "framer-motion"

export function HealthTipCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.5 }}
      whileHover={{ y: -1 }}
      className="glass-card relative overflow-hidden p-5 shadow-md transition-all duration-300 ease-in-out"
    >
      <div className="relative z-10 flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/20">
          <HeartPulse className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Health Tip</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            Current air quality is elevated. Individuals with asthma, allergies, or heart conditions should limit outdoor activities and wear appropriate protection.
          </p>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-tl-3xl bg-linear-to-tl from-red-300/20 to-transparent blur-2xl dark:from-red-500/10" />
    </motion.div>
  )
}
