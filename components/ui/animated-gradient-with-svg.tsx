'use client'
import { cn } from '@/lib/utils'
import { type ReactNode, useEffect, useRef, useState } from 'react'

interface AnimatedGradientWithSvgProps {
  className?: string
  gradientColors?: string[]
  children?: ReactNode
  duration?: number
  svg: ReactNode
}

export default function AnimatedGradientWithSvg({ className, gradientColors, children, duration, svg }: AnimatedGradientWithSvgProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { left, top, width, height } = el.getBoundingClientRect()

      const x = (clientX - left) / width
      const y = (clientY - top) / height

      el.style.setProperty('--x', `${x}`)
      el.style.setProperty('--y', `${y}`)
    }

    el.addEventListener('mousemove', handleMouseMove)

    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative h-full w-full',
        className,
        'before:absolute before:inset-0 before:z-10 before:bg-black/90 before:transition-opacity before:duration-300 before:content-[""]',
        'hover:before:opacity-0',
      )}
    >
      <div className="relative z-20 h-full w-full">
        {children}
      </div>
      <div
        className={cn(
          'absolute inset-0 z-0 opacity-100 transition-opacity',
          isHovered ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          background: `radial-gradient(circle at calc(var(--x, 0.5) * 100%) calc(var(--y, 0.5) * 100%), rgb(255 255 255 / 0.1), transparent 30%)`,
        }}
      />
      <div className='absolute left-1/2 top-1/2 -z-10 w-full -translate-x-1/2 -translate-y-1/2 transform-gpu'>
        {svg}
      </div>
    </div>
  )
}
