import { NextRequest, NextResponse } from "next/server"
import {
  formatLocalDateKey,
  resolveOpenMeteoCity,
  weekdayFromDateKey,
} from "@/lib/open-meteo"

const WAQI_BASE = "https://api.waqi.info/feed"
const OPEN_WEATHER_GEO = "https://api.openweathermap.org/geo/1.0/direct"
const OPEN_WEATHER_AIR_HISTORY = "https://api.openweathermap.org/data/2.5/air_pollution/history"
const OPEN_METEO_AIR_QUALITY = "https://air-quality-api.open-meteo.com/v1/air-quality"

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

function resolveWaqiApiKey() {
  return (
    process.env.WAQI_API_KEY
    ?? process.env.WAQI_KEY
    ?? process.env.NEXT_PUBLIC_WAQI_KEY
    ?? process.env.NEXT_PUBLIC_WAQI_API_KEY
    ?? process.env.VITE_WAQI_KEY
  )
}

type PollutantSet = {
  pm25: number | null
  pm10: number | null
  co: number | null
  no2: number | null
  so2: number | null
  o3: number | null
}

type AqiTrendPoint = {
  date: string
  day: string
  aqi: number | null
}

type HourlyAqiPoint = {
  time: string
  aqi: number | null
}

type OpenMeteoAqiBucket = {
  usAqi: number[]
  pm25: number[]
  pm10: number[]
  co: number[]
  no2: number[]
  so2: number[]
  o3: number[]
}

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function ugm3ToPpm(value: number | null, molecularWeight: number) {
  if (typeof value !== "number") return null
  const ppm = (value * 24.45) / (molecularWeight * 1000)
  return Number.isFinite(ppm) ? Number(ppm.toFixed(3)) : null
}

function ugm3ToPpb(value: number | null, molecularWeight: number) {
  if (typeof value !== "number") return null
  const ppb = (value * 24.45) / molecularWeight
  return Number.isFinite(ppb) ? Number(ppb.toFixed(1)) : null
}

function formatTrendDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatTrendLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function calculateAqiSubIndex(value: number | null, breakpoints: Array<[number, number, number, number]>) {
  if (typeof value !== "number") return null

  for (const [cLow, cHigh, iLow, iHigh] of breakpoints) {
    if (value >= cLow && value <= cHigh) {
      const interpolated = ((iHigh - iLow) / (cHigh - cLow)) * (value - cLow) + iLow
      return Math.round(interpolated)
    }
  }

  return value > breakpoints[breakpoints.length - 1][1] ? 500 : null
}

function calculateDailyAqi(pm25: number | null, pm10: number | null) {
  const pm25Index = calculateAqiSubIndex(pm25, [
    [0, 12, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 500.4, 301, 500],
  ])

  const pm10Index = calculateAqiSubIndex(pm10, [
    [0, 54, 0, 50],
    [55, 154, 51, 100],
    [155, 254, 101, 150],
    [255, 354, 151, 200],
    [355, 424, 201, 300],
    [425, 604, 301, 500],
  ])

  const candidates = [pm25Index, pm10Index].filter((value): value is number => typeof value === "number")
  if (candidates.length === 0) return null
  return Math.max(...candidates)
}

async function fetchPreviousDayPollutants(lat: number, lon: number, weatherKey: string): Promise<PollutantSet | null> {
  try {
    const now = Math.floor(Date.now() / 1000)
    const yesterday = now - 24 * 60 * 60
    const historyUrl = `${OPEN_WEATHER_AIR_HISTORY}?lat=${lat}&lon=${lon}&start=${yesterday}&end=${now}&appid=${weatherKey}`
    const historyResponse = await fetch(historyUrl, { cache: "no-store" })
    if (!historyResponse.ok) return null

    const historyPayload = await historyResponse.json()
    const list = Array.isArray(historyPayload?.list) ? historyPayload.list : []
    if (list.length === 0) return null

    let count = 0
    let sumPm25 = 0
    let sumPm10 = 0
    let sumCo = 0
    let sumNo2 = 0
    let sumSo2 = 0
    let sumO3 = 0

    for (const item of list) {
      const components = item?.components
      const pm25 = toNumber(components?.pm2_5)
      const pm10 = toNumber(components?.pm10)
      const co = toNumber(components?.co)
      const no2 = toNumber(components?.no2)
      const so2 = toNumber(components?.so2)
      const o3 = toNumber(components?.o3)

      if (pm25 === null || pm10 === null || co === null || no2 === null || so2 === null || o3 === null) {
        continue
      }

      sumPm25 += pm25
      sumPm10 += pm10
      sumCo += co
      sumNo2 += no2
      sumSo2 += so2
      sumO3 += o3
      count += 1
    }

    if (count === 0) return null

    const avgPm25 = sumPm25 / count
    const avgPm10 = sumPm10 / count
    const avgCo = sumCo / count
    const avgNo2 = sumNo2 / count
    const avgSo2 = sumSo2 / count
    const avgO3 = sumO3 / count

    return {
      pm25: Number(avgPm25.toFixed(1)),
      pm10: Number(avgPm10.toFixed(1)),
      co: ugm3ToPpm(avgCo, 28.01),
      no2: ugm3ToPpb(avgNo2, 46.01),
      so2: ugm3ToPpb(avgSo2, 64.07),
      o3: ugm3ToPpb(avgO3, 48.0),
    }
  } catch {
    return null
  }
}

