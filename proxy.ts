import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth

  const isProtectedRoute = req.nextUrl.pathname.startsWith("/dashboard")

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/signin", req.nextUrl.origin)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*"],
}