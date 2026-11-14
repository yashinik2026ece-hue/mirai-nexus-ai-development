"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function AuthResetPassword({ hasSession, initialError = false }: { hasSession: boolean; initialError?: boolean }) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [feedback, setFeedback] = useState(initialError ? "This reset link is invalid or expired. Request a new one from your account settings." : "")
  const requestInFlight = useRef(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!hasSession || requestInFlight.current) return
    if (password !== confirmPassword) {
      setFeedback("The passwords don’t match. Check both fields and try again.")
      return
    }
    requestInFlight.current = true
    setBusy(true)
    setFeedback("")
    try {
      const { error } = await createClient().auth.updateUser({ password })
      if (error) {
        setFeedback(error.status === 429 ? "Too many attempts. Wait a little before trying again." : error.message.toLowerCase().includes("password") ? "Choose a stronger password that meets the account requirements." : "We couldn’t update your password. Request a new reset link and try again.")
        return
      }
      setSaved(true)
    } catch {
      setFeedback("We couldn’t connect right now. Please try again.")
    } finally {
      requestInFlight.current = false
      setBusy(false)
    }
  }

  return <main className="auth-page">
    <section className="auth-reset-card" aria-labelledby="reset-title">
      <Link className="auth-back-link" href="/"><ArrowLeft size={14} aria-hidden="true" /> Back to MIRAI</Link>
      <span className="auth-mark auth-reset-mark" aria-hidden="true">M</span>
      <span className="eyebrow">SECURE ACCOUNT RECOVERY</span>
      <h1 id="reset-title">{saved ? "Password updated" : "Choose a new password"}</h1>
      <p className="auth-reset-description">{saved ? "Your password is ready. Sign in with your new credentials to continue." : "Set a strong password you haven’t used for another account."}</p>

      {!hasSession && !saved ? <div className="auth-reset-state" role="alert"><p>{feedback || "This reset session is unavailable or has expired. Request a fresh password reset link to continue."}</p><Link className="button button-primary full-button" href="/">Return to MIRAI <ArrowUpRight size={15} /></Link></div> : null}
      {hasSession && !saved ? <form className="auth-form auth-reset-form" onSubmit={submit}>
        <label className="auth-field">New password<div className="auth-password-wrap"><input type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} required placeholder="At least 8 characters" /><button className="auth-password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
        <label className="auth-field">Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} maxLength={128} required placeholder="Enter it once more" /></label>
        <button className="button button-primary full-button auth-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle size={15} className="auth-spinner" aria-hidden="true" /> Updating…</> : <>Update password <ArrowUpRight size={15} aria-hidden="true" /></>}</button>
        {feedback && <p className="auth-feedback is-error" role="alert">{feedback}</p>}
      </form> : null}
      {saved && <Link className="button button-primary full-button auth-reset-home" href="/">Continue to your account <ArrowUpRight size={15} /></Link>}
      <span className="auth-security-note auth-reset-security"><LockKeyhole size={12} aria-hidden="true" /> Your session is protected by Supabase Auth</span>
    </section>
  </main>
}
