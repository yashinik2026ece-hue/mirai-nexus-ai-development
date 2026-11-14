"use client"

import { useRef, useState } from "react"
import { ArrowUpRight, Eye, EyeOff, LockKeyhole, LoaderCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type AuthMode = "signin" | "signup" | "recovery"
type Feedback = { kind: "success" | "error"; text: string } | null

function getAuthRedirect(next = "/") {
  const callback = new URL("/auth/callback", window.location.origin)
  if (next !== "/") callback.searchParams.set("next", next)

  const developmentRedirect = process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL : undefined
  if (!developmentRedirect) return callback.toString()

  const proxy = new URL(developmentRedirect)
  if (next !== "/") proxy.searchParams.set("next", next)
  return proxy.toString()
}

function getAuthError(message: string, status?: number) {
  const normalized = message.toLowerCase()
  if (status === 429 || normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Too many attempts. Please wait a little before trying again."
  }
  if (normalized.includes("not confirmed") || normalized.includes("email_not_confirmed")) {
    return "Confirm your email using the link we sent before signing in."
  }
  if (normalized.includes("password") && (normalized.includes("weak") || normalized.includes("short") || normalized.includes("length"))) {
    return "Choose a stronger password that meets the account requirements."
  }
  if (normalized.includes("provider is not enabled") || normalized.includes("unsupported provider")) {
    return "Google sign-in is not enabled for this project yet."
  }
  if (normalized.includes("invalid login credentials") || status === 400 || status === 401) {
    return "Invalid email or password."
  }
  return "We couldn’t complete that request. Please try again."
}

export function AuthCard() {
  const [mode, setMode] = useState<AuthMode>("signup")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [emailRequestSent, setEmailRequestSent] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const requestInFlight = useRef(false)

  const changeMode = (nextMode: AuthMode) => {
    if (requestInFlight.current) return
    setMode(nextMode)
    setEmailRequestSent(false)
    setFeedback(null)
    setPassword("")
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (requestInFlight.current || (mode !== "signin" && emailRequestSent)) return
    requestInFlight.current = true
    setBusy(true)
    setFeedback(null)

    const normalizedEmail = email.trim().toLowerCase()
    try {
      const supabase = createClient()
      if (mode === "signup") {
        if (name.trim().length < 2) {
          setFeedback({ kind: "error", text: "Enter your name to create an account." })
          return
        }
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: getAuthRedirect(), data: { display_name: name.trim() } },
        })
        if (error) {
          setFeedback({ kind: "error", text: getAuthError(error.message, error.status) })
          return
        }
        if (data.session) {
          window.location.assign("/")
          return
        }
        setEmailRequestSent(true)
        setFeedback({ kind: "success", text: "If this email can be registered, confirmation instructions will arrive shortly. Check your inbox before signing in." })
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
        if (error) {
          setFeedback({ kind: "error", text: getAuthError(error.message, error.status) })
          return
        }
        window.location.assign("/")
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: getAuthRedirect("/auth/reset-password"),
        })
        if (error) {
          setFeedback({ kind: "error", text: getAuthError(error.message, error.status) })
          return
        }
        setEmailRequestSent(true)
        setFeedback({ kind: "success", text: "If an account matches that address, a password reset link will arrive shortly." })
      }
    } catch {
      setFeedback({ kind: "error", text: "We couldn’t connect right now. Please try again." })
    } finally {
      requestInFlight.current = false
      setBusy(false)
    }
  }

  const signInWithGoogle = async () => {
    if (requestInFlight.current) return
    requestInFlight.current = true
    setBusy(true)
    setFeedback(null)
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: getAuthRedirect() },
      })
      if (error) setFeedback({ kind: "error", text: getAuthError(error.message, error.status) })
    } catch {
      setFeedback({ kind: "error", text: "We couldn’t connect to Google sign-in. Please try again." })
    } finally {
      requestInFlight.current = false
      setBusy(false)
    }
  }

  const isRecovery = mode === "recovery"
  const isSignUp = mode === "signup"
  const title = isRecovery ? "Reset your password" : isSignUp ? "Build your learning profile" : "Welcome back"
  const description = isRecovery ? "We’ll send a secure reset link if an account matches your email." : isSignUp ? "One account for your skills, goals, and progress." : "Sign in to continue where you left off."

  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-card-heading">
        <span className="auth-mark" aria-hidden="true">M</span>
        <div>
          <span className="eyebrow">{isRecovery ? "ACCOUNT RECOVERY" : isSignUp ? "YOUR NEXT CHAPTER" : "LEARNER ACCOUNT"}</span>
          <h3 id="auth-title">{title}</h3>
          <p>{description}</p>
        </div>
      </div>

      {!isRecovery && <button className="auth-google-button" type="button" onClick={signInWithGoogle} disabled={busy}>
        {busy ? <LoaderCircle size={16} className="auth-spinner" aria-hidden="true" /> : <GoogleMark />}
        <span>{busy ? "Connecting…" : isSignUp ? "Sign up with Google" : "Continue with Google"}</span>
      </button>}

      {!isRecovery && <div className="auth-divider"><span>or continue with email</span></div>}

      <form className="auth-form auth-modern-form" onSubmit={submit}>
        {isSignUp && <label className="auth-field">Your name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="How should we address you?" required minLength={2} maxLength={100} /></label>}
        <label className="auth-field">Email address<input type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setEmailRequestSent(false); setFeedback(null) }} placeholder="you@example.com" required maxLength={254} disabled={busy} /></label>
        {!isRecovery && <label className="auth-field">Password<div className="auth-password-wrap"><input type={showPassword ? "text" : "password"} autoComplete={isSignUp ? "new-password" : "current-password"} value={password} onChange={(event) => { setPassword(event.target.value); setFeedback(null) }} placeholder={isSignUp ? "At least 8 characters" : "Enter your password"} required minLength={8} maxLength={128} disabled={busy} /><button className="auth-password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>}
        {mode === "signin" && <button className="auth-inline-link" type="button" onClick={() => changeMode("recovery")}>Forgot password?</button>}
        <button className="button button-primary full-button auth-submit" type="submit" disabled={busy || (mode !== "signin" && emailRequestSent)}>
          {busy ? <><LoaderCircle size={15} className="auth-spinner" aria-hidden="true" /> Working…</> : emailRequestSent ? <>Check your inbox <LockKeyhole size={14} aria-hidden="true" /></> : <>{isRecovery ? "Send reset link" : isSignUp ? "Create account" : "Sign in"}<ArrowUpRight size={15} aria-hidden="true" /></>}
        </button>
        {feedback && <p className={`auth-feedback ${feedback.kind === "error" ? "is-error" : "is-success"}`} role={feedback.kind === "error" ? "alert" : "status"}>{feedback.text}</p>}
      </form>

      <div className="auth-card-footer">
        {isRecovery ? <button className="auth-inline-link" type="button" onClick={() => changeMode("signin")}>Back to sign in</button> : <span>{isSignUp ? "Already have an account?" : "New to MIRAI?"} <button className="auth-inline-link" type="button" onClick={() => changeMode(isSignUp ? "signin" : "signup")}>{isSignUp ? "Sign in" : "Create an account"}</button></span>}
        <span className="auth-security-note"><LockKeyhole size={12} aria-hidden="true" /> Protected by Supabase Auth</span>
      </div>
    </section>
  )
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="google-mark"><path fill="#4285F4" d="M21.6 12.23c0-.72-.06-1.42-.18-2.09H12v3.95h5.38a4.6 4.6 0 0 1-2 3.02v2.47h3.25c1.9-1.75 2.97-4.33 2.97-7.35Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.25-2.47c-.9.6-2.03.96-3.37.96-2.6 0-4.8-1.75-5.59-4.1H3.05v2.55A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.97a6 6 0 0 1 0-3.94V7.48H3.05a10 10 0 0 0 0 9.04l3.36-2.55Z"/><path fill="#EA4335" d="M12 5.93c1.47 0 2.78.5 3.82 1.52l2.87-2.87C16.95 2.94 14.7 2 12 2a10 10 0 0 0-8.95 5.48l3.36 2.55c.79-2.35 2.98-4.1 5.59-4.1Z"/></svg>
}
