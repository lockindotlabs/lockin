"use client"

import { useEffect, useRef } from "react"
import type { ReactNode, HTMLAttributes } from "react"
import "./AmbientPixelCard.css"

interface PixelInstance {
  width: number
  height: number
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  color: string
  speed: number
  size: number
  sizeStep: number
  minSize: number
  maxSizeInteger: number
  maxSize: number
  delay: number
  counter: number
  counterStep: number
  isIdle: boolean
  isReverse: boolean
  isShimmer: boolean
  getRandomValue(min: number, max: number): number
  draw(): void
  appear(): void
  shimmer(): void
}

class Pixel implements PixelInstance {
  width: number
  height: number
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  color: string
  speed: number
  size: number
  sizeStep: number
  minSize: number
  maxSizeInteger: number
  maxSize: number
  delay: number
  counter: number
  counterStep: number
  isIdle: boolean
  isReverse: boolean
  isShimmer: boolean

  constructor(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    speed: number,
    delay: number
  ) {
    this.width = canvas.width
    this.height = canvas.height
    this.ctx = context
    this.x = x
    this.y = y
    this.color = color
    this.speed = this.getRandomValue(0.1, 0.7) * speed
    this.size = 0
    this.sizeStep = Math.random() * 0.3 + 0.1
    this.minSize = 0.2
    this.maxSizeInteger = 1.8
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger)
    this.delay = delay
    this.counter = 0
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01
    this.isIdle = false
    this.isReverse = false
    this.isShimmer = false
  }

  getRandomValue(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5
    this.ctx.fillStyle = this.color
    this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size)
  }

  appear() {
    this.isIdle = false
    if (this.counter <= this.delay) {
      this.counter += this.counterStep
      return
    }
    if (this.size >= this.maxSize) {
      this.isShimmer = true
    }
    if (this.isShimmer) {
      this.shimmer()
    } else {
      this.size += this.sizeStep
    }
    this.draw()
  }

  shimmer() {
    if (this.size >= this.maxSize) {
      this.isReverse = true
    } else if (this.size <= this.minSize) {
      this.isReverse = false
    }
    if (this.isReverse) {
      this.size -= this.speed
    } else {
      this.size += this.speed
    }
  }
}

function getEffectiveSpeed(value: number, reducedMotion: boolean) {
  const min = 0
  const max = 100
  const throttle = 0.001
  if (value <= min || reducedMotion) return min
  if (value >= max) return max * throttle
  return value * throttle
}

const VARIANTS: Record<string, { gap: number; speed: number; colors: string }> = {
  default: { gap: 6, speed: 12, colors: "#cbd5e1,#e2e8f0,#f1f5f9,#fde68a,#ffedd5" },
  blue:    { gap: 8, speed: 10, colors: "#e0f2fe,#bae6fd,#7dd3fc,#93c5fd" },
  yellow:  { gap: 5, speed: 10, colors: "#fef3c7,#fde68a,#fef08a,#fed7aa" },
  neutral: { gap: 6, speed: 10, colors: "#f8fafc,#f1f5f9,#e2e8f0,#cbd5e1" },
}

interface AmbientPixelCardOwnProps {
  variant?: string
  gap?: number
  speed?: number
  colors?: string
  children?: ReactNode
}

type AmbientPixelCardProps = AmbientPixelCardOwnProps & Omit<HTMLAttributes<HTMLDivElement>, keyof AmbientPixelCardOwnProps>

export default function AmbientPixelCard({
  variant = "default",
  gap,
  speed,
  colors,
  className = "",
  style,
  children,
  ...rest
}: AmbientPixelCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pixelsRef = useRef<Pixel[]>([])
  const animationRef = useRef<number>(0)
  const timePreviousRef = useRef(performance.now())
  const reducedMotion = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ).current

  const variantCfg = VARIANTS[variant] ?? VARIANTS.default!
  const finalGap = gap ?? variantCfg.gap
  const finalSpeed = speed ?? variantCfg.speed
  const finalColors = colors ?? variantCfg.colors

  const initPixels = () => {
    if (!containerRef.current || !canvasRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const width = Math.floor(rect.width)
    const height = Math.floor(rect.height)
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    canvasRef.current.width = width
    canvasRef.current.height = height

    const colorsArray = finalColors.split(",")
    const pxs: Pixel[] = []
    for (let x = 0; x < width; x += finalGap) {
      for (let y = 0; y < height; y += finalGap) {
        const color = colorsArray[Math.floor(Math.random() * colorsArray.length)] ?? "#e2e8f0"
        const dx = x - width / 2
        const dy = y - height / 2
        const distance = Math.sqrt(dx * dx + dy * dy)
        const delay = reducedMotion ? 0 : distance
        pxs.push(new Pixel(canvasRef.current, ctx, x, y, color, getEffectiveSpeed(finalSpeed, reducedMotion), delay))
      }
    }
    pixelsRef.current = pxs
  }

  const doAnimate = () => {
    animationRef.current = requestAnimationFrame(doAnimate)
    const timeNow = performance.now()
    const timePassed = timeNow - timePreviousRef.current
    if (timePassed < 1000 / 60) return
    timePreviousRef.current = timeNow - (timePassed % (1000 / 60))

    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx || !canvasRef.current) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    for (const pixel of pixelsRef.current) {
      pixel.appear()
    }
  }

  const startAnimation = () => {
    cancelAnimationFrame(animationRef.current)
    animationRef.current = requestAnimationFrame(doAnimate)
  }

  useEffect(() => {
    initPixels()
    startAnimation()
    const observer = new ResizeObserver(() => {
      initPixels()
      startAnimation()
    })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(animationRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalGap, finalSpeed, finalColors])

  return (
    <div
      ref={containerRef}
      className={`ambient-pixel-card ${className}`}
      style={style}
      {...rest}
    >
      <canvas className="ambient-pixel-canvas" ref={canvasRef} />
      {children}
    </div>
  )
}
