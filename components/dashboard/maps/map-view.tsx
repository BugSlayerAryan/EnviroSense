"use client"

import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet"
import type { CityMarker, LayerView } from "@/components/dashboard/maps/types"
import { MarkerPopup } from "@/components/dashboard/maps/marker-popup"

interface MapViewProps {
  markers: CityMarker[]
  center: [number, number]
  zoom: number
  activeLayer: LayerView
  tileUrl: string
  tileAttribution: string
}

function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  map.setView(center, zoom)
  return null
}

function getLayerColor(marker: CityMarker, activeLayer: LayerView) {
  if (activeLayer === "aqi") {
    if (marker.data.aqi <= 50) return "#16a34a"
    if (marker.data.aqi <= 100) return "#eab308"
    if (marker.data.aqi <= 150) return "#f97316"
    return "#dc2626"
  }

  if (activeLayer === "weather") {
    return marker.data.temperature >= 30 ? "#ef4444" : marker.data.temperature <= 15 ? "#3b82f6" : "#0ea5e9"
  }

  if (marker.data.uv <= 2) return "#22c55e"
  if (marker.data.uv <= 5) return "#eab308"
  if (marker.data.uv <= 7) return "#f97316"
  return "#dc2626"
}

export function MapView({ markers, center, zoom, activeLayer, tileUrl, tileAttribution }: MapViewProps) {
  return (
    <MapContainer center={center} zoom={zoom} className="h-full w-full" zoomControl scrollWheelZoom>
      <TileLayer attribution={tileAttribution} url={tileUrl} />
      <RecenterMap center={center} zoom={zoom} />

      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.lat, marker.lng]}
          radius={marker.isCurrentLocation ? 10 : 8}
          pathOptions={{
            color: "#ffffff",
            weight: 1.5,
            fillOpacity: 0.95,
            fillColor: getLayerColor(marker, activeLayer),
          }}
        >
          <Popup>
            <MarkerPopup marker={marker} activeLayer={activeLayer} />
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
