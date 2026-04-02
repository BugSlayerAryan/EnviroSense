"use client"

import { LayoutDashboard, Wind, Cloud, Sun, Map, Bell, Bookmark } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense } from "react"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Wind, label: "AirQualit", href: "/airqualit" },
  { icon: Cloud, label: "Weather", href: "/weather" },
  { icon: Sun, label: "UV Index", href: "/uv-index" },
  { icon: Map, label: "Maps", href: "/maps" },
  { icon: Bell, label: "Alert", href: "/alert" },
  { icon: Bookmark, label: "SaveCity", href: "/savecity" },
]

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

export function MobileNav() {
  return (
    <Suspense fallback={null}>
      <MobileNavClient />
    </Suspense>
  )
}

function MobileNavClient() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const city = searchParams.get("city")

  const buildHref = (href: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (city) {
      params.set("city", city)
    }
    const suffix = params.toString()
    return suffix ? `${href}?${suffix}` : href
  }

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="relative">
        <div className="absolute inset-0 border-t border-white/30 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-white/5" />
        
        <div className="relative px-2 pb-[max(env(safe-area-inset-bottom,0px),12px)] pt-3">
          <div className="dashboard-scroll flex items-center gap-1 overflow-x-auto px-1">
            {navItems.map((item) => (
              <motion.div
                key={item.label}
                variants={itemVariants}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.85 }}
                className={`relative shrink-0 flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer group ${
                  pathname === item.href
                    ? "text-blue-600 dark:text-blue-300"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {/* Active background */}
                {pathname === item.href && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    className="absolute inset-0 -z-10 rounded-xl bg-white/70 shadow-sm dark:bg-white/10 dark:shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                )}

                {/* Icon */}
                <Link href={buildHref(item.href)} className="relative flex flex-col items-center gap-1.5">
                  <motion.div
                    animate={pathname === item.href ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="relative"
                  >
                    <item.icon className="w-5 h-5" />
                  </motion.div>
                  <motion.span 
                    className="text-[10px] font-semibold whitespace-nowrap leading-none"
                    animate={pathname === item.href ? { scale: [1, 0.95, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {item.label}
                  </motion.span>
                  
                  {/* Glow effect for active */}
                  {pathname === item.href && (
                    <motion.div
                      className="absolute inset-0 -z-10 rounded-full bg-blue-300/30 blur-lg"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </Link>

                {/* Hover underline */}
                <motion.div
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-linear-to-r from-[#60a5fa] via-[#34d399] to-[#60a5fa] opacity-0 transition-opacity group-hover:opacity-100"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
