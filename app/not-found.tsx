import Link from "next/link"

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden p-6">
      <div className="bg-dashboard-light dark:bg-dashboard-dark absolute inset-0" />
      <div className="absolute -top-16 -left-12 h-72 w-72 rounded-full bg-blue-400/20 blur-[100px] dark:bg-blue-500/20" />
      <div className="absolute -bottom-16 -right-10 h-72 w-72 rounded-full bg-purple-400/20 blur-[100px] dark:bg-purple-500/20" />

      <div className="glass-card relative z-10 w-full max-w-lg p-8 text-center">
        <p className="mb-2 text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400">Error 404</p>
        <h1 className="mb-3 text-4xl font-bold text-gray-800 dark:text-white">Page not found</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">The route you requested does not exist in EnviroSense.</p>
        <Link
          href="/"
          className="inline-flex rounded-xl bg-white/70 px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:bg-white/80 dark:bg-white/10 dark:text-white dark:shadow-[0_0_20px_rgba(59,130,246,0.35)]"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  )
}
