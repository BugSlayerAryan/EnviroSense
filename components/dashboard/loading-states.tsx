"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function LoadingCard({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/40 bg-white/60 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.12)] ring-1 ring-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_0_40px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function EnvironmentScoreSkeleton() {
  return (
    <div className="glass-card relative overflow-hidden p-0 w-full max-w-md mx-auto bg-white/90 dark:bg-slate-900/80 sm:bg-white/80 sm:dark:bg-slate-900/70">
      <div className="relative z-10 flex flex-col gap-3 p-4 sm:grid sm:grid-cols-[minmax(0,1fr)_260px] sm:p-4 lg:p-5">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="space-y-2">
              <Skeleton className="h-5 w-44 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-3.5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>

          <div className="mb-2 flex items-end gap-2">
            <Skeleton className="h-12 w-20 rounded-xl sm:h-14 sm:w-24" />
            <Skeleton className="mb-1 h-4 w-10 rounded-full" />
          </div>

          <Skeleton className="mb-2 h-12 w-full rounded-xl" />
          <Skeleton className="mb-2 h-16 w-full rounded-xl" />

          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-44 rounded-full" />
          </div>

          <div className="mt-2 space-y-2 border-t border-white/20 pt-2 dark:border-white/10">
            <Skeleton className="h-8 w-56 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-5/6 rounded-full" />
              <Skeleton className="h-4 w-2/3 rounded-full" />
            </div>
          </div>
        </div>

        <LoadingCard className="flex h-full min-h-52.5 flex-col p-2.5 items-center justify-center">
          <div className="mb-2 flex items-center justify-between w-full">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
          <div className="relative flex flex-1 items-center justify-center py-1 w-full">
            <div className="absolute inset-0 rounded-full bg-linear-to-tr from-slate-300/30 via-slate-200/30 to-slate-300/20 blur-2xl dark:from-slate-600/20 dark:via-slate-500/15 dark:to-slate-600/10" />
            <div className="relative flex items-center justify-center">
              <Skeleton className="h-36 w-36 rounded-full border border-white/40" />
              <Skeleton className="absolute inset-6 rounded-full" />
              <Skeleton className="absolute inset-10 rounded-full" />
              <Skeleton className="absolute inset-x-8 bottom-8 h-3 rounded-full" />
            </div>
          </div>
        </LoadingCard>
      </div>
    </div>
  )
}

export function MetricCardSkeleton() {
  return (
    <LoadingCard className="min-h-44 p-3.5 sm:p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-3 w-40 rounded-full" />
        </div>
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="mb-4 h-20 rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-9 rounded-lg" />
        <Skeleton className="h-9 rounded-lg" />
        <Skeleton className="h-9 rounded-lg" />
      </div>
    </LoadingCard>
  )
}

export function WeatherMetricSkeleton() {
  return (
    <div className="glass-card glow-blue flex h-full flex-col p-3.5 shadow-md sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-3 w-40 rounded-full" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>

      <Skeleton className="mb-3.5 h-24 rounded-xl sm:h-28" />

      <div className="mt-auto grid grid-cols-3 gap-2 sm:gap-2.5">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
    </div>
  )
}

export function UvMetricSkeleton() {
  return (
    <div className="glass-card glow-yellow flex h-full flex-col p-3.5 shadow-md sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-3 w-44 rounded-full" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>

      <Skeleton className="mb-3.5 h-24 rounded-xl sm:h-28" />

      <div className="mt-auto space-y-2">
        <Skeleton className="h-7 rounded-lg" />
        <Skeleton className="h-7 rounded-lg" />
      </div>

      <Skeleton className="mt-2 h-8 rounded-lg" />
    </div>
  )
}

