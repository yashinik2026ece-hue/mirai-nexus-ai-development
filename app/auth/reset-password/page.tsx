import { AuthResetPassword } from "@/components/auth-reset-password"
import { createClient } from "@/lib/supabase/server"

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ auth?: string }> }) {
  const [{ auth }, supabase] = await Promise.all([searchParams, createClient()])
  const { data: { user } } = await supabase.auth.getUser()

  return <AuthResetPassword hasSession={Boolean(user)} initialError={auth === "error"} />
}
