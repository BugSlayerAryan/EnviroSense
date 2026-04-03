"use client"

import { AlertTriangle } from "lucide-react"
import { ForecastRow } from "@/components/dashboard/weather/forecast-row"
import type { WeeklyForecastDay } from "@/components/dashboard/weather/utils"

type WeeklyForecastProps = {
  title?: string
  subtitle?: string
  data: WeeklyForecastDay[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

function WeeklyForecastSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 7 }).map((_, idx) => (
        <div
          key={`weekly-skeleton-${idx}`}
          className="rounded-2xl border border-slate-200/80 bg-white/10 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)] ring-1 ring-white/70 backdrop-blur-xl md:bg-white/80 dark:border-slate-700/70 dark:bg-white/10 md:dark:bg-slate-900/65 dark:ring-slate-700/40"
        />
      ))}
    </div>
  )
}

function WeeklyForecastError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="h-4 w-4" />
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
        >
          Retry
        </button>
      ) : null}
    </div>
  )
}

export function WeeklyForecast({
  title = "7-Day Forecast",
  subtitle = "Daily min/max temperatures and conditions",
  data,
  loading = false,
  error = null,
  onRetry,
}: WeeklyForecastProps) {
  const hasData = data.length > 0
  const weekMin = hasData ? Math.min(...data.map((item) => item.min)) : 0
  const weekMax = hasData ? Math.max(...data.map((item) => item.max)) : 0

  return (
    <section className="mb-6 w-full rounded-3xl border border-slate-200/80 bg-white/10 p-4 shadow-[0_20px_54px_rgba(15,23,42,0.1)] ring-1 ring-white/70 backdrop-blur-xl md:bg-white/80 dark:border-slate-700/70 dark:bg-white/10 md:dark:bg-slate-900/70 dark:ring-slate-700/50 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">{subtitle}</p>
        </div>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300">
          Vertical View
        </span>
      </div>

      {loading ? <WeeklyForecastSkeleton /> : null}
      {!loading && error ? <WeeklyForecastError message={error} onRetry={onRetry} /> : null}
      {!loading && !error && hasData ? (
        <div className="space-y-2.5">
          {data.map((item, index) => (
            <ForecastRow
              key={`${item.day}-${index}`}
              day={item}
              index={index}
              isToday={index === 0}
              weekMin={weekMin}
              weekMax={weekMax}
            />
          ))}
        </div>
      ) : null}
      {!loading && !error && !hasData ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/10 p-4 text-sm text-slate-500 md:bg-slate-50/80 dark:border-slate-700 dark:bg-white/10 md:dark:bg-slate-800/60 dark:text-slate-300">
          Weekly weather data is unavailable.
        </div>
      ) : null}
    </section>
  )
}
