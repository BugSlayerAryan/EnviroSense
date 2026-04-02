import { NextRequest, NextResponse } from "next/server"

const OPEN_WEATHER_GEO = "https://api.openweathermap.org/geo/1.0/direct"
const ONE_CALL_V3 = "https://api.openweathermap.org/data/3.0/onecall"
const ONE_CALL_V25 = "https://api.openweathermap.org/data/2.5/onecall"
const OPEN_WEATHER_CURRENT = "https://api.openweathermap.org/data/2.5/weather"
const OPEN_WEATHER_FORECAST = "https://api.openweathermap.org/data/2.5/forecast"

const DEFAULT_HOURLY = [
  { time: "07:00", hour24: 7, uv: 0.8 },
  { time: "08:00", hour24: 8, uv: 1.6 },
  { time: "09:00", hour24: 9, uv: 3.4 },
  { time: "10:00", hour24: 10, uv: 5.8 },
  { time: "11:00", hour24: 11, uv: 8.4 },
  { time: "12:00", hour24: 12, uv: 10.2 },
  { time: "13:00", hour24: 13, uv: 9.7 },
  { time: "14:00", hour24: 14, uv: 8.3 },
  { time: "15:00", hour24: 15, uv: 6.2 },
  { time: "16:00", hour24: 16, uv: 3.7 },
  { time: "17:00", hour24: 17, uv: 1.9 },
  { time: "18:00", hour24: 18, uv: 0.9 },
]

const DEFAULT_WEEKLY = [
  { day: "Mon", uvMax: 9.7 },
  { day: "Tue", uvMax: 8.8 },
  { day: "Wed", uvMax: 10.4 },
  { day: "Thu", uvMax: 7.1 },
  { day: "Fri", uvMax: 9.1 },
  { day: "Sat", uvMax: 6.4 },
  { day: "Sun", uvMax: 8.2 },
]

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

function toHourLabel(unixTime: number) {
  return new Date(unixTime * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
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

export async function GET(request: NextRequest) {
  const apiKey = process.env.VITE_WEATHER_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Missing VITE_WEATHER_KEY" }, { status: 500 })
  }

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

          const mappedHourly = list.slice(0, 12).map((item: any) => {
            const dt = toFiniteNumber(item?.dt, 0)
            const localHour = toLocalHour(dt, timezoneOffset)
            const cloud = toFiniteNumber(item?.clouds?.all, cloudPercent)
            const uv = estimateUvByLocalHour(localHour, cloud)
            return {
              time: toHourLabel(dt),
              hour24: localHour,
              uv,
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

    const hourly = (oneCallData?.hourly ?? []).slice(0, 12).map((item: any) => {
      const date = new Date(item.dt * 1000)
      return {
        time: toHourLabel(item.dt),
        hour24: date.getHours(),
        uv: toFiniteNumber(item?.uvi, 0),
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
