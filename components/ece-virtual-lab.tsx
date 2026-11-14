"use client"

import { useState } from "react"
import { Activity, Zap } from "lucide-react"

export function EceVirtualLab() {
  const [voltage, setVoltage] = useState(9)
  const [resistance, setResistance] = useState(330)
  const [connected, setConnected] = useState(true)
  const [readings, setReadings] = useState<Array<{ voltage: number; resistance: number; current: number; power: number }>>([])
  const current = connected && resistance > 0 ? voltage / resistance : 0
  const power = current * voltage
  const currentMilliAmps = current * 1000
  const isSafe = !connected || currentMilliAmps <= 30

  const recordMeasurement = () => {
    if (!connected) return
    setReadings((items) => [{ voltage, resistance, current: currentMilliAmps, power: power * 1000 }, ...items].slice(0, 5))
  }

  return <div className="workspace-content module-content">
    <SectionHeading />
    <div className="module-grid">
      <article className="surface-card form-card">
        <div className="eyebrow">SERIES DC CIRCUIT</div>
        <p>Adjust the source and load to explore Ohm&apos;s law. This ideal simulator estimates current and resistor power; real hardware has tolerances and safety limits.</p>
        <label>Supply voltage <strong>{voltage.toFixed(1)} V</strong><input type="range" min="0" max="24" step="0.5" value={voltage} onChange={(event) => setVoltage(Number(event.target.value))} /></label>
        <label>Load resistance <strong>{resistance} Ω</strong><input type="range" min="10" max="1000" step="10" value={resistance} onChange={(event) => setResistance(Number(event.target.value))} /></label>
        <label className="portfolio-control"><span><strong>Connect circuit</strong><small>{connected ? "Closed circuit" : "Open circuit"}</small></span><input type="checkbox" checked={connected} onChange={(event) => setConnected(event.target.checked)} aria-label="Connect circuit" /></label>
        <button className="button button-primary" type="button" disabled={!connected} onClick={recordMeasurement}><Activity size={15} /> Record measurement</button>
      </article>
      <article className="surface-card analytics-insight">
        <div className="metric-icon cyan"><Zap size={17} /></div><div className="eyebrow">LIVE MEASUREMENT</div>
        <h3>{isSafe ? "Circuit model" : "Current exceeds the learning limit"}</h3>
        <p>Use Ohm&apos;s law: divide voltage by resistance to estimate current. Power is source voltage multiplied by current.</p>
        <div className="stats-row">
          <div className="surface-card mini-stat"><span className="eyebrow">CURRENT</span><strong>{currentMilliAmps.toFixed(2)} mA</strong></div>
          <div className="surface-card mini-stat"><span className="eyebrow">LOAD POWER</span><strong>{(power * 1000).toFixed(2)} mW</strong></div>
        </div>
        <p role="status">{!connected ? "The switch is open; no current flows." : isSafe ? "Within the simulator&apos;s 30 mA learning limit." : "Reduce voltage or increase resistance before recording."}</p>
        <h3>Recent measurements</h3>
        {readings.length ? <ul>{readings.map((reading, index) => <li key={`${reading.voltage}-${reading.resistance}-${index}`}>{reading.voltage.toFixed(1)} V · {reading.resistance} Ω · {reading.current.toFixed(2)} mA · {(reading.power).toFixed(2)} mW</li>)}</ul> : <p>No readings recorded yet.</p>}
      </article>
    </div>
  </div>
}

function SectionHeading() {
  return <div className="section-heading"><div><div className="eyebrow">HANDS-ON CIRCUIT PRACTICE</div><h1>ECE Virtual Lab</h1><p>Experiment safely with a responsive DC circuit model—no login or hardware required.</p></div></div>
}
