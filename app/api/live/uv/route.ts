import { NextRequest, NextResponse } from "next/server"
import {
  formatLocalDayLabel,
  formatLocalHour,
  formatLocalHour24,
  resolveOpenMeteoCity,
} from "@/lib/open-meteo"

const OPEN_WEATHER_GEO = "https://api.openweathermap.org/geo/1.0/direct"
const ONE_CALL_V3 = "https://api.openweathermap.org/data/3.0/onecall"
const ONE_CALL_V25 = "https://api.openweathermap.org/data/2.5/onecall"
const OPEN_WEATHER_CURRENT = "https://api.openweathermap.org/data/2.5/weather"
const OPEN_WEATHER_FORECAST = "https://api.openweathermap.org/data/2.5/forecast"
const OPEN_METEO_FORECAST = "https://api.open-meteo.com/v1/forecast"

function resolveWeatherApiKey() {
  return (
    process.env.WEATHER_API_KEY
    ?? process.env.WEATHER_KEY
    ?? process.env.OPENWEATHER_API_KEY
    ?? process.env.OPENWEATHER_KEY
    ?? process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
    ?? process.env.NEXT_PUBLIC_OPENWEATHER_KEY
    ?? process.env.NEXT_PUBLIC_WEATHER_API_KEY
    ?? process.env.NEXT_PUBLIC_WEATHER_KEY
    ?? process.env.VITE_WEATHER_KEY
  )
}

const DEFAULT_HOURLY: Array<{ time: string; hour24: number; uv: number; slotLabel?: string }> = []

const DEFAULT_WEEKLY: Array<{ day: string; uvMax: number }> = []

function toFiniteNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function estimateUvBySun(cloudPercent: number, dt: number, sunrise: number, sunset: number) {
  if (!sunrise || !sunset || dt <= sunrise || dt >= sunset) return 0
  const span = sunset - sunrise
  if (span <= 0) return 0
  const progress = (dt - sunrise) / span
  const solarFactor = Math.sin(Math.PI * progress)
  const cloudFactor = Math.max(0.15, 1 - cloudPercent / 100)
  const estimated = 11 * solarFactor * cloudFactor
  return Number(Math.max(0, estimated).toFixed(1))
}

function estimateUvByLocalHour(hour24: number, cloudPercent: number) {
  if (hour24 < 6 || hour24 > 18) return 0
  const progress = (hour24 - 6) / 12
  const solarFactor = Math.sin(Math.PI * progress)
  const cloudFactor = Math.max(0.15, 1 - cloudPercent / 100)
  const estimated = 11 * solarFactor * cloudFactor
  return Number(Math.max(0, estimated).toFixed(1))
}

function toHourLabel(unixTime: number, timezoneOffsetSeconds = 0) {
  return new Date((unixTime + timezoneOffsetSeconds) * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  })
}

function toDayLabel(unixTime: number) {
  return new Date(unixTime * 1000).toLocaleDateString("en-US", { weekday: "short" })
}

function toLocalHour(unixTime: number, timezoneOffsetSeconds = 0) {
  return new Date((unixTime + timezoneOffsetSeconds) * 1000).getUTCHours()
}

function toLocalDayLabel(unixTime: number, timezoneOffsetSeconds = 0) {
  return new Date((unixTime + timezoneOffsetSeconds) * 1000).toLocaleDateString("en-US", { weekday: "short" })
}

function toSlotLabel(unixTime: number, timezoneOffsetSeconds = 0) {
  return `${toLocalDayLabel(unixTime, timezoneOffsetSeconds)} ${toHourLabel(unixTime, timezoneOffsetSeconds)}`
}

function daylightHoursFromIso(sunrise?: string | null, sunset?: string | null) {
  if (!sunrise || !sunset) return null
  const sunriseMs = new Date(sunrise).getTime()
  const sunsetMs = new Date(sunset).getTime()
  if (!Number.isFinite(sunriseMs) || !Number.isFinite(sunsetMs) || sunsetMs <= sunriseMs) return null
  return Number(((sunsetMs - sunriseMs) / (1000 * 60 * 60)).toFixed(1))
}

