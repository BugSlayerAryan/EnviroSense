"use client"

import { motion } from "framer-motion"
import { ShieldAlert, Sun } from "lucide-react"
import { getUvCategory, getUvToneClasses, type DailyUvPoint } from "@/components/dashboard/uvindex/utils"

type UvWeeklyForecastProps = {
  data: DailyUvPoint[]
}

export function UvWeeklyForecast({ data }: UvWeeklyForecastProps) {
  if (!data || data.length === 0) {
    return (
      <section className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_48px_rgba(14,116,144,0.12)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/50 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              <ShieldAlert className="h-4 w-4 text-sky-600 dark:text-sky-300" />
              7-Day UV Forecast
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-300">Daily maximum UV data is unavailable.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            --
          </span>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          UV daily forecast values will appear here when live data is available.
        </div>
      </section>
    )
  }

  return (
    <section className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_48px_rgba(14,116,144,0.12)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/50 sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_12%,rgba(56,189,248,0.16),transparent_35%),radial-gradient(circle_at_8%_86%,rgba(14,165,233,0.08),transparent_38%)] dark:bg-[radial-gradient(circle_at_88%_12%,rgba(56,189,248,0.22),transparent_35%),radial-gradient(circle_at_8%_86%,rgba(14,165,233,0.15),transparent_38%)]" />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            <ShieldAlert className="h-4 w-4 text-sky-600 dark:text-sky-300" />
            7-Day UV Forecast
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-300">Daily maximum UV risk levels</p>
        </div>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300">
          Weekly
        </span>
      </div>

      <div className="relative z-10 mb-4 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white/85 p-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 sm:grid-cols-5">
        <span className="text-emerald-600 dark:text-emerald-300">Low</span>
        <span className="text-yellow-600 dark:text-yellow-300">Moderate</span>
        <span className="text-orange-600 dark:text-orange-300">High</span>
        <span className="text-red-600 dark:text-red-300">Very High</span>
        <span className="text-violet-600 dark:text-violet-300">Extreme</span>
      </div>

      <div className="relative z-10 space-y-2.5">
        {data.map((item, index) => {
          const category = getUvCategory(item.uvMax)
          const today = index === 0

          return (
            <motion.article
              key={`${item.day}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: 0.03 * index }}
              whileHover={{ y: -2 }}
              className={`rounded-2xl border p-3.5 transition-all duration-300 ${
                today
                  ? "border-sky-300 bg-linear-to-r from-sky-50/95 via-cyan-50/90 to-blue-50/85 shadow-[0_14px_34px_rgba(14,165,233,0.2)] dark:border-sky-400/40 dark:from-sky-500/20 dark:via-cyan-500/15 dark:to-blue-500/10"
                  : "border-slate-200 bg-white/92 shadow-[0_8px_20px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_24px_rgba(15,23,42,0.1)] dark:border-slate-700 dark:bg-slate-800/88"
              }`}
            >
              <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[84px_1fr_auto] sm:items-center">
                <div className="flex items-center justify-between gap-2 sm:block">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{today ? "Today" : item.day}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Day {index + 1}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:hidden ${getUvToneClasses(item.uvMax)}`}>
                    {category}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((item.uvMax / 12) * 100, 100)}%` }}
                      transition={{ duration: 0.5, delay: 0.04 * index }}
                      className="h-full rounded-full bg-[linear-gradient(90deg,#22c55e_0%,#facc15_30%,#f97316_52%,#ef4444_74%,#a855f7_100%)]"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    Highest UV intensity of that day
                  </div>
                </div>
                <div className="text-right sm:block">
                  <div className="flex flex-col items-end gap-0.5">
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Max</p>
                    <p className="text-base font-bold leading-none text-slate-900 dark:text-slate-50">{item.uvMax.toFixed(1)}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getUvToneClasses(item.uvMax)}`}>
                    {category}
                  </span>
                </div>
              </div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
