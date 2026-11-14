"use client"

import { useMemo, useState } from "react"
import { ArrowRight, Brain, Check, Compass, ListChecks, Sparkles } from "lucide-react"
import { getMatch, type LearningTask, type Skill, type SkillEvidence } from "@/lib/mirai-data"

type Props = { career: string; skills: Skill[]; tasks: LearningTask[]; evidence: SkillEvidence[] }

export function AIOrchestrator({ career, skills, tasks, evidence }: Props) {
  const [running, setRunning] = useState(false)
  const [liveOutput, setLiveOutput] = useState("")
  const [error, setError] = useState("")
  const match = useMemo(() => getMatch(career, skills), [career, skills])
  const demonstrated = skills.filter((skill) => skill.status === "demonstrated").map((skill) => skill.name)
  const nextTask = tasks.find((task) => task.status !== "completed")
  const weakSignals = skills.filter((skill) => skill.status === "developing" || skill.status === "not_yet_demonstrated").map((skill) => skill.name)
  const latestAssessment = evidence.filter((item) => item.sourceType === "assessment").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  let assessmentData: Record<string, unknown> = {}
  try {
    const parsed: unknown = latestAssessment ? JSON.parse(latestAssessment.description) : {}
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) assessmentData = parsed as Record<string, unknown>
  } catch { assessmentData = {} }
  const missedConcepts = Array.isArray(assessmentData.weakConcepts) ? assessmentData.weakConcepts.filter((concept): concept is string => typeof concept === "string") : []
  const assessmentInput = latestAssessment ? `${latestAssessment.title.replace("Formative skill check · ", "")} · ${String(assessmentData.correctCount ?? "?")}/${String(assessmentData.totalQuestions ?? "?")} correct` : "No JavaScript formative result yet"
  const assessmentOutput = latestAssessment ? `${String(assessmentData.score ?? "—")}% formative estimate · ${missedConcepts.length ? `revisit ${missedConcepts.join(", ")}` : "no missed concepts recorded"}` : "Submit the four-question quiz to generate a local score and weak-concept signal; not certification."

  const run = async () => {
    setRunning(true)
    setError("")
    setLiveOutput("")
    try {
      const response = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "mentor",
          message: `Orchestrate a concise next-step recommendation. Summarize this evidence: demonstrated skills: ${demonstrated.join(", ") || "none"}; developing / not-yet-demonstrated skills: ${weakSignals.join(", ") || "none"}; role coverage: ${match.score}% across assessed requirements; next scheduled task: ${nextTask?.title ?? "none"}. Explain which signal matters and one practical next step. Do not claim unassessed skills are gaps.`,
          career,
          skills: skills.map(({ name, status }) => ({ name, status })),
        }),
      })
      const data = await response.json()
      if (!response.ok || typeof data.reply !== "string") throw new Error(data.error || "Live AI is unavailable.")
      setLiveOutput(data.reply)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Live AI is unavailable. The deterministic modules above remain available.")
    } finally {
      setRunning(false)
    }
  }

  return <section className="orchestrator-wrap" aria-labelledby="orchestrator-title">
    <div className="section-heading"><div><div className="eyebrow">COORDINATED LEARNING WORKFLOW</div><h1 id="orchestrator-title">AI Orchestrator</h1><p>Trace how learner evidence flows through MIRAI. Rule-based modules are deterministic; only the mentor step calls live AI.</p></div></div>
    <div className="orchestrator-grid">
      <AgentCard icon={<Brain size={17} />} name="Skill Intelligence" mode="DETERMINISTIC · LOCAL" input={`${skills.length} skill records and evidence labels`} task="Separate demonstrated, developing, and unassessed signals." output={`${demonstrated.length} demonstrated · ${weakSignals.length} developing / not yet demonstrated · ${skills.filter((skill) => skill.status === "unassessed").length} unassessed`} />
      <AgentCard icon={<Compass size={17} />} name="Career Intelligence" mode="WEIGHTED RUBRIC · LOCAL" input={`${career} requirements; unassessed requirements excluded`} task="Calculate weighted coverage from assessed evidence." output={`${match.score}% coverage · ${match.matched.length} demonstrated · ${match.gaps.length} assessed gaps`} />
      <AgentCard icon={<ListChecks size={17} />} name="Learning Architect" mode="RULE-BASED · LOCAL" input={`${tasks.length} roadmap activities and completion statuses`} task="Choose a next milestone within the selected role and available schedule." output={nextTask ? `${nextTask.title} · ${nextTask.duration} min` : "No open milestone"} />
      <AgentCard icon={<Check size={17} />} name="Evaluation" mode="FORMATIVE · LOCAL" input={assessmentInput} task="Score four fixed questions and label missed concepts." output={assessmentOutput} />
    </div>
    <article className="surface-card orchestrator-ai-card"><div className="orchestrator-ai-heading"><div className="metric-icon violet"><Sparkles size={17} /></div><div><span className="eyebrow">LIVE AI · VERCEL AI GATEWAY</span><h3>AI Mentor synthesis</h3></div><button className="button button-primary" type="button" onClick={() => void run()} disabled={running}>{running ? "Coordinating…" : "Run orchestration"}<ArrowRight size={14} /></button></div><div className="orchestrator-ai-io"><div><span>INPUT</span><p>{career} goal · {demonstrated.join(", ") || "no demonstrated skills yet"} · {nextTask?.title ?? "no open task"}</p></div><div><span>TASK</span><p>Explain one evidence-aware next step. Live mode is a single prompt-routed model call, not an autonomous multi-agent swarm.</p></div><div><span>OUTPUT</span><p aria-live="polite">{liveOutput || "Run the workflow to see a labeled live response or demo fallback."}</p></div>{error && <p className="chat-error" role="alert">{error}</p>}</div></article>
    <p className="subtle-text">No API keys are sent to the browser. Guest progress is saved locally; create an account to sync it.</p>
  </section>
}

function AgentCard({ icon, name, mode, input, task, output }: { icon: React.ReactNode; name: string; mode: string; input: string; task: string; output: string }) {
  return <article className="surface-card orchestrator-agent"><div className="orchestrator-agent-top"><span className="metric-icon cyan">{icon}</span><span className="orchestrator-mode">{mode}</span></div><h3>{name}</h3><div className="orchestrator-io"><span>INPUT</span><p>{input}</p><span>TASK</span><p>{task}</p><span>OUTPUT</span><p>{output}</p></div></article>
}
