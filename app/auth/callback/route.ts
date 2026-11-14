import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const requestedPath = searchParams.get("next") ?? "/"
  const candidate = new URL(requestedPath, origin)
  const isSafeLocalPath = requestedPath.startsWith("/") && !requestedPath.startsWith("//") && candidate.origin === origin
  const next = isSafeLocalPath ? candidate : new URL("/", origin)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(next)
  }

  next.searchParams.set("auth", "error")
  return NextResponse.redirect(next)
}
