"use client"

import { useEffect, useRef } from "react"
import type { ReactNode, HTMLAttributes } from "react"
import "./PixelCard.css"

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
  disappear(): void
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
    this.speed = this.getRandomValue(0.1, 0.9) * speed
    this.size = 0
    this.sizeStep = Math.random() * 0.4
    this.minSize = 0.5
    this.maxSizeInteger = 2
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

  disappear() {
    this.isShimmer = false
    this.counter = 0
    if (this.size <= 0) {
      this.isIdle = true
      return
    } else {
      this.size -= 0.1
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

const VARIANTS: Record<string, { activeColor: string | null; gap: number; speed: number; colors: string; noFocus: boolean }> = {
  default: { activeColor: null, gap: 5, speed: 35, colors: "#f8fafc,#f1f5f9,#cbd5e1", noFocus: false },
  blue:    { activeColor: "#e0f2fe", gap: 10, speed: 25, colors: "#e0f2fe,#7dd3fc,#0ea5e9", noFocus: false },
  yellow:  { activeColor: "#fef08a", gap: 3, speed: 20, colors: "#fef08a,#fde047,#eab308", noFocus: false },
  pink:    { activeColor: "#fecdd3", gap: 6, speed: 80, colors: "#fecdd3,#fda4af,#e11d48", noFocus: true },
}

interface PixelCardOwnProps {
  variant?: string
  gap?: number
  speed?: number
  colors?: string
  noFocus?: boolean
  children?: ReactNode
}

type PixelCardProps = PixelCardOwnProps & Omit<HTMLAttributes<HTMLDivElement>, keyof PixelCardOwnProps>

export default function PixelCard({
  variant = "default",
  gap,
  speed,
  colors,
  noFocus,
  className = "",
  style,
  children,
  ...rest
}: PixelCardProps) {
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
  const finalNoFocus = noFocus ?? variantCfg.noFocus

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
        const color = colorsArray[Math.floor(Math.random() * colorsArray.length)] ?? "#f8fafc"
        const dx = x - width / 2
        const dy = y - height / 2
        const distance = Math.sqrt(dx * dx + dy * dy)
        const delay = reducedMotion ? 0 : distance
        pxs.push(new Pixel(canvasRef.current, ctx, x, y, color, getEffectiveSpeed(finalSpeed, reducedMotion), delay))
      }
    }
    pixelsRef.current = pxs
  }

  const doAnimate = (fnName: "appear" | "disappear") => {
    animationRef.current = requestAnimationFrame(() => doAnimate(fnName))
    const timeNow = performance.now()
    const timePassed = timeNow - timePreviousRef.current
    if (timePassed < 1000 / 60) return
    timePreviousRef.current = timeNow - (timePassed % (1000 / 60))

    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx || !canvasRef.current) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    let allIdle = true
    for (const pixel of pixelsRef.current) {
      pixel[fnName]()
      if (!pixel.isIdle) allIdle = false
    }
    if (allIdle) cancelAnimationFrame(animationRef.current)
  }

  const handleAnimation = (name: "appear" | "disappear") => {
    cancelAnimationFrame(animationRef.current)
    animationRef.current = requestAnimationFrame(() => doAnimate(name))
  }

  useEffect(() => {
    initPixels()
    const observer = new ResizeObserver(() => initPixels())
    if (containerRef.current) observer.observe(containerRef.current)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(animationRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalGap, finalSpeed, finalColors, finalNoFocus])

  return (
    <div
      ref={containerRef}
      className={`pixel-card ${className}`}
      style={style}
      onMouseEnter={() => handleAnimation("appear")}
      onMouseLeave={() => handleAnimation("disappear")}
      onFocus={finalNoFocus ? undefined : (e) => { if (!e.currentTarget.contains(e.relatedTarget)) handleAnimation("appear") }}
      onBlur={finalNoFocus ? undefined : (e) => { if (!e.currentTarget.contains(e.relatedTarget)) handleAnimation("disappear") }}
      tabIndex={finalNoFocus ? -1 : 0}
      {...rest}
    >
      <canvas className="pixel-canvas" ref={canvasRef} />
      {children}
    </div>
  )
}
