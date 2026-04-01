import type { CityMarker } from "@/components/dashboard/maps/types"

export const CITY_MARKERS: CityMarker[] = [
  {
    id: "delhi",
    city: "Delhi",
    country: "India",
    lat: 28.6139,
    lng: 77.209,
    data: { aqi: 162, temperature: 34, uv: 8 },
  },
  {
    id: "mumbai",
    city: "Mumbai",
    country: "India",
    lat: 19.076,
    lng: 72.8777,
    data: { aqi: 92, temperature: 31, uv: 7 },
  },
  {
    id: "london",
    city: "London",
    country: "United Kingdom",
    lat: 51.5072,
    lng: -0.1276,
    data: { aqi: 46, temperature: 17, uv: 3 },
  },
  {
    id: "new-york",
    city: "New York",
    country: "United States",
    lat: 40.7128,
    lng: -74.006,
    data: { aqi: 58, temperature: 22, uv: 5 },
  },
  {
    id: "tokyo",
    city: "Tokyo",
    country: "Japan",
    lat: 35.6762,
    lng: 139.6503,
    data: { aqi: 71, temperature: 26, uv: 6 },
  },
]

export const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]
