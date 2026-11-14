"use client"

import { ArrowUpRight, BookOpen, CalendarDays, Check, ChevronRight, Clock3, Flame, Sparkles, Target, TrendingUp } from "lucide-react"
import { getMatch, type AcademicEvent, type LearningTask, type Skill } from "@/lib/mirai-data"

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function MiraiDashboard({ skills, tasks, events, career, onNavigate, onComplete, displayName }: {
  skills: Skill[]; tasks: LearningTask[]; events: AcademicEvent[]; career: string; displayName: string
  onNavigate: (page: string) => void; onComplete: (id: string) => void
}) {
  const done = tasks.filter((task) => task.status === "completed").length
  const demonstrated = skills.filter((skill) => skill.status === "demonstrated").length
  const careerMatch = getMatch(career, skills)
  const careerCoverage = careerMatch.score
  const completion = Math.round((done / Math.max(tasks.length, 1)) * 100)
  const nextTask = tasks.find((task) => task.status !== "completed")
  const todayIndex = (new Date().getDay() + 6) % 7
  const weekDates = weekdays.map((_, index) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + index); return date.getDate() })
  return <div className="workspace-content">
    <section className="welcome-row">
      <div><div className="eyebrow"><span className="pulse-dot" /> YOUR LEARNING SPACE</div><h1>Good morning, {displayName.split(" ")[0]}<span className="hello-dot">.</span></h1><p>Your next chapter is closer than you think. Let&apos;s make today count.</p></div>
      <button className="button button-secondary" onClick={() => onNavigate("MIRAI LIFE-SYNC")}><CalendarDays size={16} /> Plan my week</button>
    </section>

    <section className="hero-card">
      <div className="hero-glow" /><div className="hero-copy"><div className="hero-kicker"><Sparkles size={14} /> YOUR CAREER NORTH STAR</div><h2>{career}</h2><p>A clear path forward, built around your strengths and your actual schedule.</p><button className="button button-glass" onClick={() => onNavigate("Skill Gap Analysis")}>Explore your path <ArrowUpRight size={15} /></button></div>
      <div className="readiness-wrap"><div className="readiness-ring" style={{ background: `conic-gradient(#86dfd2 0 ${careerCoverage}%, #ffffff26 ${careerCoverage}% 100%)` }}><div className="ring-inner"><strong>{careerMatch.assessed.length ? careerCoverage : "—"}{careerMatch.assessed.length > 0 && <small>%</small>}</strong><span>weighted coverage</span></div></div><div className="ring-caption"><span className="tiny-dot" /> Unassessed requirements excluded</div></div>
      <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
    </section>

    <section className="metric-grid">
      <article className="metric-card"><div className="metric-top"><span>Skill DNA</span><div className="metric-icon cyan"><Target size={16} /></div></div><div className="metric-value">{skills.length}<span className="metric-total"> skills mapped</span></div><div className="metric-foot"><span className="positive-dot" /> {demonstrated} demonstrated · {skills.filter((s) => s.status === "unassessed").length} unassessed</div></article>
      <article className="metric-card"><div className="metric-top"><span>Roadmap progress</span><div className="metric-icon violet"><TrendingUp size={16} /></div></div><div className="metric-value">{completion}<span className="metric-total">%</span></div><div className="mini-progress"><span style={{ width: `${completion}%` }} /></div><div className="metric-foot">{done} of {tasks.length} this week</div></article>
      <article className="metric-card"><div className="metric-top"><span>Learning rhythm</span><div className="metric-icon amber"><Flame size={16} /></div></div><div className="metric-value">4<span className="metric-total"> day streak</span></div><div className="metric-foot"><span className="accent-text">+1 day</span> from last week</div></article>
    </section>

    <section className="dashboard-grid">
      <article className="surface-card schedule-card">
        <div className="card-heading"><div><div className="eyebrow">LIFE-SYNC · THIS WEEK</div><h3>Your week, in rhythm</h3></div><button className="icon-button" aria-label="Open weekly planner" onClick={() => onNavigate("MIRAI LIFE-SYNC")}><ArrowUpRight size={17} /></button></div>
        <div className="week-strip">{weekdays.map((day, index) => <div className={`week-day ${index === todayIndex ? "today" : ""}`} key={day}><span>{day}</span><b>{weekDates[index]}</b><i className={tasks.some((task) => task.day === index) ? "has-task" : ""} /></div>)}</div>
        <div className="schedule-list">{tasks.slice(0, 3).map((task) => <div className="schedule-item" key={task.id}><span className={`schedule-time-dot ${task.status}`} /> <div className="schedule-main"><strong>{task.title}</strong><span>{task.time} · {task.duration} min · {task.detail}</span></div>{task.status === "completed" ? <Check size={16} className="check-icon" /> : <button className="task-check" onClick={() => onComplete(task.id)} aria-label={`Complete ${task.title}`}><Check size={14} /></button>}</div>)}</div>
        <button className="card-link" onClick={() => onNavigate("MIRAI LIFE-SYNC")}>Open Life-Sync planner <ChevronRight size={15} /></button>
      </article>

      <article className="surface-card next-card"><div className="card-heading"><div><div className="eyebrow">YOUR NEXT STEP</div><h3>Small steps, real momentum</h3></div><div className="metric-icon cyan"><BookOpen size={16} /></div></div><div className="next-step-box"><span className="next-step-num">{String(nextTask ? tasks.indexOf(nextTask) + 1 : 1).padStart(2, "0")}</span><div><strong>{nextTask?.title ?? "Your plan is clear"}</strong><p>{nextTask?.detail ?? "Capture a small learning goal when you are ready to continue."}</p><div className="chip-row"><span className="chip">{nextTask ? `${nextTask.duration} min` : "No open step"}</span><span className="chip chip-priority">{nextTask?.priority === 3 ? "High priority" : "Adaptive step"}</span></div></div></div><button className="button button-primary full-button" onClick={() => onNavigate("Learning Roadmap")}>Open learning roadmap <ArrowUpRight size={15} /></button><div className="ai-note"><Sparkles size={13} /> From your current roadmap · adapt steps using skill evidence</div></article>
    </section>

    <section className="bottom-grid">
      <article className="surface-card skills-card"><div className="card-heading"><div><div className="eyebrow">SKILL DNA</div><h3>Growing with intention</h3></div><button className="text-link" onClick={() => onNavigate("Skill DNA")}>View all <ArrowUpRight size={14} /></button></div><div className="skill-bars">{skills.slice(0, 4).map((skill) => <div className="skill-row" key={skill.id}><div className="skill-label"><span>{skill.name}</span><span className={`status-label ${skill.status}`}>{skill.status === "unassessed" ? "Unassessed" : skill.status === "demonstrated" ? "Demonstrated" : "Developing"}</span></div><div className="skill-track"><span style={{ width: `${skill.level}%` }} /></div></div>)}</div><div className="insight-note"><Sparkles size={14} /><span>Your SQL project is strong evidence. React remains <b>unassessed</b>—not a confirmed gap yet.</span></div></article>
      <article className="surface-card deadlines-card"><div className="card-heading"><div><div className="eyebrow">ON YOUR RADAR</div><h3>Coming up</h3></div><CalendarDays size={17} className="muted-icon" /></div><div className="deadline-list">{events.map((event) => <div className="deadline-row" key={event.id}><span className={`event-icon ${event.type.toLowerCase()}`}><CalendarDays size={15} /></span><div><strong>{event.title}</strong><span>{event.type} · {new Date(`${event.date}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" })}</span></div><ChevronRight size={15} className="muted-icon" /></div>)}</div><button className="card-link" onClick={() => onNavigate("MIRAI LIFE-SYNC")}>Manage commitments <ChevronRight size={15} /></button></article>
    </section>

    <div className="footnote-row"><span><Clock3 size={13} /> Built for the time you actually have.</span><button onClick={() => onNavigate("Settings")}>Privacy & data controls</button></div>
  </div>
}
