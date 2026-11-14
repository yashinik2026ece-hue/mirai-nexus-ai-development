"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { Activity, ArrowDownUp, ArrowUpRight, BarChart3, BookOpenCheck, Brain, BriefcaseBusiness, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardCheck, Code2, Compass, Cpu, FileBadge, FileCode2, GraduationCap, LayoutDashboard, LifeBuoy, ListChecks, LockKeyhole, Menu, MessageCircle, MessageSquareText, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings2, Shield, Sparkles, Target, Trophy, UserRound, Users, X } from "lucide-react"
import { MiraiDashboard } from "@/components/mirai-dashboard"
import { MiraiModule } from "@/components/mirai-module"
import { AIOrchestrator } from "@/components/ai-orchestrator"
import { buildWeeklySchedule, getMatch, initialEvents, initialSkills, initialTasks, navigation, type AcademicEvent, type LearningTask, type Skill, type SkillEvidence } from "@/lib/mirai-data"
import type { User } from "@supabase/supabase-js"

const iconMap: Record<string, React.ElementType> = {
  Overview: LayoutDashboard, "My Profile": UserRound, "Skill DNA": Brain, "Career Discovery": Compass, "Career Explorer": Compass, "Career Twin": Users, "Skill Gap Analysis": Target, "Learning Roadmap": ListChecks, "Learning Roadmaps": ListChecks, "MIRAI LIFE-SYNC": CalendarDays, "Personal AI Tutor": MessageCircle, "Smart Resource Hub": BookOpenCheck, "Challenge Lab": Trophy, "Mission Arena": Trophy, Assessments: ClipboardCheck, "Misconception Detector": Brain, "ECE Virtual Lab": Cpu, Projects: FileCode2, "Project Converter": FileCode2, "Comeback Intelligence": Activity, "Interview Arena": MessageSquareText, "Portfolio Builder": FileBadge, "AI Mentor": Sparkles, "AI Orchestrator": Activity, "Progress Analytics": BarChart3, "Progress Dashboard": BarChart3, "Institution Insights": GraduationCap, Settings: Settings2,
}

type Profile = { displayName: string; institution: string; department: string; studyYear: string; hours: number; career: string }
type StoredData = { profile: Record<string, unknown> | null; skills: Record<string, unknown>[]; schedules: Record<string, unknown>[]; events: Record<string, unknown>[]; evidence: Record<string, unknown>[] }
type GuestSnapshot = { version: 1; profile: Profile; skills: Skill[]; tasks: LearningTask[]; events: AcademicEvent[]; evidence: SkillEvidence[]; examMode: boolean }
const GUEST_STORAGE_KEY = "mirai:guest-learning-state:v1"

function readGuestSnapshot(): GuestSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(GUEST_STORAGE_KEY) ?? "null")
    if (!parsed || typeof parsed !== "object") return null
    const snapshot = parsed as Partial<GuestSnapshot>
    if (snapshot.version !== 1 || !snapshot.profile || !Array.isArray(snapshot.skills) || !Array.isArray(snapshot.tasks) || !Array.isArray(snapshot.events) || !Array.isArray(snapshot.evidence)) return null
    return snapshot as GuestSnapshot
  } catch {
    return null
  }
}

