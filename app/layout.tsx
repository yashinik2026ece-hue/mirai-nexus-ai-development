import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "MIRAI · Your future, in focus", template: "%s · MIRAI" },
  description: "An evidence-aware career and learning companion that adapts your roadmap to your goals, skills, and real-life calendar.",
  applicationName: "MIRAI",
  generator: "v0.app",
  icons: { icon: "/icon.svg" },
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f6f7fb",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="antialiased">{children}{process.env.NODE_ENV === "production" && <Analytics />}</body></html>
}
