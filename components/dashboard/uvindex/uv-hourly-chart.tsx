"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Activity, Clock3, Sun } from "lucide-react"
import { Area, AreaChart, CartesianGrid, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { getUvCategory, type HourlyUvPoint } from "@/components/dashboard/uvindex/utils"

type UvHourlyChartProps = {
  data: HourlyUvPoint[]
  currentHour: number
}

type ChartPoint = HourlyUvPoint & {
  slotDisplay: string
  tickLabel: string
  uvVisual: number
}

function formatHour12From24(hour24: number) {
  const normalized = ((hour24 % 24) + 24) % 24
  const hour12 = normalized % 12 === 0 ? 12 : normalized % 12
  const suffix = normalized >= 12 ? "pm" : "am"
  return `${hour12}${suffix}`
}

function formatAxisHourLabel(hour24: number, compact = false) {
  const normalized = ((hour24 % 24) + 24) % 24
  const hour12 = normalized % 12 === 0 ? 12 : normalized % 12
  if (compact) {
    const suffix = normalized >= 12 ? "PM" : "AM"
    return `${hour12}${suffix}`
  }
  const suffix = normalized >= 12 ? "PM" : "AM"
  return `${hour12} ${suffix}`
}

function formatSlotLabel(rawLabel: string | undefined, hour24Fallback: number, includeDay: boolean) {
  const trimmed = typeof rawLabel === "string" ? rawLabel.trim() : ""

  let dayPart = ""
  let timePart = ""

  if (trimmed) {
    const parts = trimmed.split(/\s+/)
    if (parts.length >= 2 && /^[A-Za-z]{3,}$/.test(parts[0])) {
      dayPart = parts[0]
      timePart = parts.slice(1).join(" ")
    } else {
      timePart = trimmed
    }
  }

  let formattedTime = formatHour12From24(hour24Fallback)
  if (timePart) {
    const twelveHourMatch = timePart.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i)
    if (twelveHourMatch) {
      const hourValue = Number(twelveHourMatch[1])
      const minuteValue = Number(twelveHourMatch[2] ?? 0)
      const meridiem = twelveHourMatch[3].toLowerCase()
      formattedTime = minuteValue > 0 ? `${hourValue}:${String(minuteValue).padStart(2, "0")}${meridiem}` : `${hourValue}${meridiem}`
    } else {
      const twentyFourHourMatch = timePart.match(/^(\d{1,2})(?::(\d{2}))?$/)
      if (twentyFourHourMatch) {
        const hourValue = Number(twentyFourHourMatch[1])
        const minuteValue = Number(twentyFourHourMatch[2] ?? 0)
        const normalizedHour = ((hourValue % 24) + 24) % 24
        const hour12 = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12
        const meridiem = normalizedHour >= 12 ? "pm" : "am"
        formattedTime = minuteValue > 0 ? `${hour12}:${String(minuteValue).padStart(2, "0")}${meridiem}` : `${hour12}${meridiem}`
      }
    }
  }

  if (includeDay && dayPart) return `${dayPart} ${formattedTime}`
  return formattedTime
}

function toRealisticUv(hour24: number, uv: number) {
  if (hour24 < 6 || hour24 > 18) return 0
  return Math.max(0, Math.min(12, uv))
}

function HourlyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const value = Number(payload[0]?.value ?? 0)
  const category = getUvCategory(value)

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-xs shadow-[0_10px_24px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900">
      <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        UV Index: <span className="font-semibold text-slate-900 dark:text-slate-100">{value.toFixed(1)}</span> ({category})
      </p>
    </div>
  )
}

