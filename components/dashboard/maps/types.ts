export type LayerView = "aqi" | "weather" | "uv"

export interface EnvironmentalData {
  aqi: number
  temperature: number
  uv: number
}

export interface CityMarker {
  id: string
  city: string
  country: string
  lat: number
  lng: number
  data: EnvironmentalData
  isCurrentLocation?: boolean
}
