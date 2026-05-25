"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { Show } from "@clerk/nextjs"
import BorderGlow from "@/components/BorderGlow"
import PixelCard from "@/components/PixelCard"
import "./landing.css"

/* ---- Logo SVG ---- */
const LOGO_SVG = (
  <svg viewBox="0 0 230 280" aria-hidden="true">
    <path
      d="M 229.437 170.917 L 133.457 266.882 L 57.35 190.806 L 52.807 186.254 L 0 133.45 L 113.557 19.881 L 133.457 0 L 153.348 19.881 L 161.096 27.647 L 173.239 39.78 L 152.187 60.821 L 133.457 42.093 L 115.87 59.669 L 42.086 133.45 L 133.457 224.808 L 208.394 149.866 L 229.437 170.917 Z"
      fill="#F9B314"
    />
    <path
      d="M 100 142 L 122 164 L 178 100"
      stroke="#0C0404"
      strokeWidth="14"
      strokeLinecap="square"
      fill="none"
    />
  </svg>
)

/* ---- Root page ---- */
export default function LandingPage() {
  /* Scroll reveal observer — attaches once on mount */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    )
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="lp">
      <div className="lp-frame" />
      <SiteHeader />
      <main>
        <HeroSection />
        <BentoSection />
        <ExtensionSection />
        <PricingSection />
        <FaqSection />
      </main>
      <SiteFooter />
    </div>
  )
}

/* ---- Header with scroll shadow ---- */
function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className={`lp-header${scrolled ? " scrolled" : ""}`}>
      <div className="lp-wrap">
        <div className="lp-nav">
          <a className="lp-brand" href="#">
            <span className="lp-mark">{LOGO_SVG}</span>
            <span>Lock<span className="light">In</span></span>
          </a>

          <div className="lp-nav-links">
            <a href="#product">Product</a>
            <a href="#extension">Extension</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a href="#">Manifesto</a>
          </div>

          <div className="lp-nav-cta">
            <Show when="signed-out">
              <Link className="lp-btn ghost" href="/app/sign-in">Sign In</Link>
              <Link className="lp-btn ink" href="/app/sign-up">Get Started</Link>
            </Show>
            <Show when="signed-in">
              <Link className="lp-btn ink" href="/app">Go to app</Link>
            </Show>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ---- Live countdown timer ---- */
function LiveTimer({ initialSeconds = 768 }: { initialSeconds?: number }) {
  const [secs, setSecs] = useState(initialSeconds)
  const [tick, setTick] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setSecs((s) => (s > 0 ? s - 1 : 0))
      setTick(true)
      setTimeout(() => setTick(false), 300)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const m = String(Math.floor(secs / 60)).padStart(2, "0")
  const s = String(secs % 60).padStart(2, "0")
  return <span className={`lp-countdown${tick ? " tick" : ""}`}>{m}:{s}</span>
}

