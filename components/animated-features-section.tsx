'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import AnimatedGradientWithSvg from "@/components/ui/animated-gradient-with-svg"
import { cn } from '@/lib/utils'

interface BentoCardProps {
  title: string
  value: string | number
  subtitle?: string
  colors: string[]
  delay: number
  className?: string
}

const BentoCard: React.FC<BentoCardProps> = ({ title, value, subtitle, colors, delay, className }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay + 0.3,
      },
    },
  }

  const item = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.5 } },
  }

  return (
    <motion.div
      className={cn("relative overflow-hidden h-full bg-black rounded-lg border border-border/20 group min-h-[300px]", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      style={{
        filter: "url(#noise)",
      }}
    >
      <AnimatedGradientWithSvg colors={colors} speed={0.05} blur="medium" />

      <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: "256px 256px",
            mixBlendMode: "overlay",
          }}
        />
      </div>

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="w-full h-full animate-pulse"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.05) 1px, transparent 1px),
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "48px 48px, 64px 64px",
            backgroundPosition: "0 0, 24px 24px",
          }}
        />
      </div>

      <div className="absolute inset-0 opacity-80 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full animate-[shine_4s_ease-in-out_infinite] w-[200%]" />
      </div>

      <motion.div
        className="relative z-10 p-3 sm:p-5 md:p-8 text-white backdrop-blur-sm h-full flex flex-col justify-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.h3 className="text-sm sm:text-base md:text-lg text-white mb-2" variants={item}>
          {title}
        </motion.h3>
        <motion.p className="text-2xl sm:text-4xl md:text-5xl font-medium mb-4 text-white" variants={item}>
          {value}
        </motion.p>
        {subtitle && (
          <motion.p className="text-sm text-white/80" variants={item}>
            {subtitle}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  )
}

const features = [
    {
        title: "Free AI Models",
        value: "35+ Models",
        subtitle: "Access to 35+ free models from OpenRouter including Llama, Mistral, Gemma, and more.",
        colors: ["#1a1a1a", "#2a2a2a", "#1f1f1f"],
        colSpan: "md:col-span-2",
    },
    {
        title: "Supabase Integration",
        value: "Autonomous DB",
        subtitle: "Connect your Supabase database and let AI read, write, and create tables autonomously.",
        colors: ["#151515", "#252525", "#1d1d1d"],
    },
    {
        title: "Project Context",
        value: "Business Logic",
        subtitle: "Upload detailed project descriptions so AI understands your full business context.",
        colors: ["#171717", "#272727", "#1b1b1b"],
    },
    {
        title: "Database Permissions",
        value: "Fine-grained Control",
        subtitle: "Fine-grained control over what AI can read, write, create, and access in your database.",
        colors: ["#131313", "#232323", "#191919"],
    },
    {
        title: "Real-time Chat",
        value: "Direct Chat",
        subtitle: "Chat directly with your AI chatbot powered by your OpenRouter API key.",
        colors: ["#1a1a1a", "#2a2a2a", "#1f1f1f"],
    }
]

export function AnimatedFeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 bg-black">
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="noise" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence baseFrequency="0.4" numOctaves="2" result="noise" seed="2" type="fractalNoise" />
            <feColorMatrix in="noise" type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="discrete" tableValues="0.02 0.04 0.06" />
            </feComponentTransfer>
            <feComposite operator="over" in2="SourceGraphic" />
          </filter>
        </defs>
      </svg>

      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
            Powerful Features
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Everything you need to build and deploy AI chatbots connected to your data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <BentoCard
              key={feature.title}
              title={feature.title}
              value={feature.value}
              subtitle={feature.subtitle}
              colors={feature.colors}
              delay={0.2 * (i + 1)}
              className={(feature as any).colSpan}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
