import { NextResponse } from "next/server"

export default function middleware(req: any) {
  const url = req.nextUrl

  if (url.pathname === "/goodbye" || url.pathname.startsWith("/_next/")) {
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL("/goodbye", req.url))
}

export const config = {
  matcher: [
    "/((?!_next|.*\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|map)).*)",
  ],
}
