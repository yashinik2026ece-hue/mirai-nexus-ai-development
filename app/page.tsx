import { MiraiApp } from "@/components/mirai-app"
import { createClient } from "@/lib/supabase/server"

export default async function Page({ searchParams }: { searchParams: Promise<{ auth?: string }> }) {
  const { auth } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <MiraiApp initialUser={user ? { id: user.id, email: user.email ?? null, displayName: typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : undefined } : null} initialAuthError={auth === "error"} />
}
