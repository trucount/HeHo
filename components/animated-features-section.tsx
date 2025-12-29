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

const BentoCard: React.FC<BentoCardProps> = ({
  title,
  value,
  subtitle,
  colors,
  delay,
  className,
}) => {
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
      className={cn(
        "relative overflow-hidden h-full min-h-[300px] bg-black rounded-lg border border-white/10",
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 z-0">
        <AnimatedGradientWithSvg colors={colors} speed={0.05} blur="medium" />
      </div>

      {/* Noise */}
      <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: "256px 256px",
          }}
        />
      </div>

      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 z-10 bg-black/40" />

      {/* Shine */}
      <div className="absolute inset-0 z-10 opacity-70 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full animate-[shine_4s_ease-in-out_infinite] w-[200%]" />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-20 p-4 sm:p-6 md:p-8 h-full flex flex-col justify-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.h3
          className="text-sm sm:text-base md:text-lg mb-2 text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]"
          variants={item}
        >
          {title}
        </motion.h3>

        <motion.p
          className="text-2xl sm:text-4xl md:text-5xl font-semibold mb-4 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]"
          variants={item}
        >
          {value}
        </motion.p>

        {subtitle && (
          <motion.p
            className="text-sm text-white/80 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]"
            variants={item}
          >
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
    subtitle:
      "Access to 35+ free models from OpenRouter including Llama, Mistral, Gemma, and more.",
    colors: ["#1a1a1a", "#2a2a2a", "#1f1f1f"],
    colSpan: "md:col-span-2",
  },
  {
    title: "Supabase Integration",
    value: "Autonomous DB",
    subtitle:
      "Connect your database and let AI read, write, and create tables autonomously.",
    colors: ["#151515", "#252525", "#1d1d1d"],
  },
  {
    title: "Project Context",
    value: "Business Logic",
    subtitle:
      "Upload detailed project descriptions so AI understands your full business context.",
    colors: ["#171717", "#272727", "#1b1b1b"],
  },
  {
    title: "Database Permissions",
    value: "Fine-grained Control",
    subtitle:
      "Control exactly what AI can read, write, create, and access in your database.",
    colors: ["#131313", "#232323", "#191919"],
  },
  {
    title: "Real-time Chat",
    value: "Direct Chat",
    subtitle:
      "Chat directly with your AI chatbot powered by your OpenRouter API key.",
    colors: ["#1a1a1a", "#2a2a2a", "#1f1f1f"],
  },
]

export function AnimatedFeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 bg-black">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
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
