import { NextRequest, NextResponse } from "next/server"

const OPEN_WEATHER_REVERSE = "https://api.openweathermap.org/geo/1.0/reverse"

function resolveWeatherApiKey() {
  return (
    process.env.WEATHER_API_KEY
    ?? process.env.OPENWEATHER_API_KEY
    ?? process.env.NEXT_PUBLIC_WEATHER_API_KEY
    ?? process.env.VITE_WEATHER_KEY
  )
}

export async function GET(request: NextRequest) {
  const apiKey = resolveWeatherApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { city: null, warning: "Missing weather API key on server" },
      { status: 200 },
    )
  }

  const lat = request.nextUrl.searchParams.get("lat")
  const lon = request.nextUrl.searchParams.get("lon")

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 })
  }

  try {
    const url = `${OPEN_WEATHER_REVERSE}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&limit=1&appid=${apiKey}`
    const response = await fetch(url, { cache: "no-store" })
    if (!response.ok) {
      return NextResponse.json({ city: null, warning: "Reverse geocode unavailable" }, { status: 200 })
    }

    const payload = await response.json()
    const first = payload?.[0]
    const cityName = first?.name ?? null
    const country = first?.country ?? null

    return NextResponse.json(
      {
        city: cityName && country ? `${cityName}, ${country}` : cityName,
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json({ city: null, warning: "Reverse geocode error" }, { status: 200 })
  }
}
