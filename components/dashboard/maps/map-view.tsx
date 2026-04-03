"use client"

import { useEffect } from "react"
import L from "leaflet"
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
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

function isValidCoord(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng)
}

function createMarkerIcon(marker: CityMarker) {
  const size = marker.isCurrentLocation ? 22 : 18
  const haloSize = marker.isCurrentLocation ? 34 : 28

  return L.divIcon({
    className: "enviro-marker",
    iconSize: [size + 20, size + 30],
    iconAnchor: [Math.round((size + 20) / 2), size + 22],
    popupAnchor: [0, -(size + 18)],
    html: `
      <span class="env-pin ${marker.isCurrentLocation ? "is-active" : ""}" style="--pin-size:${size}px;--pin-halo:${haloSize}px;">
        <span class="env-pin__halo"></span>
        <span class="env-pin__body">
          <span class="env-pin__gloss"></span>
          <span class="env-pin__dot"></span>
        </span>
        <span class="env-pin__tip"></span>
        <span class="env-pin__ground"></span>
      </span>
    `,
  })
}

export function MapView({ markers, center, zoom, activeLayer, tileUrl, tileAttribution }: MapViewProps) {
  const [centerLat, centerLng] = center
  const hasValidCenter = isValidCoord(centerLat, centerLng)
  const safeCenter: [number, number] = hasValidCenter ? center : [20.5937, 78.9629]
  const safeMarkers = markers.filter((marker) => Number.isFinite(marker.lat) && Number.isFinite(marker.lng))

  if (!hasValidCenter) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white/5 text-sm text-slate-500 dark:text-slate-300">
        Location data unavailable
      </div>
    )
  }

  return (
    <>
      <style>{`
        .enviro-marker {
          background: transparent;
          border: 0;
        }

        .env-pin {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: var(--pin-size);
          height: calc(var(--pin-size) + 10px);
          transform: translateZ(0);
        }

        .env-pin__halo {
          position: absolute;
          width: var(--pin-halo);
          height: var(--pin-halo);
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(234,67,53,0.32) 0%, rgba(234,67,53,0.08) 65%, rgba(234,67,53,0) 100%);
          filter: blur(1px);
        }

        .env-pin__body {
          position: relative;
          z-index: 2;
          width: var(--pin-size);
          height: var(--pin-size);
          border-radius: 9999px;
          background: linear-gradient(155deg, #f16d62 0%, #ea4335 45%, #c62828 100%);
          border: 2px solid #ffffff;
          box-shadow: 0 10px 20px rgba(15,23,42,0.26);
          overflow: hidden;
        }

        .env-pin__gloss {
          position: absolute;
          top: 1px;
          left: 2px;
          width: 65%;
          height: 45%;
          border-radius: 9999px;
          background: linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0));
        }

        .env-pin__dot {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          transform: translate(-50%, -50%);
          background: #ffffff;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.2);
        }

        .env-pin__tip {
          position: absolute;
          top: calc(var(--pin-size) - 2px);
          left: 50%;
          z-index: 1;
          width: 10px;
          height: 10px;
          transform: translateX(-50%) rotate(45deg);
          background: linear-gradient(155deg, #ea4335 0%, #c62828 100%);
          box-shadow: 0 6px 12px rgba(15,23,42,0.2);
        }

        .env-pin__ground {
          position: absolute;
          bottom: -8px;
          width: 14px;
          height: 5px;
          border-radius: 9999px;
          background: rgba(15,23,42,0.22);
          filter: blur(1.5px);
        }

        @keyframes enviroPulse {
          0% { transform: scale(0.9); opacity: 0.28; }
          70% { transform: scale(1.25); opacity: 0.08; }
          100% { transform: scale(1.35); opacity: 0; }
        }

        .env-pin.is-active .env-pin__halo {
          animation: enviroPulse 2.1s ease-out infinite;
          opacity: 0.35;
        }

        .env-pin.is-active .env-pin__body {
          box-shadow: 0 12px 24px rgba(15,23,42,0.32), 0 0 0 4px rgba(255,255,255,0.2);
        }
      `}</style>
      <MapContainer key={`${safeCenter[0]}-${safeCenter[1]}-${zoom}`} center={safeCenter} zoom={zoom} className="h-full w-full" zoomControl scrollWheelZoom>
      <TileLayer attribution={tileAttribution} url={tileUrl} />

      {safeMarkers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={createMarkerIcon(marker)}
        >
          <Popup>
            <MarkerPopup marker={marker} activeLayer={activeLayer} />
          </Popup>
        </Marker>
      ))}
      </MapContainer>
    </>
  )
}