async function fetchAqiTrend(lat: number, lon: number, weatherKey: string): Promise<AqiTrendPoint[] | null> {
  try {
    const now = Math.floor(Date.now() / 1000)
    const start = now - 7 * 24 * 60 * 60
    const historyUrl = `${OPEN_WEATHER_AIR_HISTORY}?lat=${lat}&lon=${lon}&start=${start}&end=${now}&appid=${weatherKey}`
    const historyResponse = await fetch(historyUrl, { cache: "no-store" })
    if (!historyResponse.ok) return null

    const historyPayload = await historyResponse.json()
    const list = Array.isArray(historyPayload?.list) ? historyPayload.list : []
    if (list.length === 0) return null

    const grouped: Record<string, { pm25: number[]; pm10: number[] }> = {}

    for (const item of list) {
      const timestamp = toNumber(item?.dt)
      const components = item?.components
      const pm25 = toNumber(components?.pm2_5)
      const pm10 = toNumber(components?.pm10)

      if (timestamp === null) continue

      const date = new Date(timestamp * 1000)
      const dateKey = formatTrendDate(date)
      const bucket = grouped[dateKey] ?? { pm25: [], pm10: [] }

      if (pm25 !== null) bucket.pm25.push(pm25)
      if (pm10 !== null) bucket.pm10.push(pm10)

      grouped[dateKey] = bucket
    }

    const trend: AqiTrendPoint[] = []
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date()
      date.setDate(date.getDate() - offset)
      const dateKey = formatTrendDate(date)
      const bucket = grouped[dateKey]

      const avgPm25 = bucket?.pm25?.length
        ? bucket.pm25.reduce((sum, value) => sum + value, 0) / bucket.pm25.length
        : null
      const avgPm10 = bucket?.pm10?.length
        ? bucket.pm10.reduce((sum, value) => sum + value, 0) / bucket.pm10.length
        : null

      trend.push({
        date: dateKey,
        day: formatTrendLabel(date),
        aqi: calculateDailyAqi(avgPm25, avgPm10),
      })
    }

    return trend
  } catch {
    return null
  }
}

function average(values: number[]) {
  if (values.length === 0) return null
  const total = values.reduce((sum, value) => sum + value, 0)
  return total / values.length
}

