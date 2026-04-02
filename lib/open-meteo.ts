const OPEN_METEO_GEOCODING = "https://geocoding-api.open-meteo.com/v1/search"
const OPEN_METEO_REVERSE = "https://geocoding-api.open-meteo.com/v1/reverse"

export type OpenMeteoLocation = {
  name: string
  country: string
  latitude: number
  longitude: number
  admin1?: string | null
  timezone?: string | null
}

function toFiniteNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

async function fetchJson(url: string) {
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) return null
  return response.json()
}

function normalizeCityCandidates(city: string) {
  const trimmed = city.trim()
  const baseCity = trimmed.split(",")[0]?.trim() ?? ""
  return Array.from(new Set([trimmed, baseCity].filter(Boolean)))
}

function mapLocation(payload: any): OpenMeteoLocation | null {
  const first = Array.isArray(payload?.results) ? payload.results[0] : null
  if (!first) return null
  const latitude = toFiniteNumber(first.latitude, NaN)
  const longitude = toFiniteNumber(first.longitude, NaN)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  return {
    name: first.name ?? "Unknown",
    country: first.country ?? "",
    latitude,
    longitude,
    admin1: first.admin1 ?? null,
    timezone: first.timezone ?? null,
  }
}

export async function resolveOpenMeteoCity(city: string): Promise<OpenMeteoLocation | null> {
  for (const candidate of normalizeCityCandidates(city)) {
    const payload = await fetchJson(`${OPEN_METEO_GEOCODING}?name=${encodeURIComponent(candidate)}&count=1&language=en&format=json`)
    const location = mapLocation(payload)
    if (location) return location
  }

  return null
}

export async function reverseOpenMeteoLocation(lat: number, lon: number): Promise<OpenMeteoLocation | null> {
  const payload = await fetchJson(`${OPEN_METEO_REVERSE}?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&count=1&language=en&format=json`)
  return mapLocation(payload)
}

export function weatherCodeToSummary(code: number | null | undefined) {
  if (code === 0) {
    return { condition: "Clear", description: "Clear sky", icon: "sun" as const }
  }

  if (code === 1 || code === 2) {
    return { condition: "Partly Cloudy", description: code === 1 ? "Mainly clear" : "Partly cloudy", icon: "partly" as const }
  }

  if (code === 3) {
    return { condition: "Cloudy", description: "Overcast", icon: "cloud" as const }
  }

  if (code === 45 || code === 48) {
    return { condition: "Fog", description: "Foggy conditions", icon: "cloud" as const }
  }

  if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57) {
    return { condition: "Drizzle", description: "Light drizzle", icon: "rain" as const }
  }

  if (code === 61 || code === 63 || code === 65 || code === 66 || code === 67) {
    return { condition: "Rain", description: "Rainfall expected", icon: "rain" as const }
  }

  if (code === 71 || code === 73 || code === 75 || code === 77) {
    return { condition: "Snow", description: "Snowfall expected", icon: "cloud" as const }
  }

  if (code === 80 || code === 81 || code === 82) {
    return { condition: "Rain", description: "Rain showers", icon: "rain" as const }
  }

  if (code === 85 || code === 86) {
    return { condition: "Snow", description: "Snow showers", icon: "cloud" as const }
  }

  if (code === 95 || code === 96 || code === 99) {
    return { condition: "Storm", description: "Thunderstorm activity", icon: "rain" as const }
  }

  return { condition: "Unknown", description: "Live conditions unavailable", icon: "cloud" as const }
}

export function formatLocalTime(value: string, timeZone?: string | null) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timeZone ?? undefined,
  })
}

export function formatLocalHour(value: string, timeZone?: string | null) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    hour12: true,
    timeZone: timeZone ?? undefined,
  })
}

export function formatLocalHour24(value: string, timeZone?: string | null) {
  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    hour12: false,
    timeZone: timeZone ?? undefined,
  })
}

export function formatLocalDateLabel(value: string, timeZone?: string | null) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: timeZone ?? undefined,
  })
}

export function formatLocalDayLabel(value: string, timeZone?: string | null) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: timeZone ?? undefined,
  })
}

export function formatLocalDateKey(value: string, timeZone?: string | null) {
  return new Date(value).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timeZone ?? undefined,
  })
}

export function weekdayFromDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  })
}

export function daylightHoursFromIso(sunrise?: string | null, sunset?: string | null) {
  if (!sunrise || !sunset) return null
  const sunriseMs = new Date(sunrise).getTime()
  const sunsetMs = new Date(sunset).getTime()
  if (!Number.isFinite(sunriseMs) || !Number.isFinite(sunsetMs) || sunsetMs <= sunriseMs) return null
  const totalMinutes = Math.round((sunsetMs - sunriseMs) / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`
}