/* ---- Hero section ---- */
function HeroSection() {
  const heroRef = useRef<HTMLElement>(null)

  /* Trigger entrance animation after first paint */
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      heroRef.current?.classList.add("lp-hero-ready")
    })
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <section className="lp-hero lp-section" ref={heroRef}>
      <div className="lp-wrap">
        <span className="lp-sparkle" style={{ top: 110, left: "56%", width: 36, height: 36 }} />
        <span className="lp-sparkle gray" style={{ top: 160, left: "62%", width: 20, height: 20 }} />
        <span className="lp-sparkle gray" style={{ top: 240, left: "58%", width: 14, height: 14 }} />
        <span className="lp-sparkle" style={{ top: 320, left: "72%", width: 22, height: 22 }} />

        <span className="lp-eyebrow">
          <span className="pulse" />
          LockIn · v1.0
        </span>

        <h1 className="lp-headline">
          <span className="w" style={{ "--i": 0 } as React.CSSProperties}><span className="light">Own</span></span>{" "}
          <span className="w" style={{ "--i": 1 } as React.CSSProperties}>your</span>{" "}
          <span className="w" style={{ "--i": 2 } as React.CSSProperties}>time,</span><br />
          <span className="w" style={{ "--i": 3 } as React.CSSProperties}>build</span>{" "}
          <span className="w" style={{ "--i": 4 } as React.CSSProperties}>your</span>{" "}
          <span className="w" style={{ "--i": 5 } as React.CSSProperties}><span className="accent">life</span></span>
        </h1>

        <p className="sub">
          LockIn breaks down what you actually need to do, walks you through a focus sprint,
          and blocks the tabs that drag you out of it. An AI-powered execution workspace — not another to-do list.
        </p>

        <div className="cta-row">
          <Show when="signed-out">
            <Link className="lp-btn ink lg" href="/app/sign-up">
              Get Started <span className="arr">→</span>
            </Link>
          </Show>
          <Show when="signed-in">
            <Link className="lp-btn ink lg" href="/app">
              Go to app <span className="arr">→</span>
            </Link>
          </Show>
          <a className="lp-btn lg" href="#extension">Watch demo <span className="arr">▸</span></a>
          <span className="running">
            <span className="dot" />
            2,481 sprints running right now
          </span>
        </div>

        <div className="lp-hero-panel">
          <div className="left">
            <div className="label">⌑ TODAY · TUE 24</div>
            <h3>Three things matter today.<br />The rest can wait.</h3>
            <div className="lp-hero-tasks">
              <div className="lp-htask active">
                <span className="chk" />
                <span className="name">Draft thesis chapter 3 — intro</span>
                <span className="pill">In sprint</span>
                <span className="meta"><LiveTimer initialSeconds={768} /></span>
              </div>
              <div className="lp-htask">
                <span className="chk" />
                <span className="name">Review portfolio site copy</span>
                <span className="meta">25m</span>
              </div>
              <div className="lp-htask">
                <span className="chk" />
                <span className="name">Refactor /auth handler</span>
                <span className="meta">45m</span>
              </div>
              <div className="lp-htask done">
                <span className="chk" />
                <span className="name">Morning standup notes</span>
              </div>
            </div>
          </div>
          <div className="right">
            <div className="lp-sprint-mock">
              <div className="live">SPRINT #142 · LOCKED IN</div>
              <div className="timer"><LiveTimer initialSeconds={768} /></div>
              <div className="task-name">Draft thesis chapter 3 — intro</div>
              <div className="steps">
                <div className="step done"><span className="b" /> Outline 3 main claims</div>
                <div className="step done"><span className="b" /> Draft hook paragraph</div>
                <div className="step now"><span className="b" /> Write thesis statement</div>
                <div className="step"><span className="b" /> Bridge to chapter 4</div>
              </div>
              <div className="footer">
                <button>+5 min</button>
                <button>Pause</button>
                <button className="primary">End sprint ✓</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---- Sprint Mode demo card (hover to start timer) ---- */
function SprintDemoCard() {
  const [hovered, setHovered] = useState(false)
  const [secs, setSecs] = useState(1500)
  const [revealed, setRevealed] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setRevealed(true)
          obs.disconnect()
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!hovered) {
      const reset = setTimeout(() => setSecs(1500), 500)
      return () => clearTimeout(reset)
    }
    const tick = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(tick)
  }, [hovered])

  const m = String(Math.floor(secs / 60)).padStart(2, "0")
  const s = String(secs % 60).padStart(2, "0")

  return (
    <div
      ref={cardRef}
      className={`lp-card lp-sprint-card col-2${hovered ? " sprint-active" : ""}${revealed ? " revealed" : ""}`}
      data-reveal
      data-hint="↑ hover"
      style={{ "--rd": "80ms", textAlign: "center" } as React.CSSProperties}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="body" style={{ textAlign: "center" }}>
        <div className="lp-card-label">02 · SPRINT MODE</div>
        <h3>Focus that<br /><span className="light">feels like focus.</span></h3>
        <p style={{ margin: "0 auto" }}>Sprint Mode dims everything else and shows only the work in front of you.</p>
        <div style={{ marginTop: "auto" }}>
          <div className="lp-sprint-timer-big">{m}:{s}</div>
          <div className="lp-sprint-status">
            {hovered ? "● Sprint in progress" : "● Ready to begin"}
          </div>
          <div className="lp-sprint-task-slide">Draft thesis chapter 3 — intro</div>
        </div>
      </div>
    </div>
  )
}

