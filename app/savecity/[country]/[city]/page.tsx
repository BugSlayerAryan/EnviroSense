"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { MapPin } from "lucide-react"
import { DashboardBackground } from "@/components/dashboard/background"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { Navbar } from "@/components/dashboard/navbar"
import { Sidebar } from "@/components/dashboard/sidebar"

export default function SavedCityPage({ params }: { params: { country: string; city: string } }) {
  const router = useRouter()
  const { country, city } = params
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <main className="relative h-dvh overflow-hidden">
      <DashboardBackground />
      <div className="relative z-10 flex h-full w-full">
        <Sidebar />
        <div className="min-w-0 flex flex-1 flex-col">
          <div className="sticky top-0 z-20 shrink-0 border-b border-white/30 dark:border-white/10">
            <Navbar />
          </div>
          <section className="dashboard-scroll flex-1 overflow-y-auto px-3 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mx-auto w-full max-w-2xl rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_20px_60px_rgba(14,116,144,0.12)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/60 sm:p-6 lg:p-8"
            >
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Saved Location</p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
                  {decodeURIComponent(city)}, {decodeURIComponent(country)}
                </h1>
                <div className="mt-2 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <MapPin className="h-4 w-4" />
                  <span>Saved locally on this device</span>
                </div>
              </div>
            </motion.section>
          </section>
        </div>
      </div>
      <MobileNav />
    </main>
  )
}
