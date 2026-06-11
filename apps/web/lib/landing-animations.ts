/**
 * Shared reveal-on-scroll animation factories for the landing page.
 * Reduced motion is handled globally via <MotionConfig reducedMotion="user">
 * in app/page.tsx — these variants are automatically disabled there.
 */

export const revealEase = [0.16, 1, 0.3, 1] as const

export const revealViewport = {
  once: true,
  amount: 0.08,
  margin: "0px 0px -40px 0px",
} as const

export const revealUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: revealViewport,
  transition: { duration: 0.65, ease: revealEase, delay },
})

export const revealScale = (delay = 0) => ({
  initial: { opacity: 0, y: 16, scale: 0.97 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: revealViewport,
  transition: { duration: 0.65, ease: revealEase, delay },
})
