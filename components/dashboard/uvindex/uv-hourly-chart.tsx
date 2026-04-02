"use client"

import { motion } from "framer-motion"
import { Activity, Clock3, Sun } from "lucide-react"
import { Area, AreaChart, CartesianGrid, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { HourlyUvPoint } from "@/components/dashboard/uvindex/utils"

type UvHourlyChartProps = {
  data: HourlyUvPoint[]
  currentHour: number
}

export function UvHourlyChart({ data, currentHour }: UvHourlyChartProps) {
  if (!data || data.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04 }}
        className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_48px_rgba(14,116,144,0.12)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/50 sm:p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              <Activity className="h-4 w-4 text-sky-600 dark:text-sky-300" />
              Hourly UV Forecast
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-300">Hourly UV data is unavailable.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            --
          </span>
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          UV hourly values will appear here when live data is available.
        </div>
      </motion.section>
    )
  }

  const peakPoint = data.reduce((max, curr) => (curr.uv > max.uv ? curr : max), data[0])
  const currentPoint = data.find((point) => point.hour24 === currentHour) ?? data[0]
  const averageUv = data.reduce((sum, point) => sum + point.uv, 0) / data.length

  const currentLabel = currentPoint?.slotLabel ?? `${String(currentHour).padStart(2, "0")}:00`

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.04 }}
      className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_48px_rgba(14,116,144,0.12)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/50 sm:p-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_14%,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_10%_88%,rgba(14,165,233,0.08),transparent_40%)] dark:bg-[radial-gradient(circle_at_86%_14%,rgba(56,189,248,0.22),transparent_34%),radial-gradient(circle_at_10%_88%,rgba(14,165,233,0.16),transparent_40%)]" />

      <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            <Activity className="h-4 w-4 text-sky-600 dark:text-sky-300" />
            Hourly UV Forecast
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-300">Peak UV around {peakPoint.slotLabel ?? peakPoint.time}</p>
        </div>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300">
          Live Tracking
        </span>
      </div>

      <div className="relative z-10 mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white/90 p-2.5 dark:border-slate-700 dark:bg-slate-800/80">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Peak</p>
          <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-50">{peakPoint.slotLabel ?? peakPoint.time}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white/90 p-2.5 dark:border-slate-700 dark:bg-slate-800/80">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Current UV</p>
          <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-50">{currentPoint.uv.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white/90 p-2.5 dark:border-slate-700 dark:bg-slate-800/80">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Day Avg</p>
          <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-50">{averageUv.toFixed(1)}</p>
        </div>
      </div>

      <div className="relative z-10 h-56 rounded-2xl border border-slate-200 bg-white/88 p-3 shadow-inner dark:border-slate-700 dark:bg-slate-800/75 sm:h-64">
        <div className="mb-2 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-300">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-4 rounded-full bg-blue-600" />
            UV Intensity
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            Current: {currentLabel}
          </span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.24)" />
            <XAxis
              dataKey="slotLabel"
              tickFormatter={(value) => {
                if (typeof value !== "string") return ""
                const [day, time] = value.split(" ")
                return `${day} ${time}`
              }}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 12]} />
            <Tooltip
              labelFormatter={(value) => `${value}`}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid rgba(148,163,184,0.35)",
                backgroundColor: "rgba(255,255,255,0.96)",
                fontSize: "12px",
              }}
            />
            {currentPoint?.slotLabel ? <ReferenceLine x={currentPoint.slotLabel} stroke="#0f172a" strokeDasharray="3 3" strokeOpacity={0.45} /> : null}
            <Area type="monotone" dataKey="uv" fill="#93c5fd" fillOpacity={0.35} stroke="none" />
            <Line type="monotone" dataKey="uv" stroke="#2563eb" strokeWidth={3} dot={{ r: 2.5 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="relative z-10 mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-1 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300">
          Peak: {peakPoint.slotLabel ?? peakPoint.time}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-200">
          Current hour: {currentLabel}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300">
          <Sun className="h-3.5 w-3.5" />
          Monitor midday exposure
        </span>
      </div>
    </motion.section>
  )
}
