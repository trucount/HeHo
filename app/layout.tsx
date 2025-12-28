import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { MobileDetector } from "@/components/mobile-detector"

export const metadata: Metadata = {
  title: "HeHo - AI Chatbot Builder",
  description: "Create AI chatbots powered by OpenRouter and Supabase. No code required.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        {children}
        <MobileDetector />
      </body>
    </html>
  )
}
