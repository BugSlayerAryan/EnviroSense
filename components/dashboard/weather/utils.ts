import { Cloud, CloudRain, CloudSun, Sun } from "lucide-react"
import type { ComponentType } from "react"

export type WeatherIconName = "sun" | "cloud" | "rain" | "partly"

export type WeeklyForecastDay = {
  day: string
  icon: WeatherIconName
  max: number
  min: number
  rain: number
  rainMm?: number
  current?: number
}

export function getWeatherIcon(icon: WeatherIconName): ComponentType<{ className?: string }> {
  if (icon === "rain") return CloudRain
  if (icon === "cloud") return Cloud
  if (icon === "partly") return CloudSun
  return Sun
}

export function getWeatherIconColor(icon: WeatherIconName): string {
  if (icon === "rain") return "text-blue-500 dark:text-blue-300"
  if (icon === "cloud") return "text-slate-500 dark:text-slate-300"
  if (icon === "partly") return "text-cyan-500 dark:text-cyan-300"
  return "text-amber-500 dark:text-amber-300"
}

export function getWeatherLabel(icon: WeatherIconName): string {
  if (icon === "rain") return "Rain"
  if (icon === "cloud") return "Cloudy"
  if (icon === "partly") return "Partly Cloudy"
  return "Sunny"
}

// Normalize row temperature values onto the weekly scale.
export function getTempRangePosition(min: number, max: number, weekMin: number, weekMax: number) {
  const range = Math.max(weekMax - weekMin, 1)
  return {
    start: ((min - weekMin) / range) * 100,
    width: ((max - min) / range) * 100,
  }
}
