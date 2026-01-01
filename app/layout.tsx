
import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "HeHo - AI Chatbot Builder",
  description: "Create AI chatbots powered by OpenRouter and Supabase. No code required.",
  applicationName: "HeHo",
  authors: [{ name: "Sparrow" }],
  creator: "Sparrow",
  source: "https://github.com/trucount/HeHo",
  keywords: [
    "AI", 
    "HeHo",
    "Chatbot", 
    "Builder", 
    "OpenRouter", 
    "Supabase", 
    "No-code", 
    "AI Chatbot", 
    "Chatbot Builder",
    "Advanced analytics", 
    "Real-time data", 
    "One-click deployment", 
    "Theme customization", 
    "AI-assisted setup", 
    "Responsive design", 
    "Secure chatbot", 
    "Usage tracking", 
    "Public sharing",
    "Vercel",
    "Next.js",
    "React",
    "Sparrow",
    "AI assistant",
    "Custom chatbot",
    "Vercel deployment",
    "Next.js chatbot",
    "React chatbot",
    "Supabase database",
    "OpenRouter API"
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "QO1hxfpzSpt5kNRRdz3Ex_J_C9k6ThQiNPdC-HOxz8U",
  },
  openGraph: {
    title: "HeHo - AI Chatbot Builder",
    description: "Create AI chatbots powered by OpenRouter and Supabase. No code required.",
    url: "https://heho.vercel.app",
    siteName: "HeHo",
    images: [
      {
        url: 'https://heho.vercel.app/og-image.png', 
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en-US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "HeHo - AI Chatbot Builder",
    description: "Create AI chatbots powered by OpenRouter and Supabase. No code required.",
    creator: '@sparrow_ps',
    images: ['https://heho.vercel.app/og-image.png'],
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
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
      </body>
    </html>
  )
}
