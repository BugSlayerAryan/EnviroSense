"use client"

import { Moon, Search } from "lucide-react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Sun } from "lucide-react"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = theme === "dark"

  return (
    <header className="relative flex items-center justify-between gap-2 border-b border-white/20 bg-white/50 px-3 py-2.5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:gap-3 sm:px-4 sm:py-3 lg:gap-4 lg:px-6 lg:py-3.5">
      <div className="flex shrink-0 items-center lg:hidden">
        <Image src="/logo.png" alt="EnviroSense" width={44} height={44} className="h-10 w-10 object-contain sm:h-11 sm:w-11" />
      </div>

      <div className="hidden lg:block w-1" />

      <motion.div
        className="min-w-0 flex-1 max-w-2xl"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500 dark:text-gray-400 sm:left-3.5 sm:h-4 sm:w-4" />
          <input
            type="text"
            placeholder="Search location..."
            className="w-full rounded-lg border border-white/40 bg-white/70 py-1.5 pl-8 pr-2 text-xs text-gray-800 placeholder:text-gray-500 shadow-sm transition-all focus:border-white/60 focus:bg-white/80 focus:outline-none dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-white/15 sm:py-2 sm:pl-10 sm:pr-4 sm:text-sm"
          />
        </div>
      </motion.div>

      <motion.div
        className="flex shrink-0 items-center gap-1.5"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {mounted && (
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/60 p-1.5 text-gray-700 shadow-sm transition-all hover:bg-white/80 active:scale-95 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15 sm:h-9 sm:w-9"
          >
            {isDark ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>
        )}

        <button aria-label="Profile" title="Profile" className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 text-[11px] font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-95 sm:h-9 sm:w-9 sm:text-xs">
          AR
        </button>
      </motion.div>
    </header>
  )
}
