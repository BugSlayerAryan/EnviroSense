"use client"

import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense } from "react"

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <TemplateContent>{children}</TemplateContent>
    </Suspense>
  )
}

function TemplateContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const prefersReducedMotion = useReducedMotion()
  const routeKey = `${pathname}?${searchParams.toString()}`

  if (prefersReducedMotion) {
    return <>{children}</>
  }

  return (
    <MotionConfig
      transition={{
        type: "spring",
        stiffness: 230,
        damping: 27,
        mass: 0.82,
      }}
      reducedMotion="user"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={routeKey}
          initial={{ opacity: 0, y: 14, scale: 0.996 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.997 }}
          className="page-transition-layer h-full"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="page-transition-content h-full"
          >
            {children}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  )
}