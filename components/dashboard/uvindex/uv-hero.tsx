"use client"

import { motion } from "framer-motion"
import { MapPin } from "lucide-react"
import { getUvCategory, getUvHealthMessage, getUvToneClasses } from "@/components/dashboard/uvindex/utils"

type UvHeroProps = {
  uvValue: number | null
  location: string | null
  currentTime: string
}

export function UvHero({ uvValue, location, currentTime }: UvHeroProps) {
  const hasUvValue = typeof uvValue === "number"
  const category = hasUvValue ? getUvCategory(uvValue) : "--"
  const healthMessage = hasUvValue ? getUvHealthMessage(uvValue) : "UV data is not available right now."
  const markerGradientClasses =
    category === "Low"
      ? "from-emerald-500 via-lime-400 to-emerald-600"
      : category === "Moderate"
        ? "from-yellow-500 via-amber-400 to-yellow-600"
        : category === "High"
          ? "from-orange-500 via-amber-400 to-orange-600"
          : category === "Very High"
            ? "from-red-500 via-rose-400 to-red-600"
            : "from-violet-500 via-fuchsia-400 to-violet-600"
  const markerClasses = [
    "left-[0%]",
    "left-[8.33%]",
    "left-[16.66%]",
    "left-[25%]",
    "left-[33.33%]",
    "left-[41.66%]",
    "left-[50%]",
    "left-[58.33%]",
    "left-[66.66%]",
    "left-[75%]",
    "left-[83.33%]",
    "left-[91.66%]",
    "left-[100%]",
  ]
  const markerClass = hasUvValue ? markerClasses[Math.max(0, Math.min(12, Math.round(uvValue)))] : "left-[0%]"

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_20px_60px_rgba(14,116,144,0.12)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/60 sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(34,197,94,0.12)_0%,rgba(250,204,21,0.14)_28%,rgba(249,115,22,0.16)_52%,rgba(239,68,68,0.16)_74%,rgba(168,85,247,0.18)_100%)]" />
      <div className="relative z-10 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px] lg:items-center">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
            <span className="bg-linear-to-r from-[#60a5fa] via-[#34d399] to-[#60a5fa] bg-clip-text text-transparent">EnviroSense</span>
            <span className="ml-1.5 sm:ml-2">UV Index Dashboard</span>
          </h1>
          <div className="mt-2 flex items-end gap-2 sm:gap-3">
            <span className="text-5xl font-black leading-none text-slate-900 dark:text-slate-50 sm:text-6xl">{hasUvValue ? uvValue.toFixed(1) : "--"}</span>
            <span className={`mb-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${hasUvValue ? getUvToneClasses(uvValue) : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{category}</span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{healthMessage}</p>

          <div className="relative mt-4 h-2 overflow-visible rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full w-full rounded-full bg-[linear-gradient(90deg,#22c55e_0%,#facc15_28%,#f97316_52%,#ef4444_74%,#a855f7_100%)]" />
            <div className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 ${markerClass}`}>
              <span className={`absolute inset-0 rounded-full bg-linear-to-br ${markerGradientClasses} blur-xs`} />
              <span className={`absolute inset-0 animate-ping rounded-full bg-linear-to-br ${markerGradientClasses} opacity-35`} />
              <span className="absolute inset-0.5 rounded-full border border-white/85 bg-white/95 dark:border-slate-900/80 dark:bg-slate-950/95" />
              <span
                aria-label="Current UV marker"
                className={`relative flex h-4 w-4 items-center justify-center rounded-full bg-linear-to-br ${markerGradientClasses} shadow-[0_0_0_4px_rgba(255,255,255,0.6)] ring-2 ring-white dark:ring-slate-900`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
              </span>
              <span className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-full border px-2 py-0.5 text-[10px] font-semibold shadow-sm ${hasUvValue ? getUvToneClasses(uvValue) : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                UV {hasUvValue ? uvValue.toFixed(1) : "--"}
              </span>
              <span className={`pointer-events-none absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-sm bg-linear-to-br ${markerGradientClasses} shadow-md`} />
            </div>
          </div>

          <div className="mt-2 flex justify-between text-[10px] text-slate-500 dark:text-slate-400 sm:text-[11px]">
            <span>Low</span>
            <span>Moderate</span>
            <span>High</span>
            <span>Very High</span>
            <span>Extreme</span>
          </div>
        </div>

        <div className="w-full rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/85 sm:p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Current Context</p>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <MapPin className="h-4 w-4 text-sky-500" />
            {location ?? "--"}
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{currentTime}</p>
        </div>
      </div>
    </motion.section>
  )
}
