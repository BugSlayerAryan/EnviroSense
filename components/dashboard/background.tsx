"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export function DashboardBackground() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const isDark = theme === "dark"

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {mounted ? (
        isDark ? (
          <>
            <div className="bg-dashboard-dark absolute inset-0" />
            <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-blue-500/20 blur-[110px]" />
            <div className="absolute top-10 -right-16 h-96 w-96 rounded-full bg-purple-500/20 blur-[130px]" />
            <div className="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-[120px]" />
            <div className="absolute inset-0 bg-[url('/hero-landscape.svg')] bg-cover bg-center opacity-15 blur-sm" />
          </>
        ) : (
          <>
            <div className="bg-dashboard-light absolute inset-0" />
            <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-blue-300/30 blur-[100px]" />
              <div className="absolute top-10 -right-16 h-96 w-96 rounded-full bg-purple-200/25 blur-[120px]" />
              <div className="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-cyan-200/30 blur-[110px]" />
            <div className="absolute inset-0 bg-[url('/hero-landscape.svg')] bg-cover bg-center opacity-20 blur-sm" />
          </>
        )
      ) : (
        <div className="bg-dashboard-light absolute inset-0" />
      )}
    </div>
  )
}
