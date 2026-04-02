"use client"

import { motion } from "framer-motion"
import { AlertTriangle } from "lucide-react"
import { getUvCategory } from "@/components/dashboard/uvindex/utils"

type UvAlertCardProps = {
  uvValue: number | null
}

export function UvAlertCard({ uvValue }: UvAlertCardProps) {
  const hasUvValue = typeof uvValue === "number"
  const category = hasUvValue ? getUvCategory(uvValue) : "--"
  const isWarning = hasUvValue ? uvValue >= 8 : false

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.08 }}
      className={`rounded-3xl border p-4 shadow-sm ${
        !hasUvValue
          ? "border-slate-200 bg-slate-50/85 text-slate-700 dark:border-slate-700/35 dark:bg-slate-800/12 dark:text-slate-300"
          : isWarning
          ? "border-red-200 bg-red-50/85 text-red-700 dark:border-red-500/35 dark:bg-red-500/12 dark:text-red-300"
          : "border-emerald-200 bg-emerald-50/85 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/12 dark:text-emerald-300"
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5" />
        <div>
          <p className="text-sm font-semibold">UV Alert: {category}</p>
          <p className="mt-1 text-xs">
            {!hasUvValue
              ? "UV alert data is unavailable right now."
              : isWarning
              ? "Avoid outdoor activity between 11 AM and 3 PM. Wear full protection if outside."
              : "Conditions are manageable with basic protection and hydration."}
          </p>
        </div>
      </div>
    </motion.section>
  )
}