/* ---- AI Breakdown mock with typewriter + sequential reveal ---- */
const BREAKDOWN_QUERY = "“Study for the algorithms midterm on Friday”"

function BreakdownMock() {
  const mockRef = useRef<HTMLDivElement>(null)
  const [typed, setTyped] = useState("")
  const [cursorVisible, setCursorVisible] = useState(false)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const el = mockRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        obs.disconnect()
        setCursorVisible(true)
        let i = 0
        const typeId = setInterval(() => {
          i++
          setTyped(BREAKDOWN_QUERY.slice(0, i))
          if (i >= BREAKDOWN_QUERY.length) {
            clearInterval(typeId)
            setTimeout(() => setPhase(1), 420)
            setTimeout(() => setPhase(2), 870)
            setTimeout(() => {
              setPhase(3)
              setCursorVisible(false)
            }, 1270)
          }
        }, 26)
      },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div className={`lp-breakdown-mock bd-phase-${phase}`} ref={mockRef}>
      <div className="uq lp-uq-typing">
        {typed || <span className="lp-uq-placeholder">Drop a task here…</span>}
        {cursorVisible && <span className="lp-type-cursor" />}
      </div>
      <div className="ai">
        <span className="av" />
        <div className="ai-bubble">Here&apos;s a 4-step plan — about <b>1h 35m</b>. Want me to break the first step down further?</div>
      </div>
      <div className="steps">
        <div className="step"><span className="grip" /><span className="cb" /><span className="nm">Re-do problem sets 4 + 5</span><span className="dur">35m</span></div>
        <div className="step"><span className="grip" /><span className="cb" /><span className="nm">Make 1-page Big-O cheat sheet</span><span className="dur">20m</span></div>
        <div className="step"><span className="grip" /><span className="cb" /><span className="nm">Review BFS / DFS notes</span><span className="dur">25m</span></div>
        <div className="step"><span className="grip" /><span className="cb" /><span className="nm">One timed practice exam</span><span className="dur">15m</span></div>
      </div>
      <div className="row-actions">
        <button className="b primary">Start sprint ✓</button>
        <button className="b">Make smaller</button>
        <button className="b">Edit</button>
      </div>
    </div>
  )
}

