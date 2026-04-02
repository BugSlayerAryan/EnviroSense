import { NextRequest, NextResponse } from "next/server"
import { resolveOpenMeteoCity } from "@/lib/open-meteo"

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city")?.trim()

  if (!city) {
    return NextResponse.json({ city: null, country: null, cityNotFound: true, warning: "Missing city" }, { status: 200 })
  }

  try {
    const location = await resolveOpenMeteoCity(city)

    if (!location) {
      return NextResponse.json({ city: null, country: null, cityNotFound: true, warning: "City not found" }, { status: 200 })
    }

    return NextResponse.json(
      {
        city: location.name,
        country: location.country || null,
        cityNotFound: false,
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json({ city: null, country: null, cityNotFound: true, warning: "City lookup error" }, { status: 200 })
  }
}