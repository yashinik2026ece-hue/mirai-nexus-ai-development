"use client"

import { useMemo, useState } from "react"
import { Check, ClipboardCheck, RefreshCw } from "lucide-react"
import type { Skill, SkillStatus } from "@/lib/mirai-data"

export type FormativeResult = {
  score: number
  confidence: number
  correctCount: number
  totalQuestions: number
  status: SkillStatus
  weakConcepts: string[]
}

type Question = { prompt: string; options: string[]; answer: number; concept?: string }
type Props = { skills: Skill[]; onAssess: (skillId: string, result: FormativeResult) => Promise<{ ok: boolean; message: string }> }

const questionBank: Record<string, Question[]> = {
  "javascript": [
    { prompt: "What does `const` prevent?", options: ["Reassignment of the binding", "Changing object properties", "Calling functions", "Using the value in a loop"], answer: 0, concept: "Bindings & const" },
    { prompt: "What does `array.map(fn)` return?", options: ["The first matching item", "A new array of transformed values", "A boolean", "The original array only"], answer: 1, concept: "Array transformations" },
    { prompt: "A closure lets a function…", options: ["Run without being called", "Access variables from its lexical scope", "Change a `const` binding", "Skip asynchronous work"], answer: 1, concept: "Closures & scope" },
    { prompt: "What does `await` do inside an async function?", options: ["Stops the browser", "Waits for a promise to settle before continuing", "Converts any value to a promise rejection", "Creates a new thread"], answer: 1, concept: "Promises & async" },
  ],
  "sql": [
    { prompt: "Which clause filters rows before grouping?", options: ["HAVING", "ORDER BY", "WHERE", "LIMIT"], answer: 2 },
    { prompt: "What does an INNER JOIN return?", options: ["Every row from the left table", "Rows with matching join keys", "Only duplicate rows", "All rows from both tables"], answer: 1 },
    { prompt: "Which expression counts rows?", options: ["SUM(*)", "COUNT(*)", "TOTAL(*)", "ROWS(*)"], answer: 1 },
    { prompt: "Why use a parameterized query?", options: ["To safely bind values and reduce SQL injection risk", "To sort results", "To create an index", "To bypass constraints"], answer: 0 },
  ],
  "html & css": [
    { prompt: "Which element is the main page content landmark?", options: ["<main>", "<span>", "<b>", "<style>"], answer: 0 },
    { prompt: "In the box model, what does `box-sizing: border-box` do?", options: ["Excludes padding from width", "Includes padding and border in the declared size", "Removes the border", "Makes every box a grid"], answer: 1 },
    { prompt: "Which CSS layout is best for aligning items in one dimension?", options: ["Float", "Flexbox", "Position absolute", "Table layout"], answer: 1 },
    { prompt: "What makes a form control accessible?", options: ["A visible label associated with the control", "A placeholder only", "A colorful border", "A tooltip on hover"], answer: 0 },
  ],
  "javascript fundamentals": [
    { prompt: "What does `const` prevent?", options: ["Reassignment of the binding", "Changing object properties", "Calling functions", "Using the value in a loop"], answer: 0 },
    { prompt: "What does `array.map(fn)` return?", options: ["The first matching item", "A new array of transformed values", "A boolean", "The original array only"], answer: 1 },
    { prompt: "A closure lets a function…", options: ["Run without being called", "Access variables from its lexical scope", "Change a `const` binding", "Skip asynchronous work"], answer: 1 },
    { prompt: "What does `await` do inside an async function?", options: ["Stops the browser", "Waits for a promise to settle before continuing", "Converts any value to a promise rejection", "Creates a new thread"], answer: 1 },
  ],
  "react": [
    { prompt: "What is a React component?", options: ["A reusable UI unit", "A database table", "A CSS selector", "A browser event"], answer: 0 },
    { prompt: "When should state be updated?", options: ["By mutating the current state object", "Through the state setter", "Only after a full reload", "Directly in the DOM"], answer: 1 },
    { prompt: "Why should list items have stable keys?", options: ["To help React identify items between renders", "To encrypt the list", "To sort items alphabetically", "To create CSS classes"], answer: 0 },
    { prompt: "What are props for?", options: ["Passing data into a component", "Persisting data to a server", "Replacing HTML semantics", "Starting effects"], answer: 0 },
  ],
  "python": [
    { prompt: "What does a Python dictionary store?", options: ["Key-value pairs", "Only ordered numbers", "Compiled machine code", "Database connections"], answer: 0 },
    { prompt: "What does `range(3)` produce?", options: ["1, 2, 3", "0, 1, 2", "0, 1, 2, 3", "Only the number 3"], answer: 1 },
    { prompt: "What is a `with` statement commonly used for?", options: ["Managing a resource's lifetime", "Defining a class only", "Skipping exceptions", "Creating a loop"], answer: 0 },
    { prompt: "What does `dict.get(key, default)` do when the key is absent?", options: ["Raises KeyError", "Returns the default value", "Deletes the dictionary", "Returns the first key"], answer: 1 },
  ],
}