/* ---- HUD demo card (dimmed until hover) ---- */
function HudDemoCard() {
  return (
    <div className="lp-card col-2 lp-hud-demo-card" data-reveal data-hint="↑ hover" style={{ "--rd": "160ms" } as React.CSSProperties}>
      <div className="body">
        <div className="lp-card-label">03 · CROSS-TAB</div>
        <h3>Same account.<br /><span className="light">Every tab.</span></h3>
        <p>Web app and browser extension share one live sprint state. Start anywhere — see it everywhere.</p>
        <div style={{ display: "flex", justifyContent: "center", marginTop: "auto", paddingTop: 24 }}>
          <div className="lp-hud">
            <span className="live" />
            <span className="t">12:48</span>
            <span className="nm">· chapter 3 intro</span>
            <span className="ring" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- Distraction shield demo card (BLOCKED on hover) ---- */
function DistractionCard() {
  return (
    <div className="lp-card col-2" data-reveal data-hint="↑ hover" style={{ "--rd": "80ms" } as React.CSSProperties}>
      <div className="body">
        <div className="lp-card-label">BLOCKLIST</div>
        <h3>Your rules,<br /><span className="light">your sites.</span></h3>
        <p>Pick categories or specific domains. Adjust hard / soft per site, save as presets.</p>
        <div className="lp-distraction-tabs">
          <div className="lp-dt-tab">
            <span className="lp-dt-fav" style={{ background: "#000" }}>𝕏</span>
            <span className="lp-dt-nm">x.com</span>
            <span className="lp-dt-badge hard">Hard</span>
            <span className="lp-dt-blocked">BLOCKED</span>
          </div>
          <div className="lp-dt-tab">
            <span className="lp-dt-fav" style={{ background: "#FF0000" }}>▶</span>
            <span className="lp-dt-nm">youtube.com</span>
            <span className="lp-dt-badge hard">Hard</span>
            <span className="lp-dt-blocked">BLOCKED</span>
          </div>
          <div className="lp-dt-tab">
            <span className="lp-dt-fav" style={{ background: "#FF4500" }}>r</span>
            <span className="lp-dt-nm">reddit.com</span>
            <span className="lp-dt-badge soft">Soft</span>
            <span className="lp-dt-blocked">BLOCKED</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- Bento / product section ---- */
function BentoSection() {
  return (
    <section className="lp-bento lp-section" id="product">
      <div className="lp-wrap">
        <div className="lp-section-head" data-reveal>
          <span className="lp-eyebrow-pill">The execution gap</span>
          <h2><span className="light">Stop drowning in to-dos.</span><br />Start finishing them.</h2>
          <p>Most apps store your work. LockIn helps you actually start, focus, and finish it — by breaking it down, defending your attention, and following you across every tab.</p>
        </div>

        <div className="lp-bento-grid">
          <div className="lp-card col-4 row-2" data-reveal style={{ "--rd": "0ms" } as React.CSSProperties}>
            <div className="body">
              <div className="lp-card-label">01 · AI BREAKDOWN</div>
              <h3>Vague tasks become<br /><span className="light">actionable steps.</span></h3>
              <p>Drop in &ldquo;Clean the apartment&rdquo; or &ldquo;Study for the algorithms midterm.&rdquo; Our AI breaks it into steps with realistic durations — drag, edit, or override anything.</p>
              <BreakdownMock />
            </div>
          </div>

          <SprintDemoCard />

          <HudDemoCard />

          <div className="lp-card col-3 with-gradient bl" data-reveal style={{ "--rd": "0ms" } as React.CSSProperties}>
            <div className="body">
              <div className="lp-card-label" style={{ color: "rgba(255,255,255,0.8)" }}>04 · DISTRACTION SHIELD</div>
              <h3 style={{ color: "#fff", marginTop: "auto" }}>Distractions,<br /><span className="light">locked.</span></h3>
              <p style={{ color: "rgba(255,255,255,0.85)" }}>Hard-block what pulls you in. Soft-nudge the grey zone. Your call, your sites.</p>
            </div>
          </div>

          <PixelCard
            variant="default"
            colors="#0c0404,#1a1014,#2a1820,#F9B314,#FFC22E"
            gap={6}
            speed={40}
            className="lp-card lp-pixel-bento col-3"
            data-reveal
            style={{ "--rd": "100ms" } as React.CSSProperties}
          >
            <div className="lp-block-mock lp-pixel-content">
              <span className="tld">HARD-BLOCKED · sprint in progress</span>
              <h4>Still <em>locked in</em>.</h4>
              <p>Twitter is on pause until your sprint wraps. Come back when the timer&apos;s up — it&apos;ll still be there.</p>
              <div className="receipt">
                <div className="r"><span className="l">Working on</span><span className="v">Chapter 3 intro</span></div>
                <div className="r"><span className="l">Sprint length</span><span className="v">25 min</span></div>
                <div className="r t"><span className="l">Time left</span><span className="v">12:48</span></div>
              </div>
            </div>
          </PixelCard>
        </div>
      </div>
    </section>
  )
}

/* ---- Heatmap with stagger reveal ---- */
function Heatmap() {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.classList.add("heat-revealed")
          obs.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const levels = [
    .2,.5,.1,.3,.7,.4,.2,.6,.9,.5,.4,.2,.3,
    .3,.4,.6,.8,1,.7,.3,.5,.8,.6,.5,.3,.2,
    .1,.2,.4,.5,.8,.5,.2,.4,.7,.4,.3,.2,.1,
    .05,.1,.2,.4,.5,.3,.1,.3,.5,.3,.2,.1,.05,
  ]

  return (
    <div className="lp-heat-grid" ref={gridRef}>
      {levels.map((lvl, i) => (
        <span
          key={i}
          className="c"
          style={{ "--lvl": lvl, "--hd": `${i * 18}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

/* ---- Extension section ---- */
function ExtensionSection() {
  return (
    <section className="lp-bento lp-section" id="extension" style={{ paddingTop: 0 }}>
      <div className="lp-wrap">
        <div className="lp-section-head" data-reveal>
          <span className="lp-eyebrow-pill">Browser extension</span>
          <h2><span className="light">Focus shouldn't end</span><br />when you close the tab.</h2>
          <p>The LockIn extension is a thin client of your account. Start a sprint anywhere, see status on every page, and get redirected gently when you slip.</p>
        </div>

        <div className="lp-bento-grid">
          <div className="lp-card fog col-3" data-reveal style={{ "--rd": "0ms", padding: 40 } as React.CSSProperties}>
            <div className="body" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 32, alignItems: "center" }}>
              <div>
                <div className="lp-card-label">TOOLBAR POPUP</div>
                <h3>One-click popup,<br /><span className="light">same live state.</span></h3>
                <p style={{ marginTop: 12 }}>The toolbar popup shows your current sprint, the step you're on, and how many distractions LockIn already absorbed for you.</p>
              </div>
              <div className="lp-ext-popup">
                <div className="head">
                  <span className="live">SPRINT</span>
                  <span>0:12:48 LEFT</span>
                </div>
                <div className="task-name">Chapter 3 intro</div>
                <div className="timer">12:48</div>
                <div className="progress" />
                <div className="step done"><span className="b" />Outline 3 main claims</div>
                <div className="step done"><span className="b" />Draft hook paragraph</div>
                <div className="step now"><span className="b" />Write thesis statement</div>
                <div className="step"><span className="b" />Bridge to chapter 4</div>
                <div className="footer">
                  <button>+5m</button>
                  <button>Pause</button>
                  <button>End</button>
                </div>
              </div>
            </div>
          </div>

          <div className="lp-card col-3" data-reveal style={{ "--rd": "100ms", padding: 40 } as React.CSSProperties}>
            <div className="body">
              <div className="lp-card-label">PAIRING</div>
              <h3>Install once,<br /><span className="light">signed in everywhere.</span></h3>
              <p>No second password. The extension pairs with your web account in two taps — and never asks for credentials again.</p>
              <div style={{ marginTop: "auto", paddingTop: 24 }}>
                <div style={{ background: "var(--yellow-50)", border: "1px solid var(--yellow-soft)", borderRadius: 12, padding: 22, textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-ibm-mono)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Confirm pairing code</div>
                  <div style={{ fontFamily: "var(--font-funnel)", fontWeight: 300, fontSize: 56, letterSpacing: "-0.04em", color: "var(--ink)", margin: "12px 0 8px", fontFeatureSettings: "'tnum' 1" }}>BR8 — 9KF</div>
                  <div style={{ fontFamily: "var(--font-ibm-mono)", fontSize: 11, color: "var(--muted)" }}>expires in 2:31</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lp-card col-2" data-reveal style={{ "--rd": "0ms" } as React.CSSProperties}>
            <div className="body">
              <div className="lp-card-label">AMBIENT HUD</div>
              <h3>Always<br /><span className="light">in your eyeline.</span></h3>
              <p>A draggable pill on every page so the timer never disappears into a forgotten tab.</p>
              <div style={{ marginTop: "auto", paddingTop: 24, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
                <div className="lp-hud"><span className="live" /><span className="t">12:48</span><span className="ring" /></div>
                <div className="lp-hud"><span className="live" /><span className="t">12:48</span><span className="nm">· chapter 3 intro</span></div>
              </div>
            </div>
          </div>

          <DistractionCard />

          <div className="lp-card col-2" data-reveal style={{ "--rd": "160ms" } as React.CSSProperties}>
            <div className="body">
              <div className="lp-card-label">SLIP DETECTION</div>
              <h3>Nudge,<br /><span className="light">not shame.</span></h3>
              <p>If you drift to a soft-listed site, LockIn shows the cost — never wags a finger.</p>
              <div style={{ marginTop: "auto", paddingTop: 16, background: "var(--fog)", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: "-0.01em" }}>Stay on reddit.com?</div>
                <div style={{ color: "var(--cool)", fontSize: 12.5, marginTop: 4, letterSpacing: "-0.01em" }}>5 more min costs you <b style={{ color: "var(--ink)" }}>~1 step</b> from this sprint.</div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button className="lp-btn yellow" style={{ height: 32, fontSize: 12, flex: 1, padding: "0 10px" }}>← back to work</button>
                  <button className="lp-btn" style={{ height: 32, fontSize: 12, padding: "0 10px" }}>5 min</button>
                </div>
              </div>
            </div>
          </div>

          <div className="lp-card col-3 with-gradient tl" data-reveal style={{ "--rd": "0ms", minHeight: 320 } as React.CSSProperties}>
            <div className="body">
              <div className="lp-card-label" style={{ color: "rgba(255,255,255,0.85)" }}>PATTERNS</div>
              <h3 style={{ color: "#fff" }}>You ship more<br /><span className="light">after 10am.</span></h3>
              <p style={{ color: "rgba(255,255,255,0.85)" }}>LockIn quietly learns your rhythms — when you focus best, when you slip, what task sizes you finish.</p>
            </div>
          </div>

          <div className="lp-card col-3" data-reveal style={{ "--rd": "100ms" } as React.CSSProperties}>
            <div className="body">
              <div className="lp-card-label">12-WEEK FOCUS HEATMAP</div>
              <h3>Patterns<br /><span className="light">that show up.</span></h3>
              <Heatmap />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontFamily: "var(--font-ibm-mono)", fontSize: 11, color: "var(--muted)" }}>
                <span>12 weeks ago</span>
                <span>today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---- Pricing section ---- */
function PricingSection() {
  const [annual, setAnnual] = useState(true)
  const [tiersRevealed, setTiersRevealed] = useState(false)
  const monthlyRef = useRef<HTMLButtonElement>(null)
  const annualRef = useRef<HTMLButtonElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const tierRowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = tierRowRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setTiersRevealed(true)
          obs.disconnect()
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const positionPill = (noAnim: boolean) => {
    const btn = annual ? annualRef.current : monthlyRef.current
    const pill = pillRef.current
    if (!btn || !pill) return
    if (noAnim) {
      pill.classList.add("no-anim")
    }
    pill.style.left = `${btn.offsetLeft}px`
    pill.style.width = `${btn.offsetWidth}px`
    if (noAnim) {
      requestAnimationFrame(() => pill.classList.remove("no-anim"))
    }
  }

  useEffect(() => { positionPill(true) }, [])
  useEffect(() => { positionPill(false) }, [annual])

  return (
    <section className="lp-pricing lp-section" id="pricing">
      <div className="lp-wrap">
        <div className="lp-section-head" data-reveal>
          <span className="lp-eyebrow-pill">Pricing</span>
          <h2><span className="light">Simple pricing.</span><br />Lock in when ready.</h2>
          <p>Start free. Upgrade for hard-blocking, longer sprints, and the team workspace.</p>
          <div className="lp-billing-toggle">
            <span ref={pillRef} className="lp-bt-pill" />
            <button ref={monthlyRef} className={!annual ? "active" : ""} onClick={() => setAnnual(false)}>Monthly</button>
            <button ref={annualRef} className={annual ? "active" : ""} onClick={() => setAnnual(true)}>
              Annually <span className="save">−20%</span>
            </button>
          </div>
        </div>

        <div className="lp-tier-row" ref={tierRowRef}>
          {[
            {
              delay: "0ms",
              name: "Free",
              desc: "Everything you need to try LockIn properly.",
              price: "$0",
              per: "/forever",
              billed: "no credit card",
              features: [
                "Unlimited tasks & projects",
                "20 AI breakdowns per month",
                "Sprint sessions up to 25 min",
                <><b>Soft</b> distraction reminders</>,
                "Browser extension (1 device)",
                "Personal workspace",
              ],
              cta: { label: "Start free", href: "/app/sign-up", style: {} },
            },
            {
              delay: "100ms",
              name: "Pro",
              featured: true,
              tag: "Most popular",
              desc: "For people who already know they procrastinate and want to actually stop.",
              price: annual ? "$9" : "$11",
              per: annual ? "/ mo, billed annually" : "/ mo",
              billed: annual ? "$11 billed monthly" : "billed monthly",
              features: [
                "Everything in Free",
                "Unlimited AI breakdowns",
                <><b>Hard</b> site blocking + slip detection</>,
                "Sprints up to 4 hours",
                "Ambient HUD across all tabs",
                "Cross-device sync (ext + mobile)",
                "Pattern analytics & daily digest",
                "Calendar & timeline view",
              ],
              cta: { label: <>Choose Pro <span className="arr">→</span></>, href: "/app/sign-up", className: "yellow" },
            },
            {
              delay: "200ms",
              name: "Team",
              desc: "Shared focus for small product, eng, & research teams.",
              price: "$19",
              per: "/ seat, annually",
              billed: "5-seat minimum",
              features: [
                "Everything in Pro",
                "Shared projects & sprints",
                "Team blocklist templates",
                "Admin controls & SSO",
                "Usage analytics dashboard",
                "Priority support",
              ],
              cta: { label: <>Talk to us <span className="arr">→</span></>, href: "mailto:hi@lockin.app" },
            },
          ].map((tier) => {
            if (tier.featured) {
              return (
                <BorderGlow
                  key={tier.name}
                  className={`lp-tier-pro${tiersRevealed ? " revealed" : ""}`}
                  data-reveal="scale"
                  style={{ "--rd": tier.delay } as React.CSSProperties}
                  backgroundColor="#FDFDFD"
                  glowColor="44 95 53"
                  colors={["#F9B314", "#FFC22E", "#FFE9AA"]}
                  borderRadius={18}
                  glowRadius={36}
                  glowIntensity={1.4}
                  coneSpread={22}
                  fillOpacity={0}
                  continuous
                  continuousSpeed={0.35}
                >
                  <div className="lp-tier-pro-inner">
                    {tier.tag && <div className="lp-tier-tag">{tier.tag}</div>}
                    <div className="lp-tier-name">{tier.name}</div>
                    <div className="lp-tier-desc">{tier.desc}</div>
                    <div className="lp-price-row">
                      <span key={tier.price} className="lp-price-amt lp-price-flip">{tier.price}</span>
                      <span className="lp-price-per">{tier.per}</span>
                    </div>
                    <div className="lp-billed">{tier.billed}</div>
                    <ul className="lp-features">
                      {tier.features.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                    <Link
                      className="lp-btn yellow"
                      href={tier.cta.href}
                      style={{ marginTop: "auto", width: "100%", justifyContent: "center" }}
                    >
                      {tier.cta.label}
                    </Link>
                  </div>
                </BorderGlow>
              )
            }
            return (
              <div
                key={tier.name}
                className={`lp-tier${tiersRevealed ? " revealed" : ""}`}
                data-reveal="scale"
                style={{ "--rd": tier.delay } as React.CSSProperties}
              >
                <div className="lp-tier-name">{tier.name}</div>
                <div className="lp-tier-desc">{tier.desc}</div>
                <div className="lp-price-row">
                  <span className="lp-price-amt">{tier.price}</span>
                  <span className="lp-price-per">{tier.per}</span>
                </div>
                <div className="lp-billed">{tier.billed}</div>
                <ul className="lp-features">
                  {tier.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
                <Link
                  className={`lp-btn${tier.cta.className ? " " + tier.cta.className : ""}`}
                  href={tier.cta.href}
                  style={{ marginTop: "auto", width: "100%", justifyContent: "center" }}
                >
                  {tier.cta.label}
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---- FAQ accordion item ---- */
function FaqItem({ question, answer, defaultOpen = false }: { question: string; answer: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [revealed, setRevealed] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = itemRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setRevealed(true)
          obs.disconnect()
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={itemRef} className={`lp-faq-item${open ? " open" : ""}${revealed ? " revealed" : ""}`} data-reveal style={{ "--rd": "0ms" } as React.CSSProperties}>
      <div className="lp-faq-summary" onClick={() => setOpen(!open)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpen(!open)}>
        {question}
        <span className="lp-faq-icon" />
      </div>
      <div className="lp-faq-body">
        <div>{answer}</div>
      </div>
    </div>
  )
}

function FaqSection() {
  return (
    <section className="lp-faq lp-section" id="faq">
      <div className="lp-wrap lp-faq-wrap">
        <h2 data-reveal><span className="light">Frequently</span> asked.</h2>
        <p className="sub" data-reveal style={{ "--rd": "80ms" } as React.CSSProperties}>
          Anything else? Email <a href="mailto:hi@lockin.app">hi@lockin.app</a> and we'll write back fast.
        </p>

        <FaqItem defaultOpen question="What does LockIn actually do that a regular to-do app doesn't?" answer={<>LockIn isn't built to <i>store</i> tasks — it's built to help you <i>execute</i> them. The AI breaks vague work into actionable steps, Sprint Mode walks you through them in a focused timer, and the browser extension blocks distractions while you do it. Most apps stop after the list view; we start there.</>} />
        <FaqItem question="How is the extension different from Cold Turkey or Freedom?" answer={<>Those are pure blockers. LockIn&apos;s extension is connected to your tasks — when you start a sprint on &ldquo;Draft chapter 3,&rdquo; it knows which sites to block, for how long, and shows your sub-steps in the popup. Configuration lives in the web app, not in a tiny extension settings page.</>} />
        <FaqItem question="Do I have to use the AI for everything?" answer="No. LockIn works fully manually — ignore AI suggestions, write your own steps, set your own durations. The AI is assistive, not authoritative." />
        <FaqItem question="What about privacy? Does LockIn track every site I visit?" answer={<>The extension only tracks navigation to sites on your <i>own</i> blocklist, and only during an active sprint. Off-sprint browsing is invisible to us. AI history is off by default and never pushed to the extension. You can wipe analytics data anytime.</>} />
        <FaqItem question="Which browsers are supported?" answer="Chrome, Edge, Brave, and Arc today. Firefox is in beta. Safari is on the roadmap once Apple finishes the Web Extensions API we need." />
        <FaqItem question="Can I try Pro before paying?" answer="Yes. 14-day Pro trial when you sign up — no credit card required. You'll drop back to Free if you don't upgrade." />
        <FaqItem question="Is there a mobile app?" answer="iOS and Android apps are in private beta. They mirror live sprint state from the web app so you can pause from your phone or just glance at the timer." />
      </div>
    </section>
  )
}

/* ---- Big CTA section ---- */
/* ---- Footer ---- */
function SiteFooter() {
  return (
    <footer className="lp-footer" data-reveal>
      <div className="lp-wrap">
        <div className="lp-foot-grid">
          <div>
            <a className="lp-brand" href="#">
              <span className="lp-mark">{LOGO_SVG}</span>
              <span>Lock<span className="light">In</span></span>
            </a>
            <p className="lp-foot-tagline">Own your time, build your life. AI-powered execution workspace.</p>
            <div style={{ display: "flex", gap: 6 }}>
              <a className="lp-btn" style={{ height: 34, padding: "0 14px", fontSize: 13 }} href="#">𝕏</a>
              <a className="lp-btn" style={{ height: 34, padding: "0 14px", fontSize: 13 }} href="#">GH</a>
              <a className="lp-btn" style={{ height: 34, padding: "0 14px", fontSize: 13 }} href="#">in</a>
            </div>
          </div>
          <div className="lp-foot-col">
            <h4>Product</h4>
            <a href="#">Web app</a>
            <a href="#">Browser extension</a>
            <a href="#pricing">Pricing</a>
            <a href="#">Changelog</a>
            <a href="#">Roadmap</a>
          </div>
          <div className="lp-foot-col">
            <h4>Compare</h4>
            <a href="#">vs Todoist</a>
            <a href="#">vs Motion</a>
            <a href="#">vs Sunsama</a>
            <a href="#">vs Cold Turkey</a>
          </div>
          <div className="lp-foot-col">
            <h4>Company</h4>
            <a href="#">Manifesto</a>
            <a href="#">Blog</a>
            <a href="#">Brand</a>
            <a href="#">Press kit</a>
          </div>
        </div>
        <div className="lp-foot-meta">
          <span>© LockIn 2026 · Built quietly.</span>
          <span className="links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Security</a>
          </span>
        </div>
      </div>
    </footer>
  )
}