export function MiraiApp({ initialUser, initialAuthError = false }: { initialUser: Pick<User, "id"> & { email: string | null; displayName?: string } | null; initialAuthError?: boolean }) {
  const [user, setUser] = useState(initialUser)
  const [page, setPage] = useState("Overview")
  const [projectTechPrefill, setProjectTechPrefill] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [notice, setNotice] = useState(initialAuthError ? "That authentication link is invalid or expired. Request a new one and try again." : "")
  const [localDemoFallback, setLocalDemoFallback] = useState(false)
  const [guestStorageReady, setGuestStorageReady] = useState(false)
  const [search, setSearch] = useState("")
  const [examMode, setExamMode] = useState(false)
  const [profile, setProfile] = useState<Profile>({ displayName: initialUser?.displayName || initialUser?.email?.split("@")[0] || "Aarav", institution: initialUser ? "" : "Riverdale Institute of Technology", department: initialUser ? "" : "Computer Science", studyYear: initialUser ? "" : "Second year", hours: 8, career: "Full Stack Developer" })
  const [skills, setSkills] = useState<Skill[]>(initialUser ? [] : initialSkills)
  const [tasks, setTasks] = useState<LearningTask[]>(initialUser ? [] : initialTasks)
  const [events, setEvents] = useState<AcademicEvent[]>(initialUser ? [] : initialEvents)
  const [evidence, setEvidence] = useState<SkillEvidence[]>([])
  const { mutate } = useSWRConfig()

  const restoreGuestSnapshot = useCallback(() => {
    const saved = readGuestSnapshot()
    setProfile(saved?.profile ?? { displayName: "Aarav", institution: "Riverdale Institute of Technology", department: "Computer Science", studyYear: "Second year", hours: 8, career: "Full Stack Developer" })
    setSkills(saved?.skills ?? initialSkills)
    setTasks(saved?.tasks ?? initialTasks)
    setEvents(saved?.events ?? initialEvents)
    setEvidence(saved?.evidence ?? [])
    setExamMode(saved?.examMode ?? false)
    setGuestStorageReady(true)
  }, [])

  useEffect(() => {
    if (initialUser?.id) setGuestStorageReady(true)
    else restoreGuestSnapshot()
  }, [initialUser?.id, restoreGuestSnapshot])

  useEffect(() => {
    if (user || localDemoFallback || !guestStorageReady) return
    try {
      const snapshot: GuestSnapshot = { version: 1, profile, skills, tasks, events, evidence, examMode }
      window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(snapshot))
    } catch {
      setNotice("This browser could not save guest progress. You can still keep learning in this session.")
    }
  }, [user, localDemoFallback, guestStorageReady, profile, skills, tasks, events, evidence, examMode])

  const dataKey = user ? ["mirai-private-data", user.id] : null
  const { data: stored, error: dataError, isLoading } = useSWR<StoredData>(dataKey, async () => {
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const [profileResult, skillResult, scheduleResult, eventResult, learnerEvidenceResult, gapHistoryResult] = await Promise.all([
      supabase.from("profiles").select("*").maybeSingle(),
      supabase.from("skills").select("*").order("updated_at", { ascending: false }),
      supabase.from("learning_schedules").select("*").order("starts_at", { ascending: true }),
      supabase.from("academic_events").select("*").order("starts_at", { ascending: true }),
      supabase.from("skill_evidence").select("id,skill_id,source_type,title,description,created_at").in("source_type", ["assessment", "project"]).order("created_at", { ascending: false }).limit(100),
      supabase.from("skill_evidence").select("id,skill_id,source_type,title,description,created_at").eq("source_type", "career_gap").order("created_at", { ascending: false }).limit(500),
    ])
    const failed = [profileResult, skillResult, scheduleResult, eventResult, learnerEvidenceResult, gapHistoryResult].find((result) => result.error)
    if (failed?.error) throw failed.error
    const evidence = [...(gapHistoryResult.data ?? []), ...(learnerEvidenceResult.data ?? [])].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    return { profile: profileResult.data, skills: skillResult.data ?? [], schedules: scheduleResult.data ?? [], events: eventResult.data ?? [], evidence }
  }, { revalidateOnFocus: false, keepPreviousData: false, onErrorRetry: () => {} })

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined

    void import("@/lib/supabase/client").then(({ createClient }) => {
      if (!active) return
      const supabase = createClient()
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!active) return
        const authUser = session?.user
        if (authUser) {
          setUser({ id: authUser.id, email: authUser.email ?? null, displayName: typeof authUser.user_metadata?.display_name === "string" ? authUser.user_metadata.display_name : undefined })
          if (event === "SIGNED_IN" || event === "USER_UPDATED" || (event === "INITIAL_SESSION" && authUser.id !== initialUser?.id)) {
            setLocalDemoFallback(false)
            setProfile({ displayName: authUser.user_metadata?.display_name || authUser.email?.split("@")[0] || "Learner", institution: "", department: "", studyYear: "", hours: 8, career: "Full Stack Developer" })
            setSkills([])
            setTasks([])
            setEvents([])
            setEvidence([])
          }
        } else {
          setUser(null)
          if (event === "SIGNED_OUT" || (event === "INITIAL_SESSION" && initialUser?.id)) {
            setLocalDemoFallback(false)
            restoreGuestSnapshot()
          }
        }
      })
      unsubscribe = () => subscription.unsubscribe()
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [initialUser?.id, restoreGuestSnapshot])

  useEffect(() => {
    if (!stored || localDemoFallback) return
    if (stored.profile) setProfile({ displayName: String(stored.profile.display_name ?? ""), institution: String(stored.profile.institution ?? ""), department: String(stored.profile.department ?? ""), studyYear: String(stored.profile.study_year ?? ""), hours: Number(stored.profile.learning_hours_per_week ?? 8), career: String(stored.profile.career_goal ?? "Full Stack Developer") })
    setSkills(stored.skills.map((row) => ({ id: String(row.id), name: String(row.name), category: String(row.category ?? "Technical"), level: Number(row.proficiency ?? 0), confidence: Number(row.confidence ?? 0), status: row.status === "demonstrated" ? "demonstrated" : row.status === "developing" ? "developing" : row.status === "not_yet_demonstrated" ? "not_yet_demonstrated" : "unassessed", evidence: String(row.evidence_source ?? "No assessment yet") })))
    setTasks(stored.schedules.map((row) => { const date = new Date(String(row.starts_at)); return { id: String(row.id), title: String(row.title), detail: String(row.explanation ?? "Learning activity"), duration: Number(row.duration_minutes ?? 30), day: (date.getDay() + 6) % 7, time: date.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false }), status: row.status === "completed" ? "completed" : row.status === "missed" ? "missed" : "planned", priority: 2 } }))
    setEvents(stored.events.map((row) => ({ id: String(row.id), title: String(row.title), type: row.event_type === "exam" ? "Exam" : row.event_type === "deadline" ? "Deadline" : "Assignment", date: String(row.starts_at).slice(0, 10) })))
    setEvidence(stored.evidence.map((row) => ({ id: String(row.id), skillId: row.skill_id ? String(row.skill_id) : null, sourceType: String(row.source_type ?? "other"), title: String(row.title ?? "Evidence"), description: String(row.description ?? ""), createdAt: String(row.created_at ?? "") })))
  }, [stored, localDemoFallback])

  useEffect(() => {
    const navigate = (event: Event) => { const next = (event as CustomEvent<string>).detail; if (navigation.some((item) => item.label === next)) setPage(next) }
    window.addEventListener("mirai:navigate", navigate)
    return () => window.removeEventListener("mirai:navigate", navigate)
  }, [])

  const persistProfile = useCallback(async (next: Profile) => {
    if (!user || localDemoFallback) { notify("Guest preferences are saved on this device."); return }
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: next.displayName.trim(), institution: next.institution.trim(), department: next.department.trim(), study_year: next.studyYear, career_goal: next.career, learning_hours_per_week: Math.max(1, Math.min(60, next.hours)), updated_at: new Date().toISOString() })
    if (error) { notify("Could not save your profile. Please try again."); return }
    notify("Profile saved to your private account.")
    await mutate(dataKey)
  }, [user, mutate, dataKey])

  const notify = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(""), 3600) }

  const navigate = (label: string, technologyPrefill = "") => { setProjectTechPrefill(technologyPrefill); setPage(label); setMobileOpen(false); setSearch(""); window.scrollTo({ top: 0, behavior: "smooth" }) }
  const filteredNavigation = useMemo(() => navigation.filter((item) => item.label.toLowerCase().includes(search.trim().toLowerCase())), [search])

  const saveGapSnapshot = async (career: string) => {
    const match = getMatch(career, skills)
    const createdAt = new Date().toISOString()
    const version = evidence.filter((item) => item.sourceType === "career_gap").reduce((highest, item) => Math.max(highest, Number(item.title.match(/^Career gap v(\d+)/)?.[1] ?? 0)), 0) + 1
    const title = `Career gap v${version} · ${career}`
    const description = JSON.stringify({
      schemaVersion: 1,
      version,
      goal: career,
      score: match.score,
      assessedCount: match.assessed.length,
      requirementCount: match.requirements.length,
      requirements: match.requirements.map((name) => {
        const skill = skills.find((item) => item.name.toLowerCase() === name.toLowerCase())
        return { name, status: skill?.status ?? "unassessed", level: skill?.level ?? null, confidence: skill?.confidence ?? null }
      }),
    })
    if (!user || localDemoFallback) {
      setEvidence((current) => [{ id: crypto.randomUUID(), skillId: null, sourceType: "career_gap", title, description, createdAt }, ...current])
      return true
    }
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const { data, error } = await supabase.from("skill_evidence").insert({ user_id: user.id, skill_id: null, source_type: "career_gap", title, description }).select("id,skill_id,source_type,title,description,created_at").single()
    if (error || !data) { notify("Career goal changed, but its versioned gap snapshot could not be saved."); return false }
    setEvidence((current) => [{ id: String(data.id), skillId: null, sourceType: String(data.source_type), title: String(data.title), description: String(data.description), createdAt: String(data.created_at) }, ...current])
    await mutate(dataKey)
    return true
  }

  const changeRole = (career: string) => {
    const nextProfile = { ...profile, career }
    setProfile(nextProfile)
    if (user && !localDemoFallback) void persistProfile(nextProfile)
    void saveGapSnapshot(career)
  }

  const completeTask = async (id: string) => {
    const current = tasks.find((task) => task.id === id)
    if (!current || current.status === "completed") return
    if (user && !localDemoFallback && !id.startsWith("generated-")) {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data: schedule, error } = await supabase.from("learning_schedules").update({ status: "completed" }).eq("id", id).eq("user_id", user.id).select("milestone_id").maybeSingle()
      if (error || !schedule) { notify("Could not save that completion. Your plan was not changed locally."); return }
      const milestoneResult = schedule.milestone_id ? await supabase.from("roadmap_milestones").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", schedule.milestone_id).eq("user_id", user.id) : { error: null }
      setTasks((items) => items.map((task) => task.id === id ? { ...task, status: "completed" } : task))
      await mutate(dataKey)
      if (milestoneResult.error) notify("Session completion saved; its roadmap milestone needs a refresh.")
      return
    }
    setTasks((items) => items.map((task) => task.id === id ? { ...task, status: "completed" } : task))
    if (!user || localDemoFallback) notify("Session completed · saved on this device.")
  }

  const markTaskMissed = async (id: string) => {
    if (user && !localDemoFallback && !id.startsWith("generated-")) {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { error } = await supabase.from("learning_schedules").update({ status: "missed" }).eq("id", id).eq("user_id", user.id)
      if (error) { notify("Could not update this session. Try again when your connection is available."); return }
    }
    setTasks((items) => items.map((task) => task.id === id ? { ...task, status: "missed" } : task))
    if (!user || localDemoFallback) notify("Session marked missed · saved on this device.")
    else await mutate(dataKey)
  }

  const rescheduleTask = async (id: string) => {
    const task = tasks.find((item) => item.id === id)
    if (!task) return
    const monday = new Date()
    monday.setHours(0, 0, 0, 0)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const todayIndex = (new Date().getDay() + 6) % 7
    const busyDays = new Set(events.map((event) => Math.floor((new Date(`${event.date}T12:00:00`).getTime() - monday.getTime()) / 86_400_000)).filter((day) => day >= 0 && day < 7))
    const nextDay = Array.from({ length: 7 }, (_, index) => (Math.max(todayIndex, task.day) + index + 1) % 7).find((day) => day >= todayIndex && !busyDays.has(day) && !tasks.some((item) => item.id !== id && item.day === day && item.status !== "completed"))
    if (nextDay === undefined) { notify("No open day remains this week. Change a commitment or generate a new weekly schedule."); return }
    const hour = Math.min(20, Math.max(9, new Date().getHours() + 1))
    const startsAt = new Date(monday)
    startsAt.setDate(monday.getDate() + nextDay)
    startsAt.setHours(hour, 0, 0, 0)
    if (user && !localDemoFallback && !id.startsWith("generated-")) {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { error } = await supabase.from("learning_schedules").update({ starts_at: startsAt.toISOString(), status: "planned" }).eq("id", id).eq("user_id", user.id)
      if (error) { notify("Could not save the new session time."); return }
    }
    setTasks((items) => items.map((item) => item.id === id ? { ...item, day: nextDay, time: `${String(hour).padStart(2, "0")}:00`, status: "planned" } : item))
    if (user && !localDemoFallback) await mutate(dataKey)
    notify(user ? "Missed session moved to the next free day and saved." : "Missed session moved · saved on this device.")
  }

  const addSkill = async (name: string, status: Skill["status"]) => {
    const normalizedName = name.trim().slice(0, 80)
    if (!normalizedName || skills.some((skill) => skill.name.toLowerCase() === normalizedName.toLowerCase())) { notify("That skill is already on your list."); return }
    if (!user || localDemoFallback) {
      setSkills((current) => [...current, { id: crypto.randomUUID(), name: normalizedName, category: "Technical", level: 0, confidence: 0, status, evidence: "Added by learner · not yet assessed" }])
      notify("Skill added · saved on this device.")
      return
    }
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const { error } = await supabase.from("skills").insert({ user_id: user.id, name: normalizedName, category: "Technical", proficiency: 0, status, confidence: 0, evidence_source: "Added by learner · not yet assessed" })
    if (error) { notify("Could not add that skill. Please try again."); return }
    await mutate(dataKey)
    notify(status === "unassessed" ? "Skill added as unassessed. It is not treated as a gap." : "Skill added as developing, not yet verified.")
  }

  const recordAssessment = async (skillId: string, result: import("@/components/skill-assessment").FormativeResult) => {
    const skill = skills.find((item) => item.id === skillId)
    if (!skill) return { ok: false, message: "This skill is no longer in the current list. Refresh and try again." }
    const createdAt = new Date().toISOString()
    const title = `Formative skill check · ${skill.name}`
    const description = JSON.stringify({ schemaVersion: 1, assessmentType: "four-question-knowledge-check", score: result.score, confidence: result.confidence, correctCount: result.correctCount, totalQuestions: result.totalQuestions, status: result.status, weakConcepts: result.weakConcepts, confidenceMethod: "70% observed accuracy + 30% assessment breadth" })
    const evidenceItem: SkillEvidence = { id: crypto.randomUUID(), skillId, sourceType: "assessment", title, description, createdAt }
    if (!user || localDemoFallback) {
      const updatedSkills = skills.map((item) => item.id === skillId ? { ...item, level: result.score, confidence: result.confidence, status: result.status, evidence: `Formative check · ${result.correctCount}/${result.totalQuestions} correct` } : item)
      setSkills(updatedSkills)
      setEvidence((current) => [evidenceItem, ...current])
      await regeneratePlan(profile.hours, updatedSkills, result.weakConcepts)
      notify("Assessment saved in this demo session; the roadmap now prioritizes the missed concepts. This is not certification.")
      return { ok: true, message: `Saved for this demo session: ${result.correctCount}/${result.totalQuestions} correct · ${result.score}% proficiency estimate.` }
    }
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const { data: savedEvidence, error: evidenceError } = await supabase.from("skill_evidence").insert({ user_id: user.id, skill_id: skillId, source_type: "assessment", title, description }).select("id,skill_id,source_type,title,description,created_at").single()
    if (evidenceError || !savedEvidence) return { ok: false, message: "The assessment evidence could not be saved. Your skill record was not changed." }
    const { error: skillError } = await supabase.from("skills").update({ proficiency: result.score, confidence: result.confidence, status: result.status, evidence_source: `Formative check · ${result.correctCount}/${result.totalQuestions} correct`, updated_at: createdAt }).eq("id", skillId).eq("user_id", user.id)
    if (skillError) {
      setEvidence((current) => [{ id: String(savedEvidence.id), skillId, sourceType: "assessment", title, description, createdAt: String(savedEvidence.created_at) }, ...current])
      await mutate(dataKey)
      return { ok: false, message: "Evidence was saved, but the skill summary did not sync. Refresh before submitting again." }
    }
    setEvidence((current) => [{ id: String(savedEvidence.id), skillId, sourceType: "assessment", title, description, createdAt: String(savedEvidence.created_at) }, ...current])
    const updatedSkills = skills.map((item) => item.id === skillId ? { ...item, level: result.score, confidence: result.confidence, status: result.status, evidence: `Formative check · ${result.correctCount}/${result.totalQuestions} correct` } : item)
    setSkills(updatedSkills)
    await mutate(dataKey)
    await regeneratePlan(profile.hours, updatedSkills, result.weakConcepts)
    notify("Assessment evidence saved; the roadmap now prioritizes the missed concepts. This check is formative, not certification.")
    return { ok: true, message: `Saved to your private account: ${result.correctCount}/${result.totalQuestions} correct · ${result.score}% proficiency estimate.` }
  }

  const addEvent = async (event: AcademicEvent) => {
    if (!user || localDemoFallback) { setEvents((current) => [...current, event]); notify("Commitment added · saved on this device."); return }
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const { error } = await supabase.from("academic_events").insert({ user_id: user.id, title: event.title, event_type: event.type.toLowerCase(), starts_at: new Date(`${event.date}T09:00:00`).toISOString() })
    if (error) { notify("Could not add that commitment."); return }
    await mutate(dataKey); notify("Commitment added to your private calendar.")
  }

  const saveProject = async (project: { title: string; description: string; contribution: string; repositoryUrl: string; technologies: string[] }) => {
    if (!user || localDemoFallback) {
      const projectSkills = new Set(project.technologies.map((name) => name.toLowerCase()))
      const evidenceLabel = `Project evidence · ${project.title}`
      setSkills((current) => {
        const updated = current.map((skill) => projectSkills.has(skill.name.toLowerCase()) && !skill.evidence.includes(evidenceLabel)
          ? { ...skill, evidence: [skill.evidence !== "No assessment yet" ? skill.evidence : "", evidenceLabel].filter(Boolean).join(" · ") }
          : skill)
        const additions = project.technologies.filter((name) => !current.some((skill) => skill.name.toLowerCase() === name.toLowerCase())).map((name) => ({ id: crypto.randomUUID(), name, category: "Technical", level: 0, confidence: 0, status: "unassessed" as const, evidence: `${evidenceLabel} · pending assessment` }))
        return [...updated, ...additions]
      })
      setTasks((current) => current.map((task) => {
        const requiredSkill = task.title.startsWith("Gather evidence for ") ? task.title.slice("Gather evidence for ".length).toLowerCase() : ""
        return requiredSkill && projectSkills.has(requiredSkill) ? { ...task, status: "completed" } : task
      }))
      notify("Project evidence added to this demo session only; skill status remains unassessed.")
      return true
    }

    let repositoryUrl: string | null = null
    if (project.repositoryUrl.trim()) {
      try {
        const parsed = new URL(project.repositoryUrl)
        if (parsed.protocol !== "https:") { notify("Use an HTTPS project URL."); return false }
        repositoryUrl = parsed.toString()
      } catch { notify("Enter a valid project URL."); return false }
    }
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const { data: savedProject, error: projectError } = await supabase.from("projects").insert({ user_id: user.id, title: project.title, description: project.description, technologies: project.technologies, contribution: project.contribution, repository_url: repositoryUrl }).select("id").single()
    if (projectError || !savedProject) { notify("Could not save this project. Please try again."); return false }

    const evidenceRows: { user_id: string; skill_id: string; source_type: string; title: string; description: string }[] = []
    for (const name of project.technologies) {
      let skillId = skills.find((skill) => skill.name.toLowerCase() === name.toLowerCase())?.id
      if (!skillId) {
        const { data: createdSkill, error: skillError } = await supabase.from("skills").insert({ user_id: user.id, name, category: "Technical", status: "unassessed", proficiency: 0, confidence: 0, evidence_source: `Project evidence · ${project.title} · pending assessment` }).select("id").single()
        if (skillError || !createdSkill) { notify("Project saved, but some skill links need to be added again from your Skill DNA."); await mutate(dataKey); return false }
        skillId = String(createdSkill.id)
      } else {
        const existingSkill = skills.find((skill) => skill.id === skillId)
        const evidenceSource = [existingSkill?.evidence && existingSkill.evidence !== "No assessment yet" ? existingSkill.evidence : "", `Project evidence · ${project.title}`].filter(Boolean).join(" · ")
        await supabase.from("skills").update({ evidence_source: evidenceSource }).eq("id", skillId)
      }
      evidenceRows.push({ user_id: user.id, skill_id: skillId, source_type: "project", title: project.title, description: [project.description, project.contribution && `Contribution: ${project.contribution}`, repositoryUrl && `Repository: ${repositoryUrl}`].filter(Boolean).join("\n") })
    }
    if (evidenceRows.length) {
      const { error: evidenceError } = await supabase.from("skill_evidence").insert(evidenceRows)
      if (evidenceError) { notify("Project saved, but its evidence links need a retry."); await mutate(dataKey); return false }
    }
    const evidenceTaskIds = tasks.filter((task) => {
      const requiredSkill = task.title.startsWith("Gather evidence for ") ? task.title.slice("Gather evidence for ".length).toLowerCase() : ""
      return task.status !== "completed" && requiredSkill && project.technologies.some((name) => name.toLowerCase() === requiredSkill)
    }).map((task) => task.id)
    if (evidenceTaskIds.length) {
      const { error: scheduleError } = await supabase.from("learning_schedules").update({ status: "completed" }).eq("user_id", user.id).in("id", evidenceTaskIds)
      if (scheduleError) { await mutate(dataKey); notify("Project and skill evidence saved, but the matching roadmap step remains open."); return true }
    }
    await mutate(dataKey)
    notify("Project and reviewed skill evidence saved privately. Skills remain unassessed until verified.")
    return true
  }

  async function regeneratePlan(availableHours = profile.hours, skillOverride: Skill[] = skills, weakConcepts: string[] = []) {
    const completedIds = tasks.filter((task) => task.status === "completed").map((task) => `completed-title-${task.title.toLowerCase().replaceAll(" ", "-")}`)
    const next = buildWeeklySchedule({ examMode, availableHours, preferredStart: 9, events, completedIds, career: profile.career, skills: skillOverride, weakConcepts })
    if (!next.length) { notify("No open calendar days fit the selected plan. Adjust commitments or learning hours and try again."); return }
    if (!user || localDemoFallback) { setTasks(next); notify(`A ${next.length}-session plan is ready · saved on this device.`); return }

    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const { data: previousPlans, error: archiveError } = await supabase.from("learning_roadmaps").update({ status: "archived" }).eq("user_id", user.id).eq("status", "active").select("id")
    if (archiveError) { notify("Could not stage the new roadmap. Your current plan is unchanged."); return }
    const previousIds = (previousPlans ?? []).map((row) => String(row.id))
    const restorePrevious = async () => previousIds.length ? await supabase.from("learning_roadmaps").update({ status: "active" }).eq("user_id", user.id).in("id", previousIds) : { error: null }
    const { data: roadmap, error: roadmapError } = await supabase.from("learning_roadmaps").insert({ user_id: user.id, career_goal: profile.career, title: `${profile.career} · adaptive weekly roadmap`, status: "active" }).select("id").single()
    if (roadmapError || !roadmap) {
      const restored = await restorePrevious()
      notify(restored.error ? "New roadmap failed; refresh to verify the previous plan was restored." : "Could not save your roadmap. The previous plan remains active.")
      return
    }
    const rollbackNewPlan = async (milestoneIds: string[] = []) => {
      let cleanupFailed = false
      if (milestoneIds.length) cleanupFailed ||= Boolean((await supabase.from("learning_schedules").delete().eq("user_id", user.id).in("milestone_id", milestoneIds)).error)
      cleanupFailed ||= Boolean((await supabase.from("roadmap_milestones").delete().eq("user_id", user.id).eq("roadmap_id", roadmap.id)).error)
      cleanupFailed ||= Boolean((await supabase.from("learning_roadmaps").delete().eq("user_id", user.id).eq("id", roadmap.id)).error)
      const restored = await restorePrevious()
      return !cleanupFailed && !restored.error
    }
    const milestoneRows = next.map((task, sort_order) => ({ user_id: user.id, roadmap_id: roadmap.id, title: task.title, description: task.detail, duration_minutes: task.duration, priority: task.priority, status: task.status === "completed" ? "completed" : "pending", sort_order, completed_at: task.status === "completed" ? new Date().toISOString() : null }))
    const { data: milestones, error: milestoneError } = await supabase.from("roadmap_milestones").insert(milestoneRows).select("id,sort_order")
    if (milestoneError || !milestones) { const restored = await rollbackNewPlan(); notify(restored ? "Roadmap milestones could not be saved. The previous plan remains active." : "Roadmap save failed and cleanup was incomplete. Refresh to verify your plan before retrying."); return }

    const monday = new Date()
    monday.setHours(0, 0, 0, 0)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const scheduleRows = next.map((task, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + task.day)
      const [hour, minute] = task.time.split(":").map(Number)
      date.setHours(hour, minute, 0, 0)
      const milestone = milestones.find((item) => item.sort_order === index)
      return { user_id: user.id, milestone_id: milestone?.id ?? null, title: task.title, starts_at: date.toISOString(), duration_minutes: task.duration, status: task.status === "completed" ? "completed" : "planned", explanation: task.detail }
    })
    const milestoneIds = milestones.map((item) => String(item.id))
    const { data: savedSchedules, error: scheduleError } = await supabase.from("learning_schedules").insert(scheduleRows).select("id,milestone_id")
    if (scheduleError || !savedSchedules) { const restored = await rollbackNewPlan(milestoneIds); notify(restored ? "Calendar sessions could not be saved. The previous plan remains active." : "Roadmap save failed and cleanup was incomplete. Refresh to verify your plan before retrying."); return }

    const savedTasks = next.map((task, index) => ({ ...task, id: String(savedSchedules.find((item) => String(item.milestone_id) === String(milestoneIds[index]))?.id ?? task.id) }))
    setTasks(savedTasks)
    const { error: oldScheduleError } = await supabase.from("learning_schedules").delete().eq("user_id", user.id).eq("status", "planned").gte("starts_at", monday.toISOString()).not("milestone_id", "in", `(${milestoneIds.join(",")})`)
    await mutate(dataKey)
    if (oldScheduleError) { notify("New roadmap saved; an older planned calendar block may still appear."); return }
    notify(`A ${next.length}-session roadmap is saved around your assessed gaps, available time, and commitments.`)
  }

  const signOut = async () => {
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) { notify("We couldn’t sign you out. Please try again."); return }
    setUser(null); setLocalDemoFallback(false); restoreGuestSnapshot(); navigate("Overview"); notify("Signed out. Your guest workspace is ready on this device.")
  }

  const groups = [...new Set(navigation.map((item) => item.group))]
  return <main className="app-frame">
    {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="brand-row"><a className="brand-mark" href="#overview" onClick={(e) => { e.preventDefault(); navigate("Overview") }} aria-label="MIRAI home"><span className="brand-symbol"><span /><span /><span /><span /></span></a>{!collapsed && <div className="brand-wordmark">MIRAI<span>.</span><small>YOUR FUTURE, IN FOCUS</small></div>}<button className="collapse-button" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button><button className="mobile-close" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>
      <div className="workspace-switch"><span className="workspace-avatar">M</span>{!collapsed && <><span className="workspace-name">Learner workspace<small>Personal space <ChevronDown size={12} /></small></span><ArrowDownUp size={13} className="switch-icon" /></>}</div>
      <div className="sidebar-search"><Search size={14} /><input aria-label="Search navigation" placeholder={collapsed ? "" : "Search anything…"} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.nativeEvent.isComposing || e.keyCode === 229) return; if (e.key === "Enter" && filteredNavigation.length) navigate(filteredNavigation[0].label) }} /><kbd>⌘ K</kbd></div>
      <nav className="nav-scroll" aria-label="Main navigation">{groups.map((group) => { const items = filteredNavigation.filter((item) => item.group === group); return items.length ? <div className="nav-group" key={group}>{!collapsed && <span className="nav-group-label">{group}</span>}{items.map((item) => { const Icon = iconMap[item.label]; return <button className={`nav-item ${page === item.label ? "active" : ""}`} key={item.label} onClick={() => navigate(item.label)} title={collapsed ? item.label : undefined} aria-current={page === item.label ? "page" : undefined}><Icon size={17} strokeWidth={1.8} />{!collapsed && <span>{item.label}</span>}{item.label === "MIRAI LIFE-SYNC" && !collapsed && <span className="nav-new">NEW</span>}</button>})}</div> : null })}{filteredNavigation.length === 0 && <p className="no-results">No matching pages.</p>}</nav>
      {!collapsed && <div className="sidebar-bottom"><div className="support-card"><div className="support-spark"><Sparkles size={14} /></div><strong>A little support goes a long way.</strong><p>Your path can flex around the life you have.</p><button onClick={() => navigate("Comeback Intelligence")}>Build a gentle plan <ChevronRight size={13} /></button></div><div className="account-mini"><span className="avatar-small">{(profile.displayName || "A").slice(0, 1).toUpperCase()}</span><div><strong>{profile.displayName || "Guest learner"}</strong><span>{user ? "Learner account" : "Guest learner"}</span></div><button onClick={() => navigate("Settings")} aria-label="Open account settings"><Settings2 size={15} /></button></div></div>}
    </aside>

    <div className={`main-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <header className="topbar"><button className="mobile-menu" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={13} /><strong>{page}</strong></div><div className="topbar-actions"><span className={`mode-badge ${user && !localDemoFallback ? "connected" : "demo"}`}><span />{localDemoFallback ? "Local guest workspace" : user ? "Connected" : "Guest mode"}</span>      {!user && <><button className="button button-primary top-signin guest-continue" onClick={() => { setGuestStorageReady(true); setLocalDemoFallback(false); navigate("Overview"); notify("You’re learning as a guest. Progress saves on this device.") }}>Continue as Guest</button><button className="button button-secondary top-signin" onClick={() => navigate("Settings")}>Create account</button></>}<button className="top-icon" aria-label="Open Life-Sync planner" onClick={() => navigate("MIRAI LIFE-SYNC")}><CalendarDays size={17} /></button><button className="top-avatar" onClick={() => navigate("My Profile")} aria-label="Open learner profile">{(profile.displayName || "A").slice(0, 1).toUpperCase()}</button></div></header>
      <div className="page-scroll" key={page}>
        {dataError && user && <div className="data-error" role="alert"><Shield size={15} /> Your account is signed in, but Supabase could not load its private learner data. No demo records are being shown or saved. Refresh the page or try again later.</div>}
        {user && isLoading && !localDemoFallback && <div className="loading-strip"><span className="spinner-dot" /> Loading your private learner workspace…</div>}
        {page === "Overview" ? <MiraiDashboard skills={skills} tasks={tasks} events={events} career={profile.career} displayName={profile.displayName || "Learner"} onNavigate={navigate} onComplete={(id) => void completeTask(id)} /> : page === "AI Orchestrator" ? <AIOrchestrator career={profile.career} skills={skills} tasks={tasks} evidence={evidence} /> : <MiraiModule page={page} skills={skills} evidence={evidence} tasks={tasks} events={events} profile={profile} userEmail={user && !localDemoFallback ? user.email ?? null : null} examMode={examMode} onNavigate={navigate} projectTechPrefill={projectTechPrefill} onProfileChange={setProfile} onSaveProfile={() => void persistProfile(profile)} onRoleChange={changeRole} onAssessSkill={recordAssessment} onAddSkill={(name, status) => void addSkill(name, status)} onSaveProject={saveProject} onTaskComplete={(id) => void completeTask(id)} onTaskMiss={(id) => void markTaskMissed(id)} onRescheduleTask={(id) => void rescheduleTask(id)} onAddEvent={(event) => void addEvent(event)} onExamMode={setExamMode} onReschedule={(hours) => void regeneratePlan(hours)} onSignOut={() => void signOut()} />}
        <footer className="app-footer"><span>© 2026 MIRAI · Learn at your own pace.</span><span><Shield size={12} /> Your learning data is private by default.</span><button onClick={() => navigate("Settings")}>Privacy & settings</button></footer>
      </div>
    </div>
    {notice && <div className="toast-message" role="status"><Check size={15} />{notice}</div>}
  </main>
}
