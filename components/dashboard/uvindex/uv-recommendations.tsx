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
  const riskBadgeClasses =
    category === "Low"
      ? "border-emerald-200 bg-[#dcfce7] text-[#16a34a] dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-300"
      : hasUvValue
        ? getUvToneClasses(uvValue)
        : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"

  const mobileRecommendations = hasUvValue
    ? [
        {
          title: "Apply Sunscreen",
          description: "SPF 30+, reapply every 2 hours",
          icon: tips[0]?.icon,
          iconClasses: "border-amber-200 bg-amber-50 text-amber-700",
        },
        {
          title: "Wear Sunglasses",
          description: "UV-protective lenses",
          icon: tips[1]?.icon,
          iconClasses: "border-sky-200 bg-sky-50 text-sky-700",
        },
        {
          title: "Protective Clothing",
          description: "Hats, long sleeves",
          icon: tips[2]?.icon,
          iconClasses: "border-indigo-200 bg-indigo-50 text-indigo-700",
        },
        {
          title: "Low UV Window",
          description: "Risk is low but protection advised",
          icon: tips[3]?.icon,
          iconClasses: "border-emerald-200 bg-emerald-50 text-emerald-700",
        },
      ]
    : []

  return (
    <>
      <section className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 md:hidden dark:border-slate-700 dark:bg-slate-900/70">
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900/65">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h3 className="text-[18px] font-semibold text-[#0f172a] dark:text-slate-100">Protection Recommendations</h3>
              <p className="mt-1 text-[13px] text-[#64748b] dark:text-slate-300">Personalized precautions based on current UV intensity</p>
              <p className="mt-1 text-[13px] text-[#64748b] dark:text-slate-300">Current UV: {uvLabel} ({category})</p>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${riskBadgeClasses}`}>
              {riskLabel}
            </span>
          </div>

          <div className="space-y-3">
            {hasUvValue ? mobileRecommendations.map((tip, index) => {
              const Icon = tip.icon
              if (!Icon) return null
              return (
                <motion.article
                  key={`mobile-rec-${tip.title}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: 0.03 * index }}
                  whileHover={{ y: -1 }}
                  className="rounded-xl border border-[#e2e8f0] bg-white p-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition-all duration-200 hover:shadow-[0_10px_20px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800/75"
                >
                  <div className="flex items-start gap-3">
                    <div className={`inline-flex rounded-lg border p-2.5 ${tip.iconClasses}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-[#0f172a] dark:text-slate-100">{tip.title}</p>
                      <p className="mt-1 text-[13px] text-[#64748b] dark:text-slate-300">{tip.description}</p>
                    </div>
                  </div>
                </motion.article>
              )
            }) : (
              <div className="rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] p-4 text-[13px] text-[#64748b] dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                UV recommendations are unavailable until a live reading is fetched.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative hidden overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_48px_rgba(14,116,144,0.12)] ring-1 ring-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:ring-slate-700/50 sm:p-5 md:block">
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
    </>
  )
}
