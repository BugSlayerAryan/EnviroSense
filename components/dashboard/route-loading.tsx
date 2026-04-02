"use client"

import { DashboardBackground } from "@/components/dashboard/background"
import { Skeleton } from "@/components/ui/skeleton"

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative h-dvh overflow-hidden">
      <DashboardBackground />
      <div className="relative z-10 flex h-full w-full">
        <aside className="hidden h-full w-56 shrink-0 flex-col rounded-r-2xl border-r border-white/20 bg-white/50 px-4 py-5 backdrop-blur-xl lg:flex xl:w-64 dark:border-white/10 dark:bg-white/5">
          <div className="mb-8 flex items-center gap-3 px-1">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>
          </div>

          <div className="space-y-2.5">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={`sidebar-skeleton-${index}`} className="h-10 rounded-xl" />
            ))}
          </div>

          <div className="mt-auto space-y-4">
            <div className="glass-card p-4">
              <Skeleton className="mb-3 h-4 w-32 rounded-full" />
              <Skeleton className="mb-3 h-5 w-40 rounded-full" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
            <div className="rounded-lg border border-white/20 bg-white/30 px-3.5 py-3 dark:border-white/10 dark:bg-white/5">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="mt-2 h-3 w-20 rounded-full" />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex flex-1 flex-col">
          <div className="sticky top-0 z-20 shrink-0 border-b border-white/30 px-3 py-2.5 backdrop-blur-xl dark:border-white/10">
            <div className="flex min-h-12 items-center gap-2 sm:gap-3 lg:gap-4">
              <div className="flex h-12 min-w-12 shrink-0 items-center justify-center lg:hidden">
                <Skeleton className="h-12 w-12 rounded-2xl" />
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-center">
                <Skeleton className="h-11 w-full max-w-150 rounded-xl" />
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <Skeleton className="h-11 w-11 rounded-xl" />
              </div>
            </div>
          </div>

          {children}
        </div>
      </div>
    </main>
  )
}

export function DashboardHomeLoading() {
  return (
    <Shell>
      <section className="dashboard-scroll flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
        <div className="space-y-6">
          <Skeleton className="h-96 rounded-2xl" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            <Skeleton className="h-55 rounded-2xl" />
            <Skeleton className="h-55 rounded-2xl" />
            <Skeleton className="h-55 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
          <Skeleton className="h-45 rounded-2xl" />
        </div>
      </section>
    </Shell>
  )
}

export function DashboardSectionLoading() {
  return (
    <Shell>
      <section className="dashboard-scroll flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <Skeleton className="h-28 rounded-2xl" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
          <Skeleton className="h-65 rounded-2xl" />
        </div>
      </section>
    </Shell>
  )
}

export function WeatherPageLoading() {
  return (
    <Shell>
      <section className="dashboard-scroll flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <Skeleton className="h-80 rounded-2xl sm:h-96" />
          <Skeleton className="h-56 rounded-2xl sm:h-60" />
          <Skeleton className="h-58 rounded-2xl sm:h-60" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
          <Skeleton className="h-65 rounded-2xl" />
          <Skeleton className="h-55 rounded-2xl" />
        </div>
      </section>
    </Shell>
  )
}

export function UvPageLoading() {
  return (
    <Shell>
      <section className="dashboard-scroll flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <Skeleton className="h-60 rounded-2xl sm:h-72" />
          <Skeleton className="h-90 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </section>
    </Shell>
  )
}

export function AqiPageLoading() {
  return (
    <Shell>
      <section className="dashboard-scroll flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <Skeleton className="h-96 rounded-2xl sm:h-96" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`aqi-loading-card-${index}`} className="h-44 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Skeleton className="h-104 rounded-2xl" />
            <Skeleton className="h-104 rounded-2xl" />
          </div>
          <Skeleton className="h-65 rounded-2xl" />
        </div>
      </section>
    </Shell>
  )
}

export function CityNotFoundLoading() {
  return (
    <Shell>
      <section className="dashboard-scroll flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/35 bg-white/65 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55 sm:p-8">
          <div className="mb-6 space-y-3">
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-12 w-3/4 rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-5/6 rounded-full" />
          </div>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <Skeleton className="h-20 w-20 rounded-2xl" />
              <Skeleton className="h-6 w-52 rounded-full" />
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-5/6 rounded-full" />
              <Skeleton className="h-28 rounded-2xl" />
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-11 w-36 rounded-xl" />
                <Skeleton className="h-11 w-36 rounded-xl" />
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-white/70 bg-white/70 p-5 shadow-inner dark:border-white/10 dark:bg-slate-900/45">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={`city-skeleton-${index}`} className="h-12 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </Shell>
  )
}
