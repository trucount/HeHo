'use client'

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

interface Vector2D {
  x: number
  y: number
}

class Particle {
  pos: Vector2D = { x: 0, y: 0 }
  vel: Vector2D = { x: 0, y: 0 }
  acc: Vector2D = { x: 0, y: 0 }
  target: Vector2D = { x: 0, y: 0 }

  closeEnoughTarget = 100
  maxSpeed = 1.0
  maxForce = 0.1
  particleSize = 10
  isKilled = false

  startColor = { r: 0, g: 0, b: 0 }
  targetColor = { r: 0, g: 0, b: 0 }
  colorWeight = 0
  colorBlendRate = 0.01

  move() {
    let proximityMult = 1
    const distance = Math.hypot(this.pos.x - this.target.x, this.pos.y - this.target.y)

    if (distance < this.closeEnoughTarget) {
      proximityMult = distance / this.closeEnoughTarget
    }

    const towardsTarget = {
      x: this.target.x - this.pos.x,
      y: this.target.y - this.pos.y,
    }

    const magnitude = Math.hypot(towardsTarget.x, towardsTarget.y)
    if (magnitude > 0) {
      towardsTarget.x = (towardsTarget.x / magnitude) * this.maxSpeed * proximityMult
      towardsTarget.y = (towardsTarget.y / magnitude) * this.maxSpeed * proximityMult
    }

    const steer = {
      x: towardsTarget.x - this.vel.x,
      y: towardsTarget.y - this.vel.y,
    }

    const steerMagnitude = Math.hypot(steer.x, steer.y)
    if (steerMagnitude > 0) {
      steer.x = (steer.x / steerMagnitude) * this.maxForce
      steer.y = (steer.y / steerMagnitude) * this.maxForce
    }

    this.acc.x += steer.x
    this.acc.y += steer.y

    this.vel.x += this.acc.x
    this.vel.y += this.acc.y
    this.pos.x += this.vel.x
    this.pos.y += this.vel.y
    this.acc.x = 0
    this.acc.y = 0
  }

  draw(ctx: CanvasRenderingContext2D, drawAsPoints: boolean) {
    if (this.colorWeight < 1.0) {
      this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0)
    }

    const c = {
      r: Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight),
      g: Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight),
      b: Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight),
    }

    ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`

    if (drawAsPoints) {
      ctx.fillRect(this.pos.x, this.pos.y, 2, 2)
    } else {
      ctx.beginPath()
      ctx.arc(this.pos.x, this.pos.y, this.particleSize / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  kill(width: number, height: number, killColor: { r: number; g: number; b: number }) {
    if (!this.isKilled) {
      const angle = Math.random() * Math.PI * 2
      const mag = (width + height) / 2

      this.target.x = width / 2 + Math.cos(angle) * mag
      this.target.y = height / 2 + Math.sin(angle) * mag

      this.startColor = {
        r: this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight,
        g: this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight,
        b: this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight,
      }

      this.targetColor = killColor
      this.colorWeight = 0
      this.isKilled = true
    }
  }
}

const DEFAULT_WORDS = ["LeLo", "SAAS", "PLATFORM", "LELO"]

export function ParticleTextEffect({ words = DEFAULT_WORDS }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const particlesRef = useRef<Particle[]>([])
  const frameCountRef = useRef(0)
  const wordIndexRef = useRef(0)
  const { resolvedTheme } = useTheme()

  const isDark = resolvedTheme === "dark"

  const BG_BLUR = isDark ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"
  const TEXT_COLOR = isDark ? "white" : "black"
  const PARTICLE_COLOR = isDark ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 }
  const KILL_COLOR = isDark ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 }

  const pixelSteps = 6
  const drawAsPoints = true

  const nextWord = (word: string, canvas: HTMLCanvasElement) => {
    const off = document.createElement("canvas")
    off.width = canvas.width
    off.height = canvas.height
    const ctx = off.getContext("2d")!

    ctx.fillStyle = TEXT_COLOR
    ctx.font = "bold 100px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(word, canvas.width / 2, canvas.height / 3)

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const particles = particlesRef.current
    let index = 0

    for (let i = 0; i < pixels.length; i += pixelSteps * 4) {
      if (pixels[i + 3] > 0) {
        const x = (i / 4) % canvas.width
        const y = Math.floor(i / 4 / canvas.width)

        let p: Particle
        if (index < particles.length) {
          p = particles[index]
          p.isKilled = false
        } else {
          p = new Particle()
          p.pos.x = Math.random() * canvas.width
          p.pos.y = Math.random() * canvas.height
          p.maxSpeed = Math.random() * 6 + 4
          p.maxForce = p.maxSpeed * 0.05
          p.particleSize = Math.random() * 6 + 6
          p.colorBlendRate = Math.random() * 0.0275 + 0.0025
          particles.push(p)
        }

        p.startColor = {
          r: p.startColor.r + (p.targetColor.r - p.startColor.r) * p.colorWeight,
          g: p.startColor.g + (p.targetColor.g - p.startColor.g) * p.colorWeight,
          b: p.startColor.b + (p.targetColor.b - p.startColor.b) * p.colorWeight,
        }

        p.targetColor = PARTICLE_COLOR
        p.colorWeight = 0
        p.target.x = x
        p.target.y = y

        index++
      }
    }

    for (let i = index; i < particles.length; i++) {
      particles[i].kill(canvas.width, canvas.height, KILL_COLOR)
    }
  }

  const animate = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!

    ctx.fillStyle = BG_BLUR
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i]
      p.move()
      p.draw(ctx, drawAsPoints)

      if (p.isKilled &&
        (p.pos.x < 0 || p.pos.x > canvas.width || p.pos.y < 0 || p.pos.y > canvas.height)
      ) {
        particlesRef.current.splice(i, 1)
      }
    }

    frameCountRef.current++
    if (frameCountRef.current % 240 === 0) {
      wordIndexRef.current = (wordIndexRef.current + 1) % words.length
      nextWord(words[wordIndexRef.current], canvas)
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvas.parentElement!.clientWidth
    canvas.height = canvas.parentElement!.clientHeight

    nextWord(words[0], canvas)
    animate()

    return () => animationRef.current && cancelAnimationFrame(animationRef.current)
  }, [resolvedTheme])

  return (
    <div className="absolute inset-0 w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: isDark ? "black" : "white" }}
      />
    </div>
  )
}
