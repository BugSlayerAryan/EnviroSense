import { NextRequest, NextResponse } from "next/server"

const OPEN_WEATHER_BASE = "https://api.openweathermap.org/data/2.5/weather"
const OPEN_WEATHER_FORECAST = "https://api.openweathermap.org/data/2.5/forecast"
const ONE_CALL_V3 = "https://api.openweathermap.org/data/3.0/onecall"
const ONE_CALL_V25 = "https://api.openweathermap.org/data/2.5/onecall"

function resolveWeatherApiKey() {
  return (
    process.env.WEATHER_API_KEY
    ?? process.env.OPENWEATHER_API_KEY
    ?? process.env.NEXT_PUBLIC_WEATHER_API_KEY
    ?? process.env.VITE_WEATHER_KEY
  )
}

type WeatherIconName = "sun" | "cloud" | "rain" | "partly"

function formatClock(unixTime: number, timezoneOffsetSeconds = 0) {
  return new Date((unixTime + timezoneOffsetSeconds) * 1000).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  })
}

function formatDaylightHours(sunrise: number, sunset: number) {
  if (!sunrise || !sunset || sunset <= sunrise) return null
  const totalMinutes = Math.round((sunset - sunrise) / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`
}

function getMoonPhaseLabel(phase: number | null | undefined) {
  if (typeof phase !== "number" || !Number.isFinite(phase)) return "Waxing Crescent"
  if (phase === 0 || phase === 1) return "New Moon"
  if (phase < 0.25) return "Waxing Crescent"
  if (phase < 0.5) return "First Quarter"
  if (phase < 0.75) return "Waxing Gibbous"
  if (phase < 0.9) return "Full Moon"
  return "Waning Gibbous"
}

function toHourLabel(unixTime: number) {
  return new Date(unixTime * 1000).toLocaleTimeString("en-US", {
    hour: "numeric",
    hour12: true,
  })
}

function toDayLabel(unixTime: number) {
  return new Date(unixTime * 1000).toLocaleDateString("en-US", { weekday: "short" })
}

function getWeatherIcon(main: string | undefined, clouds = 0, rainChance = 0): WeatherIconName {
  const normalized = (main ?? "").toLowerCase()
  if (normalized.includes("rain") || normalized.includes("drizzle") || rainChance >= 45) return "rain"
  if (normalized.includes("cloud") || normalized.includes("mist") || normalized.includes("fog")) {
    return clouds >= 70 ? "cloud" : "partly"
  }
  if (clouds >= 55) return "partly"
  if (clouds >= 25) return "partly"
  return "sun"
}

function getHourlyIcon(main: string | undefined, clouds = 0, rainChance = 0) {
  const icon = getWeatherIcon(main, clouds, rainChance)
  if (icon === "rain") return "rain"
  if (icon === "cloud") return "cloudy"
  return "sunny"
}

function getDewPoint(tempC: number, humidity: number) {
  const a = 17.27
  const b = 237.7
  const rh = Math.min(Math.max(humidity, 1), 100)
  const alpha = ((a * tempC) / (b + tempC)) + Math.log(rh / 100)
  return Number(((b * alpha) / (a - alpha)).toFixed(1))
}

function buildForecastFromOneCall(oneCallData: any, currentTemp: number) {
  const hourly = (oneCallData?.hourly ?? []).slice(0, 8).map((item: any) => {
    const clouds = typeof item?.clouds === "number" ? item.clouds : 0
    const pop = typeof item?.pop === "number" ? Math.round(item.pop * 100) : 0
    return {
      time: item?.dt ? toHourLabel(item.dt) : "Now",
      temp: Math.round(typeof item?.temp === "number" ? item.temp : currentTemp),
      icon: getHourlyIcon(item?.weather?.[0]?.main, clouds, pop),
      rainChance: pop,
    }
  })

  const daily = (oneCallData?.daily ?? []).slice(0, 7).map((item: any, index: number) => {
    const clouds = typeof item?.clouds === "number" ? item.clouds : 0
    const rainChance = typeof item?.pop === "number" ? Math.round(item.pop * 100) : 0
    const max = Math.round(typeof item?.temp?.max === "number" ? item.temp.max : currentTemp)
    const min = Math.round(typeof item?.temp?.min === "number" ? item.temp.min : currentTemp)
    const current = index === 0 ? Math.round(typeof oneCallData?.current?.temp === "number" ? oneCallData.current.temp : currentTemp) : undefined
    return {
      day: item?.dt ? toDayLabel(item.dt) : index === 0 ? "Today" : `Day ${index + 1}`,
      icon: getWeatherIcon(item?.weather?.[0]?.main, clouds, rainChance),
      max,
      min,
      rain: rainChance,
      current,
    }
  })

  return { hourly, daily }
}

function buildAstronomy(oneCallData: any, weatherData: any) {
  const timezoneOffset = typeof oneCallData?.timezone_offset === "number"
    ? oneCallData.timezone_offset
    : typeof weatherData?.timezone === "number"
      ? weatherData.timezone
      : 0
  const sunrise = typeof oneCallData?.current?.sunrise === "number" ? oneCallData.current.sunrise : weatherData?.sys?.sunrise
  const sunset = typeof oneCallData?.current?.sunset === "number" ? oneCallData.current.sunset : weatherData?.sys?.sunset
  const daylightHours = formatDaylightHours(sunrise, sunset)
  const moonPhase = typeof oneCallData?.daily?.[0]?.moon_phase === "number" ? oneCallData.daily[0].moon_phase : null

  return {
    sunrise: typeof sunrise === "number" ? formatClock(sunrise, timezoneOffset) : null,
    sunset: typeof sunset === "number" ? formatClock(sunset, timezoneOffset) : null,
    daylightHours,
    moonPhase,
    moonPhaseLabel: getMoonPhaseLabel(moonPhase),
    moonIllumination: typeof moonPhase === "number" ? Number((moonPhase * 100).toFixed(0)) : null,
  }
}

function buildForecastFromFiveDayForecast(forecastData: any, currentTemp: number) {
  const list = Array.isArray(forecastData?.list) ? forecastData.list : []
  const hourly = list.slice(0, 8).map((item: any, index: number) => {
    const clouds = typeof item?.clouds?.all === "number" ? item.clouds.all : 0
    const pop = typeof item?.pop === "number" ? Math.round(item.pop * 100) : Math.round(clouds * 0.6)
    return {
      time: item?.dt ? toHourLabel(item.dt) : index === 0 ? "Now" : `${index + 1}H`,
      temp: Math.round(typeof item?.main?.temp === "number" ? item.main.temp : currentTemp),
      icon: getHourlyIcon(item?.weather?.[0]?.main, clouds, pop),
      rainChance: pop,
    }
  })

  const grouped = new Map<string, { day: string; min: number; max: number; rain: number; icon: WeatherIconName; current?: number }>()
  list.forEach((item: any, index: number) => {
    const dt = typeof item?.dt === "number" ? item.dt : 0
    if (!dt) return
    const dateKey = new Date(dt * 1000).toISOString().slice(0, 10)
    const dayLabel = toDayLabel(dt)
    const temp = typeof item?.main?.temp === "number" ? item.main.temp : currentTemp
    const clouds = typeof item?.clouds?.all === "number" ? item.clouds.all : 0
    const rainChance = typeof item?.pop === "number" ? Math.round(item.pop * 100) : Math.round(clouds * 0.6)
    const icon = getWeatherIcon(item?.weather?.[0]?.main, clouds, rainChance)
    const existing = grouped.get(dateKey)
    if (!existing) {
      grouped.set(dateKey, {
        day: dayLabel,
        min: Math.round(temp),
        max: Math.round(temp),
        rain: rainChance,
        icon,
        current: index === 0 ? Math.round(temp) : undefined,
      })
      return
    }

    existing.min = Math.min(existing.min, Math.round(temp))
    existing.max = Math.max(existing.max, Math.round(temp))
    existing.rain = Math.max(existing.rain, rainChance)
    if (icon === "rain") existing.icon = "rain"
    else if (icon === "cloud" && existing.icon !== "rain") existing.icon = "cloud"
    else if (icon === "partly" && existing.icon === "sun") existing.icon = "partly"
  })

  const daily = Array.from(grouped.values()).slice(0, 7)
  while (daily.length > 0 && daily.length < 7) {
    const previous = daily[daily.length - 1]
    const nextIndex = daily.length + 1
    daily.push({
      day: `Day ${nextIndex}`,
      icon: previous.icon,
      max: previous.max + 1,
      min: previous.min + 1,
      rain: previous.rain,
    })
  }

  return { hourly, daily }
}

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city") ?? "New Delhi"

  const fallbackPayload = {
    city,
    country: "IN",
    cityNotFound: false,
    temp: null,
    feelsLike: null,
    humidity: null,
    pressure: null,
    visibilityKm: null,
    windKmh: null,
    condition: "Unavailable",
    description: "Weather service temporarily unavailable",
    coord: {
      lat: null,
      lon: null,
    },
    hourly: [],
    daily: [],
    astronomy: {
      sunrise: null,
      sunset: null,
      daylightHours: null,
      moonPhase: null,
      moonPhaseLabel: "Waxing Crescent",
      moonIllumination: null,
    },
    updatedAt: new Date().toISOString(),
  }

  const apiKey = resolveWeatherApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { ...fallbackPayload, warning: "Missing weather API key on server" },
      { status: 200 },
    )
  }

  try {
    const url = `${OPEN_WEATHER_BASE}?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`
    const response = await fetch(url, { cache: "no-store" })
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { ...fallbackPayload, cityNotFound: true, warning: "City not found" },
          { status: 200 },
        )
      }

      return NextResponse.json(
        { ...fallbackPayload, warning: "Failed to fetch weather data from upstream" },
        { status: 200 },
      )
    }

    const data = await response.json()
    const lat = data?.coord?.lat
    const lon = data?.coord?.lon

    let hourly: Array<{ time: string; temp: number; icon: string; rainChance: number }> = []
    let daily: Array<{ day: string; icon: WeatherIconName; max: number; min: number; rain: number; current?: number }> = []
    let astronomy = {
      sunrise: typeof data?.sys?.sunrise === "number" ? formatClock(data.sys.sunrise, data?.timezone ?? 0) : null,
      sunset: typeof data?.sys?.sunset === "number" ? formatClock(data.sys.sunset, data?.timezone ?? 0) : null,
      daylightHours: formatDaylightHours(data?.sys?.sunrise, data?.sys?.sunset),
      moonPhase: null as number | null,
      moonPhaseLabel: "Waxing Crescent",
      moonIllumination: null as number | null,
    }

    if (typeof lat === "number" && typeof lon === "number") {
      const oneCallUrls = [
        `${ONE_CALL_V3}?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,alerts&appid=${apiKey}`,
        `${ONE_CALL_V25}?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,alerts&appid=${apiKey}`,
      ]

      let oneCallData: any = null
      for (const url of oneCallUrls) {
        const forecastResponse = await fetch(url, { cache: "no-store" })
        if (forecastResponse.ok) {
          oneCallData = await forecastResponse.json()
          break
        }
      }

      if (oneCallData) {
        const mapped = buildForecastFromOneCall(oneCallData, data?.main?.temp ?? 0)
        hourly = mapped.hourly
        daily = mapped.daily
        astronomy = buildAstronomy(oneCallData, data)
      } else {
        const forecastUrl = `${OPEN_WEATHER_FORECAST}?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
        const forecastResponse = await fetch(forecastUrl, { cache: "no-store" })
        if (forecastResponse.ok) {
          const forecastData = await forecastResponse.json()
          const mapped = buildForecastFromFiveDayForecast(forecastData, data?.main?.temp ?? 0)
          hourly = mapped.hourly
          daily = mapped.daily
        }
        astronomy = buildAstronomy({}, data)
      }
    }

    return NextResponse.json(
      {
        city: data?.name,
        country: data?.sys?.country,
        temp: data?.main?.temp,
        feelsLike: data?.main?.feels_like,
        humidity: data?.main?.humidity,
        pressure: data?.main?.pressure,
        visibilityKm: typeof data?.visibility === "number" ? data.visibility / 1000 : null,
        windKmh: typeof data?.wind?.speed === "number" ? data.wind.speed * 3.6 : null,
        condition: data?.weather?.[0]?.main ?? "Clear",
        description: data?.weather?.[0]?.description ?? "Clear sky",
        coord: {
          lat: data?.coord?.lat,
          lon: data?.coord?.lon,
        },
        hourly,
        daily,
        astronomy,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json(
      { ...fallbackPayload, warning: "Unexpected weather API error" },
      { status: 200 },
    )
  }
}
