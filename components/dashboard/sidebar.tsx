"use client"

import { Bell, Bookmark, Cloud, LayoutDashboard, Map, MapPin, Sun, Wind } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Wind, label: "AirQualit", href: "/airqualit" },
  { icon: Cloud, label: "Weather", href: "/weather" },
  { icon: Sun, label: "UV Index", href: "/uv-index" },
  { icon: Map, label: "Maps", href: "/maps" },
  { icon: Bell, label: "Alert", href: "/alert" },
  { icon: Bookmark, label: "SaveCity", href: "/savecity" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden h-full w-56 shrink-0 flex-col rounded-r-2xl border-r border-white/20 bg-white/50 px-4 py-5 backdrop-blur-xl lg:flex xl:w-64 dark:border-white/10 dark:bg-white/5">
      <div className="mb-8 px-1">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="EnviroSense" width={64} height={64} className="h-16 w-16 shrink-0 object-contain" />
          <div className="flex flex-col leading-tight">
            <p className="text-base font-bold tracking-tight text-gray-900 dark:text-white">EnviroSense</p>
            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">Environment First</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5 space-y-0.5">
        {menuItems.map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`rounded-lg text-sm font-medium transition-all duration-300 ${
              pathname === item.href
                ? "border-l-3 border-emerald-500 bg-white/70 text-gray-900 shadow-sm dark:bg-white/10 dark:text-white"
                : "bg-transparent text-gray-600 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-white/5"
            }`}
          >
            <Link href={item.href} className="flex w-full items-center gap-3 px-4 py-2.5">
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          </motion.div>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <motion.div whileHover={{ y: -2 }} className="glass-card p-4 shadow-md">
          <div className="mb-3 flex items-center gap-2.5">
            <MapPin className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Current Location</span>
          </div>
          <p className="mb-3 text-sm font-bold text-gray-900 dark:text-white">New Delhi, India</p>
          <button className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-emerald-700 active:scale-95 dark:bg-emerald-600 dark:hover:bg-emerald-700">
            Detect My Location
          </button>
        </motion.div>

        <div className="space-y-2 rounded-lg border border-white/20 bg-white/30 px-3.5 py-3 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Status: Active</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Updated just now</p>
        </div>
      </div>
    </aside>
  )
}
