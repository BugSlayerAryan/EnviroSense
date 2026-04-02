"use client"

import { motion } from "framer-motion"
import { getProtectionTips, getUvCategory, getUvToneClasses } from "@/components/dashboard/uvindex/utils"

type UvRecommendationsProps = {
  uvValue: number | null
}

export function UvRecommendations({ uvValue }: UvRecommendationsProps) {
  const hasUvValue = typeof uvValue === "number"
  const tips = hasUvValue ? getProtectionTips(uvValue) : []
  const category = hasUvValue ? getUvCategory(uvValue) : "--"
  const riskLabel = hasUvValue ? (category === "Low" ? "Low Risk" : category === "Moderate" ? "Moderate Risk" : `${category} Risk`) : "--"
  const uvLabel = hasUvValue ? uvValue.toFixed(1) : "--"

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_48px_rgba(14,116,144,0.12)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/50 sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_14%,rgba(56,189,248,0.14),transparent_34%),radial-gradient(circle_at_8%_90%,rgba(14,165,233,0.1),transparent_38%)] dark:bg-[radial-gradient(circle_at_86%_14%,rgba(56,189,248,0.2),transparent_34%),radial-gradient(circle_at_8%_90%,rgba(14,165,233,0.16),transparent_38%)]" />

      <div className="relative z-10 mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">Protection Recommendations</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">Personalized precautions based on current UV intensity</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">Current UV: {uvLabel} ({category})</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${hasUvValue ? getUvToneClasses(uvValue) : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
          {riskLabel}
        </span>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {hasUvValue ? tips.map((tip, index) => {
          const Icon = tip.icon
          return (
            <motion.article
              key={tip.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: 0.03 * index }}
              whileHover={{ y: -2 }}
              className="group rounded-2xl border border-slate-200 bg-white/92 p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition-all duration-300 hover:shadow-[0_14px_26px_rgba(15,23,42,0.1)] dark:border-slate-700 dark:bg-slate-800/88"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="inline-flex rounded-lg border border-sky-200 bg-sky-50 p-2 text-sky-700 transition group-hover:scale-[1.03] dark:border-sky-500/35 dark:bg-sky-500/15 dark:text-sky-300">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
                  Tip {index + 1}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{tip.title}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{tip.description}</p>
            </motion.article>
          )
        }) : (
          <div className="sm:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            UV recommendations are unavailable until a live reading is fetched.
          </div>
        )}
      </div>
    </section>
  )
}