async function tryOpenMeteoAqi(city: string) {
  const location = await resolveOpenMeteoCity(city)
  if (!location) return null

  const airQualityUrl = `${OPEN_METEO_AIR_QUALITY}?latitude=${location.latitude}&longitude=${location.longitude}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto&past_days=7&forecast_days=1`
  const response = await fetch(airQualityUrl, { cache: "no-store" })
  if (!response.ok) return null

  const data = await response.json()
  const timeZone = data?.timezone ?? location.timezone ?? "UTC"
  const hourlyTimes = Array.isArray(data?.hourly?.time) ? data.hourly.time : []
  const grouped = new Map<string, OpenMeteoAqiBucket>()

  for (let index = 0; index < hourlyTimes.length; index += 1) {
    const time = hourlyTimes[index]
    const key = formatLocalDateKey(time, timeZone)
    const bucket = grouped.get(key) ?? {
      usAqi: [],
      pm25: [],
      pm10: [],
      co: [],
      no2: [],
      so2: [],
      o3: [],
    }

    const append = (values: number[], raw: unknown) => {
      if (typeof raw === "number" && Number.isFinite(raw)) {
        values.push(raw)
      }
    }

    append(bucket.usAqi, data?.hourly?.us_aqi?.[index])
    append(bucket.pm25, data?.hourly?.pm2_5?.[index])
    append(bucket.pm10, data?.hourly?.pm10?.[index])
    append(bucket.co, data?.hourly?.carbon_monoxide?.[index])
    append(bucket.no2, data?.hourly?.nitrogen_dioxide?.[index])
    append(bucket.so2, data?.hourly?.sulphur_dioxide?.[index])
    append(bucket.o3, data?.hourly?.ozone?.[index])

    grouped.set(key, bucket)
  }

  const sortedKeys = Array.from(grouped.keys()).sort()
  const trendKeys = sortedKeys.slice(-7)
  const trend: AqiTrendPoint[] = trendKeys.map((key) => {
    const bucket = grouped.get(key)
    const meanUsAqi = average(bucket?.usAqi ?? [])
    const meanPm25 = average(bucket?.pm25 ?? [])
    const meanPm10 = average(bucket?.pm10 ?? [])
    const aqi = typeof meanUsAqi === "number"
      ? Math.round(meanUsAqi)
      : calculateDailyAqi(
          typeof meanPm25 === "number" ? meanPm25 : null,
          typeof meanPm10 === "number" ? meanPm10 : null,
        )

    return {
      date: key,
      day: weekdayFromDateKey(key),
      aqi,
    }
  })

  const latestKey = trendKeys[trendKeys.length - 1] ?? null
  const previousKey = trendKeys[trendKeys.length - 2] ?? latestKey
  const latestBucket = latestKey ? grouped.get(latestKey) : null
  const previousBucket = previousKey ? grouped.get(previousKey) : null

  const hourly: HourlyAqiPoint[] = []
  for (let index = 0; index < hourlyTimes.length; index += 1) {
    const time = hourlyTimes[index]
    const dateKey = formatLocalDateKey(time, timeZone)
    if (!latestKey || dateKey !== latestKey) continue

    const usAqi = typeof data?.hourly?.us_aqi?.[index] === "number" ? data.hourly.us_aqi[index] : null
    const pm25 = typeof data?.hourly?.pm2_5?.[index] === "number" ? data.hourly.pm2_5[index] : null
    const pm10 = typeof data?.hourly?.pm10?.[index] === "number" ? data.hourly.pm10[index] : null
    const fallbackAqi = calculateDailyAqi(pm25, pm10)

    hourly.push({
      time: new Date(time).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: timeZone ?? undefined,
      }),
      aqi: typeof usAqi === "number" ? Math.round(usAqi) : fallbackAqi,
    })
  }

  return {
    city: location.country ? `${location.name}, ${location.country}` : location.name,
    aqi: typeof data?.current?.us_aqi === "number"
      ? Math.round(data.current.us_aqi)
      : trend[trend.length - 1]?.aqi ?? null,
    pollutants: {
      pm25: typeof data?.current?.pm2_5 === "number" ? Number(data.current.pm2_5.toFixed(1)) : typeof latestBucket?.pm25?.[0] === "number" ? Number(latestBucket.pm25[0].toFixed(1)) : null,
      pm10: typeof data?.current?.pm10 === "number" ? Number(data.current.pm10.toFixed(1)) : typeof latestBucket?.pm10?.[0] === "number" ? Number(latestBucket.pm10[0].toFixed(1)) : null,
      co: typeof data?.current?.carbon_monoxide === "number" ? Number(data.current.carbon_monoxide.toFixed(3)) : typeof latestBucket?.co?.[0] === "number" ? Number(latestBucket.co[0].toFixed(3)) : null,
      no2: typeof data?.current?.nitrogen_dioxide === "number" ? Number(data.current.nitrogen_dioxide.toFixed(1)) : typeof latestBucket?.no2?.[0] === "number" ? Number(latestBucket.no2[0].toFixed(1)) : null,
      so2: typeof data?.current?.sulphur_dioxide === "number" ? Number(data.current.sulphur_dioxide.toFixed(1)) : typeof latestBucket?.so2?.[0] === "number" ? Number(latestBucket.so2[0].toFixed(1)) : null,
      o3: typeof data?.current?.ozone === "number" ? Number(data.current.ozone.toFixed(1)) : typeof latestBucket?.o3?.[0] === "number" ? Number(latestBucket.o3[0].toFixed(1)) : null,
    },
    previousPollutants: previousBucket
      ? {
          pm25: typeof average(previousBucket.pm25) === "number" ? Number(average(previousBucket.pm25)!.toFixed(1)) : null,
          pm10: typeof average(previousBucket.pm10) === "number" ? Number(average(previousBucket.pm10)!.toFixed(1)) : null,
          co: typeof average(previousBucket.co) === "number" ? Number(average(previousBucket.co)!.toFixed(3)) : null,
          no2: typeof average(previousBucket.no2) === "number" ? Number(average(previousBucket.no2)!.toFixed(1)) : null,
          so2: typeof average(previousBucket.so2) === "number" ? Number(average(previousBucket.so2)!.toFixed(1)) : null,
          o3: typeof average(previousBucket.o3) === "number" ? Number(average(previousBucket.o3)!.toFixed(1)) : null,
        }
      : null,
    hourly,
    trend,
    provider: "open-meteo",
  }
}

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city") ?? "new delhi"

  const fallbackPayload = {
    city,
    aqi: null,
    pollutants: {
      pm25: null,
      pm10: null,
      co: null,
      no2: null,
      so2: null,
      o3: null,
    },
    previousPollutants: null,
    hourly: [],
    trend: [],
  }

  const apiKey = resolveWaqiApiKey()
  try {
    const openMeteoPayload = await tryOpenMeteoAqi(city)
    if (openMeteoPayload) {
      return NextResponse.json({ ...fallbackPayload, ...openMeteoPayload }, { status: 200 })
    }
  } catch {
    // Fall through to the existing WAQI/OpenWeather logic.
  }

  if (!apiKey) {
    return NextResponse.json(
      { ...fallbackPayload, warning: "Missing WAQI API key on server" },
      { status: 200 },
    )
  }

  try {
    const weatherKey = resolveWeatherApiKey()
    let resolvedCoords: { lat: number; lon: number } | null = null

    const url = `${WAQI_BASE}/${encodeURIComponent(city)}/?token=${apiKey}`
    const response = await fetch(url, { cache: "no-store" })
    let payload = response.ok ? await response.json() : null

    const payloadGeo = payload?.data?.city?.geo
    if (Array.isArray(payloadGeo) && payloadGeo.length >= 2) {
      const lat = toNumber(payloadGeo[0])
      const lon = toNumber(payloadGeo[1])
      if (lat !== null && lon !== null) {
        resolvedCoords = { lat, lon }
      }
    }

    if (payload?.status !== "ok") {
      if (weatherKey) {
        const geoUrl = `${OPEN_WEATHER_GEO}?q=${encodeURIComponent(city)}&limit=1&appid=${weatherKey}`
        const geoResponse = await fetch(geoUrl, { cache: "no-store" })
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          const first = geoData?.[0]
          if (typeof first?.lat === "number" && typeof first?.lon === "number") {
            resolvedCoords = { lat: first.lat, lon: first.lon }
            const geoFeedUrl = `${WAQI_BASE}/geo:${first.lat};${first.lon}/?token=${apiKey}`
            const geoFeedResponse = await fetch(geoFeedUrl, { cache: "no-store" })
            if (geoFeedResponse.ok) {
              const geoPayload = await geoFeedResponse.json()
              if (geoPayload?.status === "ok") {
                payload = geoPayload
                const geoPayloadCoords = geoPayload?.data?.city?.geo
                if (Array.isArray(geoPayloadCoords) && geoPayloadCoords.length >= 2) {
                  const lat = toNumber(geoPayloadCoords[0])
                  const lon = toNumber(geoPayloadCoords[1])
                  if (lat !== null && lon !== null) {
                    resolvedCoords = { lat, lon }
                  }
                }
              }
            }
          }
        }
      }
    }

    if (payload?.status !== "ok") {
      return NextResponse.json({ ...fallbackPayload, warning: "WAQI returned non-ok status" }, { status: 200 })
    }

    const iaqi = payload?.data?.iaqi ?? {}
    const previousPollutants =
      weatherKey && resolvedCoords
        ? await fetchPreviousDayPollutants(resolvedCoords.lat, resolvedCoords.lon, weatherKey)
        : null
    const trend =
      weatherKey && resolvedCoords
        ? await fetchAqiTrend(resolvedCoords.lat, resolvedCoords.lon, weatherKey)
        : []

    return NextResponse.json(
      {
        city: payload?.data?.city?.name ?? "New Delhi",
        aqi: toNumber(payload?.data?.aqi),
        pollutants: {
          pm25: toNumber(iaqi?.pm25?.v),
          pm10: toNumber(iaqi?.pm10?.v),
          co: toNumber(iaqi?.co?.v),
          no2: toNumber(iaqi?.no2?.v),
          so2: toNumber(iaqi?.so2?.v),
          o3: toNumber(iaqi?.o3?.v),
        },
        previousPollutants,
        hourly: [],
        trend: trend ?? [],
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json(
      { ...fallbackPayload, warning: "Unexpected AQI API error" },
      { status: 200 },
    )
  }
}