export function AqiMetricSkeleton() {
  return (
    <div className="glass-card glow-red flex h-full flex-col p-3.5 shadow-md sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-3 w-44 rounded-full" />
        </div>
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>

      <Skeleton className="mb-3 h-20 rounded-xl" />

      <div className="space-y-2 border-t border-white/20 pt-3 dark:border-white/10">
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
      </div>
    </div>
  )
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <LoadingCard className={cn("p-4 sm:p-5 md:p-6", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded-full" />
          <Skeleton className="h-3 w-28 rounded-full" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <Skeleton className="h-40 rounded-2xl sm:h-44 md:h-48" />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
    </LoadingCard>
  )
}

export function ForecastListSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`forecast-skeleton-${index}`}
          className="h-18 rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-white/70 dark:border-slate-700/70 dark:bg-slate-800/65 dark:ring-slate-700/50"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-3 w-36 rounded-full" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function UvDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <LoadingCard className="grid min-h-72 grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-10 w-56 rounded-full" />
            <Skeleton className="h-4 w-72 max-w-full rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        </div>
        <div className="flex items-center justify-center">
          <LoadingCard className="flex h-full min-h-56 w-full flex-col items-center justify-center p-4 sm:p-5">
            <Skeleton className="h-40 w-40 rounded-full" />
            <Skeleton className="mt-4 h-4 w-32 rounded-full" />
            <Skeleton className="mt-2 h-3 w-24 rounded-full" />
          </LoadingCard>
        </div>
      </LoadingCard>

      <ChartSkeleton className="min-h-90" />

      <LoadingCard className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-3 w-40 rounded-full" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <ForecastListSkeleton rows={7} />
      </LoadingCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LoadingCard className="h-80 p-4 sm:p-5">
          <div className="space-y-3">
            <Skeleton className="h-4 w-40 rounded-full" />
            <Skeleton className="h-3 w-56 rounded-full" />
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={`uv-guide-skeleton-${index}`} className="h-16 rounded-2xl" />
            ))}
          </div>
        </LoadingCard>
        <LoadingCard className="h-80 p-4 sm:p-5">
          <div className="space-y-3">
            <Skeleton className="h-4 w-40 rounded-full" />
            <Skeleton className="h-3 w-52 rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </LoadingCard>
      </div>

      <LoadingCard className="h-48 p-4 sm:p-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-44 rounded-full" />
          <Skeleton className="h-3 w-56 rounded-full" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`uv-alert-skeleton-${index}`} className="h-28 rounded-2xl" />
          ))}
        </div>
      </LoadingCard>
    </div>
  )
}

export function WeatherDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <LoadingCard className="grid min-h-84 grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-11 w-60 rounded-full" />
            <Skeleton className="h-4 w-72 max-w-full rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`weather-snapshot-${index}`} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
        <LoadingCard className="flex h-full min-h-56 flex-col p-4 sm:p-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-24 rounded-2xl" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </LoadingCard>
      </LoadingCard>

      <LoadingCard className="p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded-full" />
            <Skeleton className="h-3 w-28 rounded-full" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`weather-hourly-skeleton-${index}`} className="rounded-2xl border border-white/40 bg-white/55 p-3 dark:border-white/10 dark:bg-white/8">
              <Skeleton className="h-3 w-12 rounded-full" />
              <Skeleton className="mt-3 h-8 w-8 rounded-xl" />
              <Skeleton className="mt-3 h-5 w-12 rounded-full" />
              <Skeleton className="mt-2 h-1.5 rounded-full" />
            </div>
          ))}
        </div>
      </LoadingCard>

      <LoadingCard className="p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-3 w-40 rounded-full" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <ForecastListSkeleton rows={7} />
      </LoadingCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LoadingCard className="h-80 p-4 sm:p-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded-full" />
            <Skeleton className="h-3 w-52 rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`weather-detail-skeleton-${index}`} className="h-24 rounded-2xl" />
            ))}
          </div>
        </LoadingCard>
        <LoadingCard className="h-80 p-4 sm:p-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded-full" />
            <Skeleton className="h-3 w-52 rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </LoadingCard>
      </div>

      <LoadingCard className="h-65 p-4 sm:p-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 rounded-full" />
          <Skeleton className="h-3 w-60 rounded-full" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`weather-extra-${index}`} className="h-20 rounded-2xl" />
          ))}
        </div>
      </LoadingCard>

      <LoadingCard className="h-55 p-4 sm:p-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded-full" />
          <Skeleton className="h-3 w-52 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-28 rounded-2xl" />
      </LoadingCard>
    </div>
  )
}

export function AqiDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <LoadingCard className="grid min-h-96 grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-11 w-52 rounded-full" />
            <Skeleton className="h-4 w-72 max-w-full rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`aqi-kpi-${index}`} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
        <LoadingCard className="flex h-full min-h-64 flex-col p-4 sm:p-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-40 rounded-2xl" />
        </LoadingCard>
      </LoadingCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingCard key={`aqi-pollutant-${index}`} className="h-44 p-4 sm:p-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-3 w-40 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-18 rounded-2xl" />
            <Skeleton className="mt-4 h-2 rounded-full" />
          </LoadingCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LoadingCard className="h-104 p-4 sm:p-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded-full" />
            <Skeleton className="h-3 w-52 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-72 rounded-2xl" />
        </LoadingCard>
        <LoadingCard className="h-104 p-4 sm:p-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded-full" />
            <Skeleton className="h-3 w-52 rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        </LoadingCard>
      </div>

      <LoadingCard className="h-65 p-4 sm:p-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 rounded-full" />
          <Skeleton className="h-3 w-60 rounded-full" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`aqi-guidance-${index}`} className="h-24 rounded-2xl" />
          ))}
        </div>
      </LoadingCard>
    </div>
  )
}
