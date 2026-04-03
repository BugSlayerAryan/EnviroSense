import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/dashboard/theme-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "EnviroSense - Live Environment, Live Better",
  description:
    "Real-time environmental monitoring dashboard tracking air quality, weather, UV index, and more.",
  icons: {
    icon: [
      { url: "/favicon-logo.png?v=4", type: "image/png", sizes: "32x32" },
      { url: "/favicon-logo.png?v=4", type: "image/png", sizes: "64x64" },
      { url: "/favicon-logo.png?v=4", type: "image/png", sizes: "192x192" },
      { url: "/favicon-logo.png?v=4", type: "image/png", sizes: "512x512" },
      { url: "/favicon-logo.png?v=4", type: "image/png", sizes: "1024x1024" },
    ],
    shortcut: [
      { url: "/favicon-logo.png?v=4", type: "image/png", sizes: "32x32" },
      { url: "/favicon-logo.png?v=4", type: "image/png", sizes: "64x64" },
    ],
    apple: [
      { url: "/apple-touch-logo.png?v=4", type: "image/png", sizes: "180x180" },
      { url: "/favicon-logo.png?v=4", type: "image/png", sizes: "512x512" },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: "#2E8A67",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${inter.variable} font-sans antialiased scroll-smooth`}>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
