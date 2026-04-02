"use client"

import { motion } from "framer-motion"
import { Clock3 } from "lucide-react"
import { getExposureMinutes, getUvCategory, getUvToneClasses } from "@/components/dashboard/uvindex/utils"

type UvExposureCardProps = {
  uvValue: number | null
  skinType: string
  onSkinTypeChange: (value: string) => void
}

const skinTypes = ["Type I", "Type II", "Type III", "Type IV", "Type V", "Type VI"]

export function UvExposureCard({ uvValue, skinType, onSkinTypeChange }: UvExposureCardProps) {
  const hasUvValue = typeof uvValue === "number"
  const safeMinutes = hasUvValue ? getExposureMinutes(uvValue, skinType) : null
  const safetyProgress = hasUvValue && safeMinutes !== null ? Math.min((safeMinutes / 60) * 100, 100) : 0
  const category = hasUvValue ? getUvCategory(uvValue) : "--"
  const isNightOrVeryLow = hasUvValue ? uvValue <= 0.3 : false

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.06 }}
      className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_48px_rgba(14,116,144,0.12)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/50 sm:p-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(34,211,238,0.16),transparent_36%),radial-gradient(circle_at_6%_86%,rgba(14,165,233,0.1),transparent_38%)] dark:bg-[radial-gradient(circle_at_90%_10%,rgba(34,211,238,0.2),transparent_36%),radial-gradient(circle_at_6%_86%,rgba(14,165,233,0.15),transparent_38%)]" />

      <div className="relative z-10 mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">Safe Exposure Estimate</h3>
          <p className="text-xs text-slate-500 dark:text-slate-300">Approximate direct sun exposure window before protection is advised</p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 text-[11px] font-semibold text-cyan-700 dark:border-cyan-500/35 dark:bg-cyan-500/15 dark:text-cyan-300">
          <Clock3 className="h-3.5 w-3.5" />
          Live
        </div>
      </div>

      <label className="relative z-10 mb-3 block text-xs font-medium text-slate-600 dark:text-slate-300" htmlFor="skinTypeSelect">
        Skin Type
      </label>
      <select
        id="skinTypeSelect"
        aria-label="Select skin type"
        value={skinType}
        onChange={(event) => onSkinTypeChange(event.target.value)}
        className="relative z-10 w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-700 outline-none ring-sky-300 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-800/85 dark:text-slate-100"
      >
        {skinTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <div className="relative z-10 mt-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-800/75">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">Estimated safe duration</p>
          <div className="flex items-center gap-1.5">
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
              {skinType}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${hasUvValue ? getUvToneClasses(uvValue) : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
              UV {hasUvValue ? uvValue.toFixed(1) : "--"} {category}
            </span>
          </div>
        </div>

        <p className="text-3xl font-black leading-none text-slate-900 dark:text-slate-50">{safeMinutes !== null ? `${safeMinutes} min` : "--"}</p>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${safetyProgress}%` }}
            transition={{ duration: 0.55 }}
            className="h-full rounded-full bg-linear-to-r from-emerald-500 via-yellow-400 to-orange-500"
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          {!hasUvValue
            ? "UV exposure data is not available right now."
            : isNightOrVeryLow
            ? "UV is very low right now. Exposure window is extended, but basic protection is still recommended."
            : "Higher UV means shorter safe exposure time without protection."}
        </p>
      </div>
    </motion.section>
  )
}
