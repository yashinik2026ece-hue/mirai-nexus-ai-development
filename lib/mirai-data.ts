export type SkillStatus = "demonstrated" | "developing" | "not_yet_demonstrated" | "unassessed"
export type Skill = { id: string; name: string; category: string; level: number; confidence: number; status: SkillStatus; evidence: string }
export type SkillEvidence = { id: string; skillId: string | null; sourceType: string; title: string; description: string; createdAt: string }
export type LearningTask = { id: string; title: string; detail: string; duration: number; day: number; time: string; status: "planned" | "completed" | "missed"; priority: number }
export type AcademicEvent = { id: string; title: string; type: "Exam" | "Assignment" | "Deadline"; date: string }

const quickCheckSkills = new Set(["python", "sql", "html & css", "javascript", "javascript fundamentals", "react"])
export function supportsQuickCheck(name: string) {
  const normalized = name.trim().toLowerCase()
  return quickCheckSkills.has(normalized) || normalized.includes("javascript")
}

export const navigation = [
  { label: "Overview", group: "Workspace" },
  { label: "My Profile", group: "Workspace" },
  { label: "Skill DNA", group: "Intelligence" },
  { label: "Career Discovery", group: "Intelligence" },
  { label: "Career Explorer", group: "Intelligence" },
  { label: "Career Twin", group: "Intelligence" },
  { label: "Skill Gap Analysis", group: "Intelligence" },
  { label: "Learning Roadmap", group: "Learning" },
  { label: "Learning Roadmaps", group: "Learning" },
  { label: "MIRAI LIFE-SYNC", group: "Learning" },
  { label: "Personal AI Tutor", group: "Learning" },
  { label: "Smart Resource Hub", group: "Learning" },
  { label: "Challenge Lab", group: "Practice" },
  { label: "Mission Arena", group: "Practice" },
  { label: "Assessments", group: "Practice" },
  { label: "Misconception Detector", group: "Practice" },
  { label: "ECE Virtual Lab", group: "Practice" },
  { label: "Projects", group: "Practice" },
  { label: "Project Converter", group: "Practice" },
  { label: "Comeback Intelligence", group: "Practice" },
  { label: "Interview Arena", group: "Career prep" },
  { label: "Portfolio Builder", group: "Career prep" },
  { label: "AI Mentor", group: "Career prep" },
  { label: "AI Orchestrator", group: "Career prep" },
  { label: "Progress Analytics", group: "Career prep" },
  { label: "Progress Dashboard", group: "Career prep" },
  { label: "Institution Insights", group: "Career prep" },
  { label: "Settings", group: "Account" },
] as const

export const initialSkills: Skill[] = [
  { id: "s1", name: "Python", category: "Programming", level: 72, confidence: 84, status: "demonstrated", evidence: "Course project · Student records API" },
  { id: "s2", name: "SQL", category: "Data", level: 64, confidence: 78, status: "demonstrated", evidence: "Project evidence · 3 queries reviewed" },
  { id: "s3", name: "HTML & CSS", category: "Frontend", level: 58, confidence: 70, status: "developing", evidence: "Self-reported · awaiting assessment" },
  { id: "s4", name: "JavaScript", category: "Programming", level: 35, confidence: 48, status: "developing", evidence: "Practice quiz · 7/12 correct" },
  { id: "s5", name: "React", category: "Frontend", level: 0, confidence: 0, status: "unassessed", evidence: "Not assessed yet" },
  { id: "s6", name: "Communication", category: "Professional", level: 61, confidence: 55, status: "unassessed", evidence: "Self-reported · not yet verified" },
]

export const initialTasks: LearningTask[] = [
  { id: "t1", title: "JavaScript fundamentals", detail: "Functions & scope · Milestone 2", duration: 30, day: 0, time: "09:30", status: "planned", priority: 3 },
  { id: "t2", title: "DOM manipulation practice", detail: "Build an interactive checklist", duration: 45, day: 1, time: "16:00", status: "planned", priority: 2 },
  { id: "t3", title: "SQL query patterns", detail: "Joins & aggregation refresh", duration: 30, day: 2, time: "10:00", status: "completed", priority: 2 },
  { id: "t4", title: "React component basics", detail: "Prerequisite · JavaScript functions", duration: 45, day: 3, time: "15:30", status: "planned", priority: 2 },
  { id: "t5", title: "Weekly reflection", detail: "Capture one thing you learned", duration: 20, day: 5, time: "11:00", status: "planned", priority: 1 },
]

export const initialEvents: AcademicEvent[] = [
  { id: "e1", title: "Database systems midterm", type: "Exam", date: "2026-11-20" },
  { id: "e2", title: "Team project checkpoint", type: "Assignment", date: "2026-11-24" },
]

export const roles = ["Full Stack Developer", "Frontend Developer", "Backend Developer", "AI Engineer", "Machine Learning Engineer", "Data Analyst", "Data Scientist", "Cybersecurity Analyst", "Cloud Engineer", "UI/UX Designer"]

export const roleSkills: Record<string, string[]> = {
  "Full Stack Developer": ["JavaScript", "React", "Node.js", "SQL", "Git", "HTML & CSS"],
  "Frontend Developer": ["JavaScript", "React", "TypeScript", "HTML & CSS", "Accessibility", "Git"],
  "Backend Developer": ["Node.js", "Python", "SQL", "APIs", "Databases", "Git"],
  "AI Engineer": ["Python", "Machine Learning", "SQL", "APIs", "Statistics", "Git"],
  "Machine Learning Engineer": ["Python", "Machine Learning", "Statistics", "SQL", "Cloud", "Git"],
  "Data Analyst": ["SQL", "Python", "Data visualization", "Statistics", "Spreadsheets", "Communication"],
  "Data Scientist": ["Python", "Statistics", "Machine Learning", "SQL", "Data visualization", "Communication"],
  "Cybersecurity Analyst": ["Networking", "Linux", "Security fundamentals", "Python", "Incident response", "Communication"],
  "Cloud Engineer": ["Linux", "Cloud platforms", "Networking", "Containers", "Python", "Git"],
  "UI/UX Designer": ["User research", "Figma", "Prototyping", "Accessibility", "Visual design", "Communication"],
}

