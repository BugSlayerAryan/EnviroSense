import { NextRequest, NextResponse } from "next/server"
import {
  daylightHoursFromIso,
  formatLocalDateLabel,
  formatLocalDayLabel,
  formatLocalHour,
  formatLocalTime,
  resolveOpenMeteoCity,
  weatherCodeToSummary,
} from "@/lib/open-meteo"

const OPEN_WEATHER_BASE = "https://api.openweathermap.org/data/2.5/weather"
const OPEN_WEATHER_FORECAST = "https://api.openweathermap.org/data/2.5/forecast"
const ONE_CALL_V3 = "https://api.openweathermap.org/data/3.0/onecall"
const ONE_CALL_V25 = "https://api.openweathermap.org/data/2.5/onecall"
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

function toDateLabel(unixTime: number, timezoneOffsetSeconds = 0) {
  return new Date((unixTime + timezoneOffsetSeconds) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function toLocalDateKey(unixTime: number, timezoneOffsetSeconds = 0) {
  return new Date((unixTime + timezoneOffsetSeconds) * 1000).toISOString().slice(0, 10)
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

function deriveRainChance(rawPop: unknown) {
  // Use provider probability directly only.
  if (typeof rawPop === "number" && Number.isFinite(rawPop)) {
    return Math.min(100, Math.max(0, Math.round(rawPop * 100)))
  }
  return 0
}

function buildForecastFromOneCall(oneCallData: any, currentTemp: number) {
  const timezoneOffset = typeof oneCallData?.timezone_offset === "number" ? oneCallData.timezone_offset : 0
  const hourlyRainByDay = new Map<string, number>()

  ;(oneCallData?.hourly ?? []).slice(0, 24 * 7).forEach((item: any) => {
    if (typeof item?.dt !== "number") return
    const dayKey = toLocalDateKey(item.dt, timezoneOffset)
    const rainMm = typeof item?.rain?.["1h"] === "number" ? item.rain["1h"] : 0
    const total = (hourlyRainByDay.get(dayKey) ?? 0) + rainMm
    hourlyRainByDay.set(dayKey, Number(total.toFixed(1)))
  })

  const hourly = (oneCallData?.hourly ?? []).slice(0, 8).map((item: any) => {
    const clouds = typeof item?.clouds === "number" ? item.clouds : 0
    const rainMm = typeof item?.rain?.["1h"] === "number" ? item.rain["1h"] : 0
    const pop = deriveRainChance(item?.pop)
    return {
      time: item?.dt ? toHourLabel(item.dt) : "Now",
      date: item?.dt ? toDateLabel(item.dt, timezoneOffset) : null,
      temp: Math.round(typeof item?.temp === "number" ? item.temp : currentTemp),
      icon: getHourlyIcon(item?.weather?.[0]?.main, clouds, pop),
      humidity: typeof item?.humidity === "number" ? Math.round(item.humidity) : 0,
      rainChance: pop,
      rainMm: Number(rainMm.toFixed(1)),
    }
  })

  const daily = (oneCallData?.daily ?? []).slice(0, 7).map((item: any, index: number) => {
    const clouds = typeof item?.clouds === "number" ? item.clouds : 0
    const dayKey = typeof item?.dt === "number" ? toLocalDateKey(item.dt, timezoneOffset) : null
    const rainMm = typeof item?.rain === "number"
      ? Number(item.rain.toFixed(1))
      : dayKey
        ? Number((hourlyRainByDay.get(dayKey) ?? 0).toFixed(1))
        : 0
    const rainChance = deriveRainChance(item?.pop)
    const max = Math.round(typeof item?.temp?.max === "number" ? item.temp.max : currentTemp)
    const min = Math.round(typeof item?.temp?.min === "number" ? item.temp.min : currentTemp)
    const current = index === 0 ? Math.round(typeof oneCallData?.current?.temp === "number" ? oneCallData.current.temp : currentTemp) : undefined
    return {
      day: item?.dt ? toDayLabel(item.dt) : index === 0 ? "Today" : `Day ${index + 1}`,
      date: item?.dt ? toDateLabel(item.dt, timezoneOffset) : null,
      icon: getWeatherIcon(item?.weather?.[0]?.main, clouds, rainChance),
      max,
      min,
      rain: rainChance,
      rainMm,
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

async function tryOpenMeteoWeather(city: string) {
  const location = await resolveOpenMeteoCity(city)
  if (!location) return null

  const forecastUrl = `${OPEN_METEO_FORECAST}?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,surface_pressure,visibility,wind_speed_10m,precipitation,precipitation_probability,weather_code,cloud_cover&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,rain,showers,cloud_cover,weather_code,wind_speed_10m,visibility&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,rain_sum,showers_sum,weather_code,sunrise,sunset&timezone=auto&forecast_days=7`
  const response = await fetch(forecastUrl, { cache: "no-store" })
  if (!response.ok) return null

  const data = await response.json()
  const timeZone = data?.timezone ?? location.timezone ?? "UTC"
  const historyUrl = `${OPEN_METEO_FORECAST}?latitude=${location.latitude}&longitude=${location.longitude}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&past_days=6&forecast_days=1`
  const historyResponse = await fetch(historyUrl, { cache: "no-store" })
  const historyData = historyResponse.ok ? await historyResponse.json() : null
  const currentSummary = weatherCodeToSummary(data?.current?.weather_code)
  const hourlyTimes = Array.isArray(data?.hourly?.time) ? data.hourly.time : []
  const dailyTimes = Array.isArray(data?.daily?.time) ? data.daily.time : []
  const historyTimes = Array.isArray(historyData?.daily?.time) ? historyData.daily.time : []

  const hourly = hourlyTimes.slice(0, 8).map((time: string, index: number) => {
    const summary = weatherCodeToSummary(data?.hourly?.weather_code?.[index])
    const rainChance = typeof data?.hourly?.precipitation_probability?.[index] === "number"
      ? Math.min(100, Math.max(0, Math.round(data.hourly.precipitation_probability[index])))
      : 0
    const rainMm = typeof data?.hourly?.precipitation?.[index] === "number"
      ? data.hourly.precipitation[index]
      : typeof data?.hourly?.rain?.[index] === "number"
        ? data.hourly.rain[index]
        : typeof data?.hourly?.showers?.[index] === "number"
          ? data.hourly.showers[index]
          : 0

    return {
      time: formatLocalHour(time, timeZone),
      date: formatLocalDateLabel(time, timeZone),
      temp: typeof data?.hourly?.temperature_2m?.[index] === "number" ? Math.round(data.hourly.temperature_2m[index]) : Math.round(typeof data?.current?.temperature_2m === "number" ? data.current.temperature_2m : 0),
      icon: summary.icon,
      humidity: typeof data?.hourly?.relative_humidity_2m?.[index] === "number" ? Math.round(data.hourly.relative_humidity_2m[index]) : 0,
      rainChance,
      rainMm: Number(Number(rainMm).toFixed(1)),
    }
  })

  const daily = dailyTimes.slice(0, 7).map((time: string, index: number) => {
    const summary = weatherCodeToSummary(data?.daily?.weather_code?.[index])
    const rainChance = typeof data?.daily?.precipitation_probability_max?.[index] === "number"
      ? Math.min(100, Math.max(0, Math.round(data.daily.precipitation_probability_max[index])))
      : 0
    const rainMm = typeof data?.daily?.precipitation_sum?.[index] === "number"
      ? data.daily.precipitation_sum[index]
      : typeof data?.daily?.rain_sum?.[index] === "number"
        ? data.daily.rain_sum[index]
        : typeof data?.daily?.showers_sum?.[index] === "number"
          ? data.daily.showers_sum[index]
          : 0
    const current = index === 0 && typeof data?.current?.temperature_2m === "number"
      ? Math.round(data.current.temperature_2m)
      : undefined

    return {
      day: formatLocalDayLabel(time, timeZone),
      date: formatLocalDateLabel(time, timeZone),
      icon: summary.icon,
      max: typeof data?.daily?.temperature_2m_max?.[index] === "number" ? Math.round(data.daily.temperature_2m_max[index]) : current ?? 0,
      min: typeof data?.daily?.temperature_2m_min?.[index] === "number" ? Math.round(data.daily.temperature_2m_min[index]) : current ?? 0,
      rain: rainChance,
      rainMm: Number(Number(rainMm).toFixed(1)),
      current,
    }
  })

  const sunrise = data?.daily?.sunrise?.[0] ?? null
  const sunset = data?.daily?.sunset?.[0] ?? null

  const history = historyTimes
    .map((time: string, index: number) => {
      const max = typeof historyData?.daily?.temperature_2m_max?.[index] === "number" ? historyData.daily.temperature_2m_max[index] : null
      const min = typeof historyData?.daily?.temperature_2m_min?.[index] === "number" ? historyData.daily.temperature_2m_min[index] : null
      const value = typeof max === "number"
        ? max
        : typeof min === "number"
          ? min
          : null

      return {
        day: formatLocalDateLabel(time, timeZone),
        date: formatLocalDateLabel(time, timeZone),
        temp: typeof value === "number" ? Math.round(value) : null,
      }
    })
    .slice(-7)

  return {
    city: location.name,
    country: location.country,
    temp: typeof data?.current?.temperature_2m === "number" ? Math.round(data.current.temperature_2m) : null,
    feelsLike: typeof data?.current?.apparent_temperature === "number" ? Math.round(data.current.apparent_temperature) : null,
    humidity: typeof data?.current?.relative_humidity_2m === "number" ? Math.round(data.current.relative_humidity_2m) : null,
    pressure: typeof data?.current?.surface_pressure === "number" ? Math.round(data.current.surface_pressure) : null,
    visibilityKm: typeof data?.current?.visibility === "number" ? Number((data.current.visibility / 1000).toFixed(1)) : null,
    windKmh: typeof data?.current?.wind_speed_10m === "number" ? Number(data.current.wind_speed_10m.toFixed(1)) : null,
    currentRainMm: typeof data?.current?.precipitation === "number"
      ? Number(data.current.precipitation.toFixed(1))
      : typeof data?.current?.rain === "number"
        ? Number(data.current.rain.toFixed(1))
        : null,
    currentRainChance: typeof data?.current?.precipitation_probability === "number"
      ? Math.min(100, Math.max(0, Math.round(data.current.precipitation_probability)))
      : hourly[0]?.rainChance ?? null,
    condition: currentSummary.condition,
    description: currentSummary.description,
    coord: {
      lat: location.latitude,
      lon: location.longitude,
    },
    hourly,
    daily,
    history,
    astronomy: {
      sunrise: sunrise ? formatLocalTime(sunrise, timeZone) : null,
      sunset: sunset ? formatLocalTime(sunset, timeZone) : null,
      daylightHours: daylightHoursFromIso(sunrise, sunset),
      moonPhase: null,
      moonPhaseLabel: null,
      moonIllumination: null,
    },
    updatedAt: new Date().toISOString(),
    provider: "open-meteo",
  }
}

function buildForecastFromFiveDayForecast(forecastData: any, currentTemp: number) {
  const list = Array.isArray(forecastData?.list) ? forecastData.list : []
  const hourly = list.slice(0, 8).map((item: any, index: number) => {
    const clouds = typeof item?.clouds?.all === "number" ? item.clouds.all : 0
    const rainMm = typeof item?.rain?.["3h"] === "number" ? item.rain["3h"] : 0
    const pop = deriveRainChance(item?.pop)
    return {
      time: item?.dt ? toHourLabel(item.dt) : index === 0 ? "Now" : `${index + 1}H`,
      date: item?.dt ? toDateLabel(item.dt) : null,
      temp: Math.round(typeof item?.main?.temp === "number" ? item.main.temp : currentTemp),
      icon: getHourlyIcon(item?.weather?.[0]?.main, clouds, pop),
      humidity: typeof item?.main?.humidity === "number" ? Math.round(item.main.humidity) : 0,
      rainChance: pop,
      rainMm: Number(rainMm.toFixed(1)),
    }
  })

  const grouped = new Map<string, { day: string; date: string; timestamp: number; min: number; max: number; rain: number; rainMm: number; icon: WeatherIconName; current?: number }>()
  list.forEach((item: any, index: number) => {
    const dt = typeof item?.dt === "number" ? item.dt : 0
    if (!dt) return
    const dateKey = new Date(dt * 1000).toISOString().slice(0, 10)
    const dayLabel = toDayLabel(dt)
    const temp = typeof item?.main?.temp === "number" ? item.main.temp : currentTemp
    const clouds = typeof item?.clouds?.all === "number" ? item.clouds.all : 0
    const rainVolumeMm = typeof item?.rain?.["3h"] === "number" ? item.rain["3h"] : 0
    const rainChance = deriveRainChance(item?.pop)
    const icon = getWeatherIcon(item?.weather?.[0]?.main, clouds, rainChance)
    const existing = grouped.get(dateKey)
    if (!existing) {
      grouped.set(dateKey, {
        day: dayLabel,
        date: toDateLabel(dt),
        timestamp: dt,
        min: Math.round(temp),
        max: Math.round(temp),
        rain: rainChance,
        rainMm: Number(rainVolumeMm.toFixed(1)),
        icon,
        current: index === 0 ? Math.round(temp) : undefined,
      })
      return
    }

    existing.min = Math.min(existing.min, Math.round(temp))
    existing.max = Math.max(existing.max, Math.round(temp))
    existing.rain = Math.max(existing.rain, rainChance)
    existing.rainMm = Number((existing.rainMm + rainVolumeMm).toFixed(1))
    if (icon === "rain") existing.icon = "rain"
    else if (icon === "cloud" && existing.icon !== "rain") existing.icon = "cloud"
    else if (icon === "partly" && existing.icon === "sun") existing.icon = "partly"
  })

  const daily = Array.from(grouped.values()).slice(0, 7)

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
    currentRainMm: null,
    currentRainChance: null,
    condition: "Unavailable",
    description: "Weather service temporarily unavailable",
    coord: {
      lat: null,
      lon: null,
    },
    hourly: [],
    daily: [],
    history: [],
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
  try {
    const openMeteoPayload = await tryOpenMeteoWeather(city)
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

    let hourly: Array<{ time: string; temp: number; icon: string; rainChance: number; rainMm?: number }> = []
    let daily: Array<{ day: string; icon: WeatherIconName; max: number; min: number; rain: number; rainMm?: number; current?: number }> = []
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
        currentRainMm: typeof data?.rain?.["1h"] === "number"
          ? Number(data.rain["1h"].toFixed(1))
          : 0,
        currentRainChance: typeof hourly?.[0]?.rainChance === "number"
          ? Math.min(100, Math.max(0, Math.round(hourly[0].rainChance)))
          : 0,
        condition: data?.weather?.[0]?.main ?? "Clear",
        description: data?.weather?.[0]?.description ?? "Clear sky",
        coord: {
          lat: data?.coord?.lat,
          lon: data?.coord?.lon,
        },
        hourly,
        daily,
        history: [],
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