async function tryOpenMeteoUv(city: string) {
  const location = await resolveOpenMeteoCity(city)
  if (!location) return null

  const forecastUrl = `${OPEN_METEO_FORECAST}?latitude=${location.latitude}&longitude=${location.longitude}&current=uv_index,temperature_2m,weather_code&hourly=uv_index,cloud_cover&daily=uv_index_max,sunrise,sunset&timezone=auto&forecast_days=7`
  const response = await fetch(forecastUrl, { cache: "no-store" })
  if (!response.ok) return null

  const data = await response.json()
  const timeZone = data?.timezone ?? location.timezone ?? "UTC"
  const hourlyTimes = Array.isArray(data?.hourly?.time) ? data.hourly.time : []
  const dailyTimes = Array.isArray(data?.daily?.time) ? data.daily.time : []

  const hourly = hourlyTimes.slice(0, 24).map((time: string, index: number) => {
    const uv = typeof data?.hourly?.uv_index?.[index] === "number" ? Number(data.hourly.uv_index[index].toFixed(1)) : 0
    return {
      time: formatLocalHour(time, timeZone),
      hour24: Number(formatLocalHour24(time, timeZone)),
      uv,
      slotLabel: `${formatLocalDayLabel(time, timeZone)} ${formatLocalHour(time, timeZone)}`,
    }
  })

  const weekly = dailyTimes.slice(0, 7).map((time: string, index: number) => ({
    day: formatLocalDayLabel(time, timeZone),
    uvMax: typeof data?.daily?.uv_index_max?.[index] === "number" ? Number(data.daily.uv_index_max[index].toFixed(1)) : 0,
  }))

  const sunrise = data?.daily?.sunrise?.[0] ?? null
  const sunset = data?.daily?.sunset?.[0] ?? null

  return {
    location: location.country ? `${location.name}, ${location.country}` : location.name,
    currentUv: typeof data?.current?.uv_index === "number" ? Number(data.current.uv_index.toFixed(1)) : 0,
    hourly: hourly.length > 0 ? hourly : [],
    weekly: weekly.length > 0 ? weekly : [],
    sunlightHours: daylightHoursFromIso(sunrise, sunset),
    estimatedRadiationWm2: typeof data?.current?.uv_index === "number" ? Number((data.current.uv_index * 20).toFixed(0)) : null,
    updatedAt: new Date().toISOString(),
    provider: "open-meteo",
  }
}

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city") ?? "New Delhi"

  const fallbackPayload = {
    location: city,
    currentUv: 0,
    hourly: DEFAULT_HOURLY,
    weekly: DEFAULT_WEEKLY,
    sunlightHours: null,
    estimatedRadiationWm2: null,
    updatedAt: new Date().toISOString(),
  }

  const apiKey = resolveWeatherApiKey()
  try {
    const openMeteoPayload = await tryOpenMeteoUv(city)
    if (openMeteoPayload) {
      return NextResponse.json(openMeteoPayload, { status: 200 })
    }
  } catch {
    // Fall through to the OpenWeather path.
  }

  if (!apiKey) {
    return NextResponse.json(
      { ...fallbackPayload, warning: "Missing weather API key on server" },
      { status: 200 },
    )
  }

  try {
    const geoUrl = `${OPEN_WEATHER_GEO}?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`
    const geoResponse = await fetch(geoUrl, { cache: "no-store" })
    if (!geoResponse.ok) {
      return NextResponse.json(
        { ...fallbackPayload, warning: "Failed to fetch geolocation" },
        { status: 200 },
      )
    }

    const geoData = await geoResponse.json()
    const first = geoData?.[0]
    if (!first?.lat || !first?.lon) {
      return NextResponse.json(
        { ...fallbackPayload, warning: "City not found for UV data" },
        { status: 200 },
      )
    }

    const lat = first.lat
    const lon = first.lon

    const oneCallUrls = [
      `${ONE_CALL_V3}?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,alerts&appid=${apiKey}`,
      `${ONE_CALL_V25}?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,alerts&appid=${apiKey}`,
    ]

    let oneCallData: any = null
    for (const url of oneCallUrls) {
      const res = await fetch(url, { cache: "no-store" })
      if (res.ok) {
        oneCallData = await res.json()
        break
      }
    }

    if (!oneCallData) {
      const weatherUrl = `${OPEN_WEATHER_CURRENT}?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
      const forecastUrl = `${OPEN_WEATHER_FORECAST}?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
      const weatherResponse = await fetch(weatherUrl, { cache: "no-store" })
      const forecastResponse = await fetch(forecastUrl, { cache: "no-store" })

      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json()
        const currentDt = toFiniteNumber(weatherData?.dt, 0)
        const sunrise = toFiniteNumber(weatherData?.sys?.sunrise, 0)
        const sunset = toFiniteNumber(weatherData?.sys?.sunset, 0)
        const cloudPercent = toFiniteNumber(weatherData?.clouds?.all, 40)
        const currentUv = estimateUvBySun(cloudPercent, currentDt, sunrise, sunset)

        const timezoneOffset = typeof weatherData?.timezone === "number" ? weatherData.timezone : 0
        let hourly = DEFAULT_HOURLY
        let weekly = DEFAULT_WEEKLY

        if (forecastResponse.ok) {
          const forecastData = await forecastResponse.json()
          const list = Array.isArray(forecastData?.list) ? forecastData.list : []

          const mappedHourly = list.slice(0, 24).map((item: any) => {
            const dt = toFiniteNumber(item?.dt, 0)
            const localHour = toLocalHour(dt, timezoneOffset)
            const cloud = toFiniteNumber(item?.clouds?.all, cloudPercent)
            const uv = estimateUvByLocalHour(localHour, cloud)
            return {
              time: toHourLabel(dt, timezoneOffset),
              hour24: localHour,
              uv,
              slotLabel: toSlotLabel(dt, timezoneOffset),
            }
          }).filter((item: any) => Number.isFinite(item.hour24) && Number.isFinite(item.uv))

          if (mappedHourly.length > 0) {
            hourly = mappedHourly
          }

          const dailyMap = new Map<string, { day: string; uvMax: number }>()
          for (const item of list) {
            const dt = toFiniteNumber(item?.dt, 0)
            if (!dt) continue
            const cloud = toFiniteNumber(item?.clouds?.all, cloudPercent)
            const localHour = toLocalHour(dt, timezoneOffset)
            const uv = estimateUvByLocalHour(localHour, cloud)
            const dayKey = new Date((dt + timezoneOffset) * 1000).toISOString().slice(0, 10)
            const dayLabel = toLocalDayLabel(dt, timezoneOffset)
            const existing = dailyMap.get(dayKey)
            if (!existing || uv > existing.uvMax) {
              dailyMap.set(dayKey, { day: dayLabel, uvMax: uv })
            }
          }

          const mappedWeekly = Array.from(dailyMap.values()).slice(0, 7)
          if (mappedWeekly.length > 0) {
            weekly = mappedWeekly
          }
        }

        const daylightHours = sunrise > 0 && sunset > sunrise ? Number(((sunset - sunrise) / 3600).toFixed(1)) : null
        const estimatedRadiationWm2 = Number((currentUv * 20).toFixed(0))

        return NextResponse.json(
          {
            location: `${first.name}, ${first.country}`,
            currentUv,
            hourly,
            weekly,
            sunlightHours: daylightHours,
            estimatedRadiationWm2,
            warning: "Using OpenWeather fallback UV estimation",
            updatedAt: new Date().toISOString(),
          },
          { status: 200 },
        )
      }

      return NextResponse.json(
        { ...fallbackPayload, location: `${first.name}, ${first.country}`, warning: "Failed to fetch UV data" },
        { status: 200 },
      )
    }

    const hourly = (oneCallData?.hourly ?? []).slice(0, 24).map((item: any) => {
      const timezoneOffset = typeof oneCallData?.timezone_offset === "number" ? oneCallData.timezone_offset : 0
      const dt = toFiniteNumber(item?.dt, 0)
      return {
        time: toHourLabel(dt, timezoneOffset),
        hour24: toLocalHour(dt, timezoneOffset),
        uv: toFiniteNumber(item?.uvi, 0),
        slotLabel: toSlotLabel(dt, timezoneOffset),
      }
    }).filter((item: any) => Number.isFinite(item.hour24) && Number.isFinite(item.uv))

    const weekly = (oneCallData?.daily ?? []).slice(0, 7).map((item: any) => ({
      day: toDayLabel(item.dt),
      uvMax: toFiniteNumber(item?.uvi, 0),
    }))

    const sunrise = toFiniteNumber(oneCallData?.daily?.[0]?.sunrise, 0)
    const sunset = toFiniteNumber(oneCallData?.daily?.[0]?.sunset, 0)
    const daylightHours = sunrise > 0 && sunset > sunrise ? Number(((sunset - sunrise) / 3600).toFixed(1)) : null
    const currentUv = toFiniteNumber(oneCallData?.current?.uvi, 0)
    const estimatedRadiationWm2 = Number((currentUv * 20).toFixed(0))

    return NextResponse.json(
      {
        location: `${first.name}, ${first.country}`,
        currentUv,
        hourly: hourly.length > 0 ? hourly : DEFAULT_HOURLY,
        weekly: weekly.length > 0 ? weekly : DEFAULT_WEEKLY,
        sunlightHours: daylightHours,
        estimatedRadiationWm2,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json(
      { ...fallbackPayload, warning: "Unexpected UV API error" },
      { status: 200 },
    )
  }
}
