import type { CityMarker, LayerView } from "@/components/dashboard/maps/types"

interface MarkerPopupProps {
  marker: CityMarker
  activeLayer: LayerView
}

const AQI_LABELS: Array<{ max: number; label: string }> = [
  { max: 50, label: "Good" },
  { max: 100, label: "Moderate" },
  { max: 150, label: "Unhealthy (Sensitive)" },
  { max: 200, label: "Unhealthy" },
  { max: Number.POSITIVE_INFINITY, label: "Very Unhealthy" },
]

function getAqiLabel(value: number) {
  return AQI_LABELS.find((bucket) => value <= bucket.max)?.label ?? "Unknown"
}

export function MarkerPopup({ marker, activeLayer }: MarkerPopupProps) {
  return (
    <div className="min-w-44 space-y-1.5 text-slate-900">
      <p className="text-sm font-bold">
        {marker.city}, {marker.country}
      </p>

      {activeLayer === "aqi" ? (
        <p className="text-xs font-medium">
          AQI: <span className="font-bold">{marker.data.aqi}</span> ({getAqiLabel(marker.data.aqi)})
        </p>
      ) : null}

      {activeLayer === "weather" ? (
        <p className="text-xs font-medium">
          Temperature: <span className="font-bold">{marker.data.temperature}°C</span>
        </p>
      ) : null}

      {activeLayer === "uv" ? (
        <p className="text-xs font-medium">
          UV Index: <span className="font-bold">{marker.data.uv}</span>
        </p>
      ) : null}

      {marker.isCurrentLocation ? <p className="pt-1 text-[11px] text-slate-600">Using your current location.</p> : null}
    </div>
  )
}
