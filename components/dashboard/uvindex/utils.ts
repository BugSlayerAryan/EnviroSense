import { AlertTriangle, Glasses, Shield, Shirt, Sun, type LucideIcon } from "lucide-react"

export type UvCategory = "Low" | "Moderate" | "High" | "Very High" | "Extreme"

export type HourlyUvPoint = {
  time: string
  hour24: number
  uv: number
}

export type DailyUvPoint = {
  day: string
  uvMax: number
}

export type ProtectionTip = {
  title: string
  description: string
  icon: LucideIcon
}

export function getUvCategory(value: number): UvCategory {
  if (value <= 2) return "Low"
  if (value <= 5) return "Moderate"
  if (value <= 7) return "High"
  if (value <= 10) return "Very High"
  return "Extreme"
}

export function getUvToneClasses(value: number) {
  if (value <= 2) return "text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/30"
  if (value <= 5) return "text-yellow-700 bg-yellow-100 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-500/15 dark:border-yellow-500/30"
  if (value <= 7) return "text-orange-700 bg-orange-100 border-orange-200 dark:text-orange-300 dark:bg-orange-500/15 dark:border-orange-500/30"
  if (value <= 10) return "text-red-700 bg-red-100 border-red-200 dark:text-red-300 dark:bg-red-500/15 dark:border-red-500/30"
  return "text-violet-700 bg-violet-100 border-violet-200 dark:text-violet-300 dark:bg-violet-500/15 dark:border-violet-500/30"
}

export function getUvHealthMessage(value: number): string {
  if (value <= 2) return "Safe to go outside with basic protection."
  if (value <= 5) return "Use sunscreen and sunglasses during midday exposure."
  if (value <= 7) return "Apply SPF 30+ and limit prolonged outdoor activity."
  if (value <= 10) return "High risk: seek shade and wear protective clothing."
  return "Extreme risk: avoid direct sun from 11 AM to 3 PM."
}

export function getProtectionTips(value: number): ProtectionTip[] {
  const tips: ProtectionTip[] = [
    { title: "Apply Sunscreen", description: "Use broad-spectrum SPF 30+ and reapply every 2 hours.", icon: Shield },
    { title: "Wear Sunglasses", description: "Use UV-protective lenses to reduce eye strain and risk.", icon: Glasses },
    { title: "Protective Clothing", description: "Prefer hats, long sleeves, and breathable UV-safe fabrics.", icon: Shirt },
  ]

  if (value >= 8) {
    tips.push({ title: "Avoid Peak Sun", description: "Minimize outdoor exposure between 11 AM and 3 PM.", icon: AlertTriangle })
  } else {
    tips.push({ title: "Plan Smartly", description: "Schedule outdoor activities in early morning or evening.", icon: Sun })
  }

  return tips
}

export function getExposureMinutes(value: number, skinType: string): number {
  const baselineByType: Record<string, number> = {
    "Type I": 20,
    "Type II": 30,
    "Type III": 40,
    "Type IV": 55,
    "Type V": 70,
    "Type VI": 85,
  }

  const baseline = baselineByType[skinType] ?? 40
  const adjusted = Math.max(8, Math.round((baseline / Math.max(value, 1)) * 3.6))
  return adjusted
}
