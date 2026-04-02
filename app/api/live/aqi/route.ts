import { NextRequest, NextResponse } from "next/server"

const WAQI_BASE = "https://api.waqi.info/feed"
const OPEN_WEATHER_GEO = "https://api.openweathermap.org/geo/1.0/direct"
const OPEN_WEATHER_AIR_HISTORY = "https://api.openweathermap.org/data/2.5/air_pollution/history"

type PollutantSet = {
  pm25: number | null
  pm10: number | null
  co: number | null
  no2: number | null
  so2: number | null
  o3: number | null
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

export async function GET(request: NextRequest) {
  const apiKey = process.env.VITE_WAQI_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Missing VITE_WAQI_KEY" }, { status: 500 })
  }

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
  }

  try {
    const weatherKey = process.env.VITE_WEATHER_KEY
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
