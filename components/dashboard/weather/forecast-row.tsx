"use client"

import { motion } from "framer-motion"
import { Droplets } from "lucide-react"
import { getTempRangePosition, getWeatherIcon, getWeatherIconColor, getWeatherLabel, type WeeklyForecastDay } from "@/components/dashboard/weather/utils"

type ForecastRowProps = {
  day: WeeklyForecastDay
  index: number
  isToday: boolean
  weekMin: number
  weekMax: number
}

export function ForecastRow({ day, index, isToday, weekMin, weekMax }: ForecastRowProps) {
  const Icon = getWeatherIcon(day.icon)
  const iconColor = getWeatherIconColor(day.icon)
  const condition = getWeatherLabel(day.icon)
  const range = getTempRangePosition(day.min, day.max, weekMin, weekMax)
  const currentOffset = day.current !== undefined ? ((day.current - weekMin) / Math.max(weekMax - weekMin, 1)) * 100 : null

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.03 * index }}
      whileHover={{ y: -2 }}
      className={`group relative w-full overflow-hidden rounded-2xl border p-3.5 transition-all duration-300 sm:p-4 ${
        isToday
          ? "border-sky-300 bg-linear-to-r from-sky-50/95 via-cyan-50/90 to-blue-50/85 shadow-[0_14px_34px_rgba(14,165,233,0.2)] ring-1 ring-sky-200/70 dark:border-sky-400/40 dark:from-sky-500/20 dark:via-cyan-500/15 dark:to-blue-500/10 dark:ring-sky-400/30"
          : "border-slate-200 bg-white/85 shadow-[0_10px_24px_rgba(15,23,42,0.06)] ring-1 ring-white/80 hover:shadow-[0_14px_28px_rgba(15,23,42,0.09)] dark:border-slate-700 dark:bg-slate-800/85 dark:ring-slate-700/40"
      }`}
    >
      <div className="grid grid-cols-[60px_40px_1fr_auto] items-center gap-2.5 sm:grid-cols-[72px_44px_1fr_auto] sm:gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{isToday ? "Today" : day.day}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{condition}</p>
        </div>

        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/90 dark:border-slate-600 dark:bg-slate-700/70">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{day.min} deg</span>
            <span>{day.max} deg</span>
          </div>
          <div className="relative h-2 rounded-full bg-slate-200/90 dark:bg-slate-700/80">
            <motion.div
              initial={{ width: 0, left: 0 }}
              animate={{ left: `${range.start}%`, width: `${range.width}%` }}
              transition={{ duration: 0.45, delay: 0.04 * index }}
              className="absolute top-0 h-full rounded-full bg-linear-to-r from-cyan-400 via-sky-500 to-blue-600"
            />
            {currentOffset !== null ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.12 + 0.03 * index }}
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow-sm dark:border-slate-800 dark:bg-white"
                style={{ left: `calc(${currentOffset}% - 6px)` }}
              />
            ) : null}
          </div>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-500/35 dark:bg-sky-500/15 dark:text-sky-300">
          <Droplets className="h-3 w-3" />
          {day.rain}%
        </div>
      </div>
    </motion.article>
  )
}