export function buildWeeklySchedule(options: { examMode: boolean; availableHours: number; preferredStart: number; events: AcademicEvent[]; completedIds: string[]; career?: string; skills?: Skill[]; weakConcepts?: string[] }): LearningTask[] {
  const { examMode, availableHours, preferredStart, events, completedIds, career = "Full Stack Developer", skills = [], weakConcepts = [] } = options
  const requirements = roleSkills[career] ?? roleSkills["Full Stack Developer"]
  const targets = requirements.flatMap((name) => {
    const skill = skills.find((item) => item.name.toLowerCase() === name.toLowerCase())
    if (name.toLowerCase() === "javascript" && weakConcepts.length) return [{ title: `Practice JavaScript · ${weakConcepts[0]}`, detail: `Assessment signal: revisit ${weakConcepts.slice(0, 3).join(", ")}. This is a formative recommendation, not certification.`, duration: 30, priority: 3 }]
    if (!skill || skill.status === "unassessed") {
      const supported = supportsQuickCheck(name)
      return [{ title: supported ? `Assess ${name}` : `Gather evidence for ${name}`, detail: supported ? `Take a short formative check for this ${career} requirement; unknown is not a gap.` : `Collect a concrete project example in Project Converter. This requirement stays unassessed until a suitable check is available.`, duration: supported ? 20 : 30, priority: 2 }]
    }
    if (skill.status === "developing" || skill.status === "not_yet_demonstrated") return [{ title: `Practice ${name}`, detail: `Focused practice for ${career}; based on your current ${skill.status.replaceAll("_", " ")} evidence.`, duration: 35, priority: skill.level < 40 ? 3 : 2 }]
    return []
  })
  const candidates = targets.length ? targets : [{ title: "Build a portfolio proof", detail: `Apply your demonstrated skills to a small ${career} project and record what you contributed.`, duration: 40, priority: 2 }]
  const filtered = examMode
    ? candidates.slice(0, 1).map((task) => ({ ...task, priority: 3, duration: Math.min(task.duration, 20), detail: `Exam mode: one light focus block. ${task.detail}` }))
    : candidates.slice(0, 5)
  const weeklyBudget = Math.max(0, availableHours) * 60
  let allocatedMinutes = 0
  const withinBudget = filtered.filter((task) => {
    if (allocatedMinutes + task.duration > weeklyBudget) return false
    allocatedMinutes += task.duration
    return true
  })
  const maxSessions = withinBudget.length
  const now = new Date()
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const todayIndex = (now.getDay() + 6) % 7
  const busyDays = new Set(events.map((event) => {
    const date = new Date(`${event.date}T12:00:00`)
    return Math.floor((date.getTime() - monday.getTime()) / 86_400_000)
  }).filter((day) => day >= 0 && day < 7))
  const availableDays = [0, 1, 2, 3, 4, 5, 6].filter((day) => day >= todayIndex && !busyDays.has(day))
  return withinBudget.slice(0, Math.min(maxSessions, availableDays.length)).map((task, index) => {
    const slug = task.title.toLowerCase().replaceAll(" ", "-")
    const id = `generated-${slug}`
    const hour = availableDays[index] === todayIndex ? Math.max(preferredStart, now.getHours() + 1) : preferredStart + (index % 2)
    return { ...task, id, day: availableDays[index], time: `${String(Math.min(hour, 21)).padStart(2, "0")}:00`, status: completedIds.includes(id) || completedIds.includes(`completed-title-${slug}`) ? "completed" : "planned" }
  })
}

export function getMatch(role: string, skills: Skill[]) {
  const requirements = roleSkills[role] ?? roleSkills["Full Stack Developer"]
  const fullStackWeights: Record<string, number> = { JavaScript: 25, React: 20, "Node.js": 20, SQL: 15, "HTML & CSS": 10, Git: 10 }
  const weightFor = (requirement: string) => role === "Full Stack Developer" ? fullStackWeights[requirement] ?? 0 : 1
  const assessed = requirements.filter((requirement) => skills.some((skill) => skill.name.toLowerCase() === requirement.toLowerCase() && skill.status !== "unassessed"))
  const matched = requirements.filter((requirement) => skills.some((skill) => skill.name.toLowerCase() === requirement.toLowerCase() && skill.status === "demonstrated"))
  const gaps = requirements.filter((requirement) => skills.some((skill) => skill.name.toLowerCase() === requirement.toLowerCase() && (skill.status === "developing" || skill.status === "not_yet_demonstrated")))
  const unassessed = requirements.filter((requirement) => !skills.some((skill) => skill.name.toLowerCase() === requirement.toLowerCase() && skill.status !== "unassessed"))
  const assessedWeight = assessed.reduce((total, requirement) => total + weightFor(requirement), 0)
  const demonstratedWeight = matched.reduce((total, requirement) => total + weightFor(requirement), 0)
  const score = assessedWeight ? Math.round((demonstratedWeight / assessedWeight) * 100) : 0
  return { requirements, matched, assessed, gaps, unassessed, score, weightFor, assessedWeight, demonstratedWeight }
}
