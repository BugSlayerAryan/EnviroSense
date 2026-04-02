import { LocateFixed, Search } from "lucide-react"

interface MapControlsProps {
  searchValue: string
  onSearchValueChange: (value: string) => void
  onSearchSubmit: () => void
  onUseCurrentLocation: () => void
  isLocating: boolean
}

export function MapControls({
  searchValue,
  onSearchValueChange,
  onSearchSubmit,
  onUseCurrentLocation,
  isLocating,
}: MapControlsProps) {
  return (
    <div className="pointer-events-auto w-full max-w-xl space-y-3 rounded-2xl border border-white/50 bg-white/88 p-3 shadow-xl backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/80">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950/70">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            aria-label="Search city"
            value={searchValue}
            onChange={(event) => onSearchValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                onSearchSubmit()
              }
            }}
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
        </label>

        <button
          type="button"
          onClick={onSearchSubmit}
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Search
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onUseCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-emerald-700/70 dark:bg-emerald-900/30 dark:text-emerald-200"
        >
          {isLocating ? <span className="inline-block h-3.5 w-3.5 rounded-full bg-emerald-500/70 animate-pulse dark:bg-emerald-300/70" /> : <LocateFixed className="h-3.5 w-3.5" />}
          {isLocating ? "Locating..." : "Use Current Location"}
        </button>
      </div>
    </div>
  )
}
