"use client"

import dynamic from "next/dynamic"
import { useMemo, useState } from "react"
import { MapPin } from "lucide-react"
import { useTheme } from "next-themes"
import { CITY_MARKERS, DEFAULT_CENTER } from "@/components/dashboard/maps/mock-data"
import type { LayerView } from "@/components/dashboard/maps/types"

const MapView = dynamic(
  () => import("@/components/dashboard/maps/map-view").then((module) => module.MapView),
  { ssr: false },
)

const LAYERS: Array<{ id: LayerView; label: string }> = [
  { id: "aqi", label: "AQI View" },
  { id: "weather", label: "Weather View" },
  { id: "uv", label: "UV View" },
]

export function MapDashboard() {
  const [markers] = useState(CITY_MARKERS)
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [zoom, setZoom] = useState(4)
  const [activeLayer, setActiveLayer] = useState<LayerView>("aqi")

  const currentLocationLabel = "Delhi, India"

  const { resolvedTheme } = useTheme()

  const tileUrl = useMemo(() => {
    return resolvedTheme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  }, [resolvedTheme])

  const tileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO'

  return (
    <section className="dashboard-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Environmental Map</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl lg:text-4xl">
              <span className="bg-linear-to-r from-[#60a5fa] via-[#34d399] to-[#60a5fa] bg-clip-text text-transparent">
                Maps &amp; Location Explorer
              </span>
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Explore AQI, Weather, and UV layers across cities with a clean interactive map view.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-white/50 bg-white/88 p-3 shadow-xl backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/80 lg:w-auto lg:min-w-105">
            <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Layers</p>
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white/85 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-sky-300" />
                <span className="truncate">Current Location: {currentLocationLabel}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end">
              {LAYERS.map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => setActiveLayer(layer.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeLayer === layer.id
                      ? "bg-linear-to-r from-slate-900 to-slate-700 text-white dark:from-slate-100 dark:to-slate-200 dark:text-slate-900"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      activeLayer === layer.id ? "bg-emerald-300 dark:bg-emerald-500" : "bg-slate-400 dark:bg-slate-500"
                    }`}
                  />
                  {layer.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/40 bg-white/50 p-2.5 shadow-xl backdrop-blur-sm sm:p-3 dark:border-white/10 dark:bg-slate-900/35">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-950">
            <div className="h-[60vh] min-h-80 w-full sm:h-[68vh] sm:min-h-105">
              <MapView
                markers={markers}
                center={center}
                zoom={zoom}
                activeLayer={activeLayer}
                tileUrl={tileUrl}
                tileAttribution={tileAttribution}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">Mock environmental data structure is API-ready and easy to extend.</span>
        </div>
      </div>
    </section>
  )
}
