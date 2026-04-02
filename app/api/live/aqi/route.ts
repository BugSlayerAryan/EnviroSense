import { NextRequest, NextResponse } from "next/server"

const WAQI_BASE = "https://api.waqi.info/feed"
const OPEN_WEATHER_GEO = "https://api.openweathermap.org/geo/1.0/direct"
const OPEN_WEATHER_AIR_HISTORY = "https://api.openweathermap.org/data/2.5/air_pollution/history"

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
    trend: [],
  }

  const apiKey = resolveWaqiApiKey()
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
