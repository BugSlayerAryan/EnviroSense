"use client"

import { motion } from "framer-motion"
import { useId } from "react"

interface GaugeProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  colors?: string[]
  valueLabel?: string
  insight?: string
}

export function SemiCircleGauge({
  value,
  max,
  size = 184,
  strokeWidth = 14,
  colors = ["#22c55e", "#eab308", "#f97316"],
  valueLabel = "Moderate",
  insight = "Air quality is stable for most activities.",
}: GaugeProps) {
  const gradientId = useId()

  const safeMax = Math.max(max, 1)
  const clampedValue = Math.min(Math.max(value, 0), safeMax)
  const radius = (size - strokeWidth) / 2
  const circumference = Math.PI * radius
  const percentage = clampedValue / safeMax
  const dashOffset = circumference * (1 - percentage)

  const centerX = size / 2
  const centerY = size / 2 + 10

  // 0 -> left edge of arc, 180 -> right edge of arc.
  const gaugeAngle = percentage * 180
  const arcAngle = 180 - gaugeAngle
  const needleLength = radius - strokeWidth * 0.35
  const needleX = centerX + needleLength * Math.cos((arcAngle * Math.PI) / 180)
  const needleY = centerY - needleLength * Math.sin((arcAngle * Math.PI) / 180)
  const svgHeight = Math.round(size / 2 + strokeWidth + 16)

  return (
    <div className="flex w-full max-w-57.5 flex-col items-center justify-center gap-2">
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-r from-emerald-300/12 via-yellow-300/10 to-orange-300/12 blur-xl" />

        <svg width={size} height={svgHeight} viewBox={`0 0 ${size} ${svgHeight}`} className="mx-auto drop-shadow-[0_8px_20px_rgba(15,23,42,0.16)]">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              {colors.map((color, i) => (
                <stop key={i} offset={`${(i / (colors.length - 1)) * 100}%`} stopColor={color} />
              ))}
            </linearGradient>
          </defs>

          <path
            d={`M ${strokeWidth / 2} ${centerY} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${centerY}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-slate-200/90 dark:text-slate-700/70"
          />

          <motion.path
            d={`M ${strokeWidth / 2} ${centerY} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${centerY}`}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />

          <motion.line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2={centerY}
            stroke="currentColor"
            strokeWidth={3.5}
            strokeLinecap="round"
            className="text-slate-900 drop-shadow-[0_0_10px_rgba(15,23,42,0.35)] dark:text-white"
            animate={{ x2: needleX, y2: needleY }}
            transition={{ type: "spring", stiffness: 130, damping: 18, delay: 0.15 }}
          />

          <circle
            cx={centerX}
            cy={centerY}
            r={6}
            className="fill-slate-900 stroke-white/80 stroke-1 drop-shadow-[0_0_10px_rgba(15,23,42,0.35)] dark:fill-white dark:stroke-slate-700"
          />
        </svg>
      </div>

      <div className="flex flex-col items-center text-center">
        <p className="text-3xl font-extrabold leading-none text-slate-900 dark:text-slate-50">{Math.round(clampedValue)}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{valueLabel}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{insight}</p>
      </div>
    </div>
  )
}

interface CircularGaugeProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color: string
  bgColor?: string
  icon?: React.ReactNode
}

export function CircularGauge({
  value,
  max,
  size = 80,
  strokeWidth = 6,
  color,
  bgColor,
  icon,
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min(value / max, 1)
  const dashOffset = circumference * (1 - percentage * 0.75)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-135">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor || "currentColor"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference * 0.75}
          strokeLinecap="round"
          className={bgColor ? "" : "text-muted/30"}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference * 0.75}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference * 0.75 }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      {icon && <div className="absolute">{icon}</div>}
    </div>
  )
}