export function UvHourlyChart({ data, currentHour }: UvHourlyChartProps) {

  const [isMobileViewport, setIsMobileViewport] = useState(false)
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)")
    const update = () => setIsMobileViewport(media.matches)
    update()
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update)
      return () => media.removeEventListener("change", update)
    }
    media.addListener(update)
    return () => media.removeListener(update)
  }, [])

  if (!data || data.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04 }}
        className="mb-6 rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900/70"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-[18px] font-semibold text-[#0f172a] dark:text-slate-100">
              <Activity className="h-4 w-4 text-sky-600" />
              Hourly UV Forecast
            </h3>
            <p className="mt-1 text-[12px] text-[#64748b] dark:text-slate-300">Hourly UV data is unavailable.</p>
          </div>
          <span className="rounded-full border border-[#bae6fd] bg-[#e0f2fe] px-2.5 py-1 text-[11px] font-semibold text-[#0284c7]">
            Live Tracking
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] p-4 text-[13px] text-[#64748b] dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          UV hourly values will appear here when live data is available.
        </div>
      </motion.section>
    )
  }

  const chartData: ChartPoint[] = data.map((point) => ({
    ...point,
    slotDisplay: formatSlotLabel(point.slotLabel, point.hour24, true),
    tickLabel: formatSlotLabel(point.slotLabel, point.hour24, false),
    uvVisual: toRealisticUv(point.hour24, point.uv),
  }))

  const daytimeData = chartData.filter((point) => point.hour24 >= 6 && point.hour24 <= 18)
  const peakPoint = (daytimeData.length ? daytimeData : chartData).reduce((max, curr) => (curr.uvVisual > max.uvVisual ? curr : max), (daytimeData.length ? daytimeData : chartData)[0])
  const currentPoint = chartData.find((point) => point.hour24 === currentHour) ?? chartData[0]
  const averageUv = chartData.reduce((sum, point) => sum + point.uvVisual, 0) / chartData.length


  // Dynamic tick calculation for mobile: 5 well-spaced, visually optimal ticks
  let timingTicks: string[] = []
  if (isMobileViewport) {
    // Find 5 evenly distributed indices in the chartData
    const n = chartData.length
    if (n <= 5) {
      timingTicks = chartData.map((pt) => pt.slotDisplay)
    } else {
      timingTicks = Array.from({ length: 5 }, (_, i) => {
        const idx = Math.round((i * (n - 1)) / 4)
        return chartData[idx].slotDisplay
      })
    }
  } else {
    // Desktop: keep milestone hours for premium experience
    const markHours = [6, 9, 12, 15, 18]
    const tickMap = new Map<number, string>()
    for (const point of chartData) {
      if (markHours.includes(point.hour24) && !tickMap.has(point.hour24)) {
        tickMap.set(point.hour24, point.slotDisplay)
      }
    }
    timingTicks = markHours.map((hour) => tickMap.get(hour)).filter((value): value is string => typeof value === "string")
  }

  const currentLabel = currentPoint?.slotDisplay ?? `Now ${formatHour12From24(currentHour)}`

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.04 }}
      className="mb-6 rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900/70"
    >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-[18px] font-semibold text-[#0f172a] dark:text-slate-100">
              <Activity className="h-4 w-4 text-sky-600" />
              Hourly UV Forecast
            </h3>
            <p className="mt-1 text-[12px] text-[#64748b] dark:text-slate-300">Peak UV around {peakPoint.tickLabel}</p>
          </div>
          <span className="rounded-full border border-[#bae6fd] bg-[#e0f2fe] px-2.5 py-1 text-[11px] font-semibold text-[#0284c7]">
            Live Tracking
          </span>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
          <motion.div whileHover={{ y: -1 }} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2.5 sm:p-4 dark:border-slate-700 dark:bg-slate-800/70">
            <p className="text-[13px] text-[#64748b] dark:text-slate-300">Peak</p>
            <p className="mt-1 text-[14px] font-bold leading-tight text-[#0f172a] dark:text-slate-100 sm:text-[22px] sm:leading-none">{peakPoint.tickLabel}</p>
          </motion.div>
          <motion.div whileHover={{ y: -1 }} className="rounded-xl border border-[#38bdf8] bg-[#f0f9ff] p-2.5 shadow-[0_6px_16px_rgba(56,189,248,0.2)] sm:p-4 dark:border-sky-500/60 dark:bg-sky-500/15">
            <p className="text-[13px] text-[#64748b] dark:text-slate-300">Current UV</p>
            <p className="mt-1 text-[18px] font-bold leading-none text-[#0f172a] dark:text-slate-100 sm:text-[22px]">{currentPoint.uvVisual.toFixed(1)}</p>
          </motion.div>
          <motion.div whileHover={{ y: -1 }} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2.5 sm:p-4 dark:border-slate-700 dark:bg-slate-800/70">
            <p className="text-[13px] text-[#64748b] dark:text-slate-300">Day Avg</p>
            <p className="mt-1 text-[18px] font-bold leading-none text-[#0f172a] dark:text-slate-100 sm:text-[22px]">{averageUv.toFixed(1)}</p>
          </motion.div>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3 dark:border-slate-700 dark:bg-slate-800/65">
          <div className="mb-3 flex items-center justify-between gap-3 text-[12px] text-[#64748b] dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              UV Intensity
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              Current: {currentLabel}
            </span>
          </div>

          <div className="h-55 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 14 }}>
              <defs>
                <linearGradient id="uvHourlyFillMobile" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.28} />
                  <stop offset="30%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="55%" stopColor="#f97316" stopOpacity={0.16} />
                  <stop offset="75%" stopColor="#eab308" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.06} />
                </linearGradient>
                <linearGradient id="uvHourlyStrokeMobile" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="25%" stopColor="#eab308" />
                  <stop offset="50%" stopColor="#f97316" />
                  <stop offset="75%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.35} />
              <XAxis
                dataKey="slotDisplay"
                ticks={timingTicks}
                tickFormatter={(value) => {
                  if (typeof value !== "string") return ""
                  const point = chartData.find((item) => item.slotDisplay === value)
                  return point ? formatAxisHourLabel(point.hour24, isMobileViewport) : value
                }}
                tick={{ fill: "#64748b", fontSize: isMobileViewport ? 10 : 11 }}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                minTickGap={isMobileViewport ? 20 : 30}
                interval={0}
                padding={{ left: 8, right: 8 }}
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 12]} width={30} tickMargin={6} />
              <Tooltip content={<HourlyTooltip />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }} />
              {currentPoint?.slotDisplay ? <ReferenceLine x={currentPoint.slotDisplay} stroke="#94a3b8" strokeDasharray="3 3" /> : null}
              <Area type="monotone" dataKey="uvVisual" fill="url(#uvHourlyFillMobile)" stroke="none" isAnimationActive animationDuration={750} />
              <Line type="monotone" dataKey="uvVisual" stroke="url(#uvHourlyStrokeMobile)" strokeWidth={3} dot={{ r: 2.5 }} activeDot={{ r: 5 }} isAnimationActive animationDuration={850} />
              {currentPoint?.slotDisplay ? <ReferenceDot x={currentPoint.slotDisplay} y={currentPoint.uvVisual} r={10} fill="rgba(124,58,237,0.22)" stroke="none" /> : null}
              {currentPoint?.slotDisplay ? <ReferenceDot x={currentPoint.slotDisplay} y={currentPoint.uvVisual} r={5} fill="#7c3aed" stroke="#ffffff" strokeWidth={2} /> : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-orange-100 bg-[#fff7ed] px-2.5 py-1 text-[#ea580c] dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300">
            Peak: {peakPoint.tickLabel}
          </span>
          <span className="rounded-full border border-slate-200 bg-[#f1f5f9] px-2.5 py-1 text-[#334155] dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
            Current: {currentLabel}
          </span>
        </div>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="mt-4 inline-flex items-center gap-1 rounded-full border border-violet-200 bg-[#f3e8ff] px-3 py-1.5 text-[12px] font-semibold text-[#7c3aed] shadow-[0_4px_14px_rgba(124,58,237,0.12)] transition-all hover:bg-violet-100 hover:shadow-[0_10px_22px_rgba(124,58,237,0.2)] dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/20"
        >
          <Sun className="h-3.5 w-3.5" />
          Get midday UV alerts
        </motion.button>
    </motion.section>
  )
}
