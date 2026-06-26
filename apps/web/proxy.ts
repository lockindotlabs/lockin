import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isProtectedRoute = createRouteMatcher(["/app(.*)"])
const isPublicRoute = createRouteMatcher([
  "/app/sign-in(.*)",
  "/app/sign-up(.*)",
])

function getAllowedOrigin(origin: string | null): string | null {
  if (!origin) return null
  if (origin.startsWith("chrome-extension://")) return origin

  const rawOrigins = process.env.ALLOWED_ORIGINS
  const allowedOrigins = rawOrigins
    ? rawOrigins
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : []

  if (allowedOrigins.length === 0) return origin // In dev or if no whitelist configured, allow all
  if (allowedOrigins.includes(origin)) return origin

  return null
}

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl

  // Handle CORS for /api/ and /webhooks routes
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/webhooks")) {
    const origin = req.headers.get("origin")
    const allowedOrigin = getAllowedOrigin(origin)

    if (req.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 })
      if (allowedOrigin) {
        response.headers.set("Access-Control-Allow-Origin", allowedOrigin)
        response.headers.set("Access-Control-Allow-Credentials", "true")
        response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
      }
      return response
    }

    const response = NextResponse.next()
    if (allowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", allowedOrigin)
      response.headers.set("Access-Control-Allow-Credentials", "true")
      response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
    }
    return response
  }

  // Handle standard non-API page route protection
  if (isProtectedRoute(req) && !isPublicRoute(req)) {
    await auth.protect()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API and webhooks routes
    "/(api|webhooks|trpc)(.*)",
  ],
}