function getQuestionSet(skillName: string) {
  const normalized = skillName.trim().toLowerCase()
  return questionBank[normalized] ?? (normalized.includes("javascript") ? questionBank.javascript : undefined)
}

export function SkillAssessment({ skills, onAssess }: Props) {
  const assessableSkills = useMemo(() => skills.filter((skill) => getQuestionSet(skill.name)), [skills])
  const [skillId, setSkillId] = useState("")
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState("")
  const selectedSkill = assessableSkills.find((skill) => skill.id === skillId) ?? assessableSkills[0]
  const questions = selectedSkill ? getQuestionSet(selectedSkill.name) ?? [] : []

  const selectSkill = (nextId: string) => { setSkillId(nextId); setAnswers({}); setFeedback("") }
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedSkill || questions.length !== 4 || questions.some((_, index) => answers[index] === undefined)) return
    setBusy(true)
    setFeedback("")
    const correctCount = questions.reduce((count, question, index) => count + (answers[index] === question.answer ? 1 : 0), 0)
    const score = Math.round((correctCount / questions.length) * 100)
    const confidence = Math.round(score * 0.7 + (questions.length / 4) * 30)
    const status: SkillStatus = score >= 75 ? "demonstrated" : score >= 50 ? "developing" : "not_yet_demonstrated"
    const weakConcepts = questions.flatMap((question, index) => answers[index] === question.answer ? [] : [question.concept ?? `Question ${index + 1}`])
    try {
      const result = await onAssess(selectedSkill.id, { score, confidence, correctCount, totalQuestions: questions.length, status, weakConcepts })
      setFeedback(`${result.message}${weakConcepts.length ? ` Focus next on: ${weakConcepts.join(", ")}.` : " No weak concepts identified in this short check."}`)
      if (result.ok) setAnswers({})
    } catch {
      setFeedback("The result could not be saved. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  return <section className="surface-card assessment-card" aria-labelledby="assessment-title">
    <div className="assessment-heading"><div><span className="eyebrow">FORMATIVE · NOT CERTIFICATION</span><h3 id="assessment-title">Check a skill with evidence</h3><p>Four questions make a quick signal; confidence blends accuracy (70%) and check breadth (30%).</p></div><span className="metric-icon cyan"><ClipboardCheck size={17} /></span></div>
    {assessableSkills.length ? <form onSubmit={submit}>
      <label className="assessment-skill-label">Choose a mapped skill<select value={selectedSkill?.id ?? ""} onChange={(event) => selectSkill(event.target.value)}>{assessableSkills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name} · {skill.status.replaceAll("_", " ")}</option>)}</select></label>
      <div className="assessment-questions">{questions.map((question, index) => <fieldset className="assessment-question" key={`${selectedSkill?.id}-${index}`}><legend><span>{String(index + 1).padStart(2, "0")}</span>{question.prompt}</legend><div className="assessment-options">{question.options.map((option, optionIndex) => <label className={answers[index] === optionIndex ? "selected" : ""} key={option}><input type="radio" name={`assessment-${selectedSkill?.id}-${index}`} checked={answers[index] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))} /><span>{option}</span></label>)}</div></fieldset>)}</div>
      <div className="assessment-footer"><span>{Object.keys(answers).length} / {questions.length} answered</span><button className="button button-primary" disabled={busy || Object.keys(answers).length !== questions.length}>{busy ? <><RefreshCw size={14} className="spin" /> Saving evidence…</> : <><Check size={14} /> Submit formative check</>}</button></div>
      {feedback && <p className="assessment-feedback" role="status">{feedback}</p>}
    </form> : <p className="assessment-empty">Checks are available for Python, SQL, JavaScript, React, and HTML &amp; CSS. Add one of these skills to start; other skills stay unassessed until a check is available.</p>}
  </section>
}
