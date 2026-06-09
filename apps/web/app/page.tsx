"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { motion, useInView } from "motion/react"
import BorderGlow from "@/components/BorderGlow"
import PixelCard from "@/components/PixelCard"
import "./landing.css"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { ChevronDown, LanguagesIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { LogoAccent } from "@workspace/ui/components/logo-accent"
import XIcon from "@/components/x"
import YoutubeIcon from "@/components/youtube"
import RedditIcon from "@/components/reddit"
import { LogoLab } from "@/components/logo-lab"
import { Show } from "@clerk/nextjs"
import { PlayFilledIcon } from "@/components/icons"
import {
  getLocaleDisplayName,
  I18N_COOKIE_NAME,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@workspace/i18n"
import Image from "next/image"

const revealEase = [0.16, 1, 0.3, 1] as const
const revealViewport = {
  once: true,
  amount: 0.08,
  margin: "0px 0px -40px 0px",
} as const

const revealUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: revealViewport,
  transition: { duration: 0.65, ease: revealEase, delay },
})

const revealScale = (delay = 0) => ({
  initial: { opacity: 0, y: 16, scale: 0.97 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: revealViewport,
  transition: { duration: 0.65, ease: revealEase, delay },
})

type PricingTier = {
  name: string
  desc: string
  priceMonthly?: string
  priceAnnual?: string
  price: string
  perMonthly?: string
  perAnnual?: string
  per: string
  billedMonthly?: string
  billedAnnual?: string
  billed: string
  features: string[]
  cta: string
  tag?: string
}

type FaqEntry = {
  question: string
  answer: string
}

/* ---- Root page ---- */
export default function LandingPage() {
  return (
    <div className="lp">
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

/* ---- Header with scroll shadow ---- TAILWIND CONVERTED*/
function SiteHeader() {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-330 px-4 sm:px-6 lg:px-0">
        <div className="relative flex h-16 items-center justify-between gap-4">
          <Link href="/" className="inline-flex shrink-0 items-center">
            <LogoAccent className="h-9" />
          </Link>

          <div className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 text-sm font-medium text-muted-foreground *:hover:text-foreground md:flex">
            <Button variant="ghost" size="sm">
              <Link href="/#product">{t("landing.nav.product")}</Link>
            </Button>
            <Button variant="ghost" size="sm">
              <Link href="/#extension">{t("landing.nav.extension")}</Link>
            </Button>
            <Button variant="ghost" size="sm">
              <Link href="/#pricing">{t("landing.nav.pricing")}</Link>
            </Button>
            <Button variant="ghost" size="sm">
              <Link href="/#faq">{t("landing.nav.faq")}</Link>
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <Show when={"signed-out"}>
              <Button variant="outline">
                <Link className="text-sm font-medium" href="/app/sign-in">
                  {t("landing.auth.signIn")}
                </Link>
              </Button>
              <Button>
                <Link className="text-sm font-medium" href="/app/sign-up">
                  {t("landing.auth.getStarted")}
                </Link>
              </Button>
            </Show>

            <Show when={"signed-in"}>
              <Button>
                <Link className="text-sm font-medium" href="/app">
                  {t("landing.auth.goToApp")}
                </Link>
              </Button>
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
  return (
    <span className={`lp-countdown${tick ? "tick" : ""}`}>
      {m}:{s}
    </span>
  )
}

/* ---- Live countdown timer ---- */
function LiveTimerSmall({ initialSeconds = 768 }: { initialSeconds?: number }) {
  const [secs, setSecs] = useState(initialSeconds)

  useEffect(() => {
    const id = setInterval(() => {
      setSecs((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const m = String(Math.floor((secs + 1800) / 60)).padStart(2, "0")
  const s = String(secs % 60).padStart(2, "0")
  return (
    <span>
      0:{m}:{s}
    </span>
  )
}

/* ---- Hero section ----TAILWIND-CONVERTED */
function HeroSection() {
  const { t } = useTranslation()

  return (
    <motion.section
      className="relative overflow-hidden pt-24 pb-24"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
    >
      <div className="relative z-10 mx-auto max-w-330 px-4 md:px-6 lg:px-0">
        <motion.span
          className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-2 py-1 font-mono text-xs font-medium tracking-wider text-gray-500 uppercase"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.67, ease: revealEase }}
        >
          <span className="pulse" />
          {t("landing.hero.badge")}
        </motion.span>

        <motion.h1 className="max-w-[25ch] font-sans-tight text-5xl leading-[110%] font-[550] lg:text-6xl">
          <motion.span
            className="inline-block"
            style={{ "--i": 0 } as React.CSSProperties}
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0)" }}
            transition={{ duration: 0.5, delay: 0.2, ease: revealEase }}
          >
            <span>{t("landing.hero.title.own")}</span>
          </motion.span>{" "}
          <motion.span
            className="inline-block"
            style={{ "--i": 1 } as React.CSSProperties}
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0)" }}
            transition={{ duration: 0.5, delay: 0.28, ease: revealEase }}
          >
            <span>{t("landing.hero.title.yourOne")}</span>
          </motion.span>{" "}
          <motion.span
            className="inline-block"
            style={{ "--i": 2 } as React.CSSProperties}
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0)" }}
            transition={{ duration: 0.5, delay: 0.36, ease: revealEase }}
          >
            {t("landing.hero.title.time")}
          </motion.span>
          <motion.span
            className="inline-block"
            style={{ "--i": 3 } as React.CSSProperties}
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0)" }}
            transition={{ duration: 0.5, delay: 0.44, ease: revealEase }}
          >
            {t("landing.hero.title.build")}
          </motion.span>{" "}
          <motion.span
            className="inline-block"
            style={{ "--i": 4 } as React.CSSProperties}
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0)" }}
            transition={{ duration: 0.5, delay: 0.52, ease: revealEase }}
          >
            {t("landing.hero.title.yourTwo")}
          </motion.span>{" "}
          <motion.span
            className="inline-block"
            style={{ "--i": 5 } as React.CSSProperties}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6, ease: revealEase }}
          >
            <span>{t("landing.hero.title.life")}</span>
          </motion.span>
        </motion.h1>

        <motion.p
          className="mt-6 max-w-140 text-base text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.32, ease: revealEase }}
        >
          {t("landing.hero.description")}
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.46, ease: revealEase }}
        >
          <Show when={"signed-out"}>
            <Button variant={"default"} size={"lg"} className={"h-12 px-6"}>
              <Link href="/app/sign-up" className="text-sm font-medium">
                {t("landing.auth.getStarted")}
              </Link>
            </Button>
          </Show>

          <Show when={"signed-in"}>
            <Button variant={"default"} size={"lg"} className={"h-12 px-6"}>
              <Link href="/app" className="text-sm font-medium">
                {t("landing.auth.goToApp")}
              </Link>
            </Button>
          </Show>

          <Button variant={"outline"} size={"lg"} className={"h-12 px-6"}>
            <Link
              href="/app/sign-up"
              className="flex items-center text-sm font-medium"
            >
              {t("landing.hero.watchDemo")}
              <PlayFilledIcon className="ml-2 h-6 text-muted-foreground" />
            </Link>
          </Button>

          {/* <span className="running">
            <span className="dot" />
            {t("landing.hero.running")}
          </span> */}
        </motion.div>

        {/* <motion.div
          className="mt-16 grid gap-0 overflow-hidden rounded-2xl border bg-card shadow-xl md:grid-cols-2"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, delay: 0.6, ease: revealEase }}
        >
          <div className="flex flex-col gap-2 bg-card p-10">
            <div className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
              {t("landing.hero.mock.today")}
            </div>
            <h3 className="font-sans-tight text-4xl font-[550]">
              {t("landing.hero.mock.headingOne")}
              <br />
              {t("landing.hero.mock.headingTwo")}
            </h3>
            <div className="lp-hero-tasks">
              <div className="lp-htask active">
                <span className="chk" />
                <span className="name">{t("landing.mock.taskPrimary")}</span>
                <span className="pill">{t("landing.hero.mock.inSprint")}</span>
                <span className="meta">
                  <LiveTimer initialSeconds={768} />
                </span>
              </div>
              <div className="lp-htask">
                <span className="chk" />
                <span className="name">{t("landing.hero.mock.taskTwo")}</span>
                <span className="meta">25m</span>
              </div>
              <div className="lp-htask">
                <span className="chk" />
                <span className="name">{t("landing.hero.mock.taskThree")}</span>
                <span className="meta">45m</span>
              </div>
              <div className="lp-htask done">
                <span className="chk" />
                <span className="name">{t("landing.hero.mock.taskFour")}</span>
              </div>
            </div>
          </div>
          <div className="relative flex min-h-135 items-end bg-[url('/lockin-gradient.png')] bg-size-[150%_150%] bg-position-[bottom_right] p-10">
            <div className="lp-sprint-mock w-full">
              <div className="flex justify-between">
                <div className="live">{t("landing.mock.sprint142")}</div>
                <span
                  className="label mb-1 text-[13px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-ibm-mono)" }}
                >
                  <LiveTimerSmall initialSeconds={768} />{" "}
                  {t("landing.mock.left")}
                </span>
              </div>

              <div className="timer">
                <LiveTimer initialSeconds={768} />
              </div>

              <div className="task-name">{t("landing.mock.taskPrimary")}</div>
              <div className="steps">
                <div className="step done">
                  <span className="b" /> {t("landing.mock.steps.outline")}
                </div>
                <div className="step done">
                  <span className="b" /> {t("landing.mock.steps.hook")}
                </div>
                <div className="step now">
                  <span className="b" /> {t("landing.mock.taskPrimary")}
                </div>
                <div className="step">
                  <span className="b" /> {t("landing.mock.steps.revise")}
                </div>
              </div>
              <div className="footer flex flex-1 items-end">
                <button>{t("landing.mock.actions.addFive")}</button>
                <button>{t("landing.mock.actions.pause")}</button>
                <button className="primary">
                  {t("landing.mock.actions.endSprint")}
                </button>
              </div>
            </div>
          </div>
        </motion.div> */}

        <motion.div
          className="relative mt-16 grid min-h-200 gap-0 overflow-hidden rounded-lg"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, delay: 0.6, ease: revealEase }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.9, ease: revealEase }}
            className="absolute top-1/2 left-12 w-260 -translate-y-1/2 overflow-hidden rounded-md shadow-lg ring ring-foreground/10 lg:left-1/2 lg:-translate-x-1/2"
          >
            <Image
              src="/product-demo.png"
              alt="LockIn app demo"
              width={1440}
              height={1080}
            />
          </motion.div>

          <Image
            src="/lockin-gradient.png"
            className="h-full w-full object-cover"
            alt="LockIn app demo"
            width={800}
            height={600}
          />
        </motion.div>
      </div>
    </motion.section>
  )
}

/* ---- Sprint Mode demo card (hover to start timer) ---- */
function SprintDemoCard() {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)
  const [secs, setSecs] = useState(1500)

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
    <motion.div
      className={`lp-card dark lp-sprint-card col-span-2 ${hovered ? "sprint-active" : ""}`}
      data-hint="↑ hover"
      style={{ "--rd": "160ms" } as React.CSSProperties}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...revealUp(0.16)}
    >
      <div className="body">
        <div
          className={`lp-card-label ${hovered ? "text-foreground! before:bg-foreground" : ""} transition-colors`}
        >
          {t("landing.cards.sprint.label")}
        </div>
        <h3 className={`${hovered ? "text-foreground" : ""} transition-colors`}>
          {t("landing.cards.sprint.headingOne")}
          <br />
          <span
            className={`${hovered ? "text-muted-foreground" : ""} transition-colors`}
          >
            {t("landing.cards.sprint.headingTwo")}
          </span>
        </h3>
        <p style={{ margin: "0 auto" }}>
          {t("landing.cards.sprint.description")}
        </p>
        <div style={{ marginTop: "auto", textAlign: "center" }}>
          <div className="lp-sprint-timer-big">
            {m}:{s}
          </div>
          <div className="lp-sprint-status">
            {hovered
              ? t("landing.cards.sprint.statusActive")
              : t("landing.cards.sprint.statusReady")}
          </div>
          <div className="lp-sprint-task-slide">
            {t("landing.mock.taskPrimary")}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function BreakdownMock() {
  const { t } = useTranslation()
  const breakdownQuery = t("landing.breakdown.query")
  const mockRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(mockRef, { once: true, amount: 0.4 })
  const [typed, setTyped] = useState("")
  const [cursorVisible, setCursorVisible] = useState(false)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!isInView || phase !== 0) return
    const cursorId = setTimeout(() => setCursorVisible(true), 0)
    let i = 0
    const typeId = setInterval(() => {
      i++
      setTyped(breakdownQuery.slice(0, i))
      if (i >= breakdownQuery.length) {
        clearInterval(typeId)
        setTimeout(() => setPhase(1), 420)
        setTimeout(() => setPhase(2), 870)
        setTimeout(() => {
          setPhase(3)
          setCursorVisible(false)
        }, 1270)
      }
    }, 26)
    return () => {
      clearTimeout(cursorId)
      clearInterval(typeId)
    }
  }, [breakdownQuery, isInView, phase])

  return (
    <div className={`lp-breakdown-mock bd-phase-${phase}`} ref={mockRef}>
      <div className="uq lp-uq-typing">
        {typed || breakdownQuery}
        {cursorVisible && <span className="cursor">|</span>}
      </div>
      <div className="ai">
        <span className="av" />
        <div className="ai-bubble">
          {t("landing.breakdown.aiPrefix")} <b>1h 35m</b>.{" "}
          {t("landing.breakdown.aiSuffix")}
        </div>
      </div>
      <div className="steps">
        <div className="step">
          <span className="grip" />
          <span className="cb" />
          <span className="nm">{t("landing.breakdown.steps.problemSets")}</span>
          <span className="dur">35m</span>
        </div>
        <div className="step">
          <span className="grip" />
          <span className="cb" />
          <span className="nm">{t("landing.breakdown.steps.cheatSheet")}</span>
          <span className="dur">20m</span>
        </div>
        <div className="step">
          <span className="grip" />
          <span className="cb" />
          <span className="nm">{t("landing.breakdown.steps.review")}</span>
          <span className="dur">25m</span>
        </div>
        <div className="step">
          <span className="grip" />
          <span className="cb" />
          <span className="nm">{t("landing.breakdown.steps.practice")}</span>
          <span className="dur">15m</span>
        </div>
      </div>
      <div className="row-actions">
        <button className="b primary">
          {t("landing.breakdown.actions.start")}
        </button>
        <button className="b">{t("landing.breakdown.actions.smaller")}</button>
        <button className="b">{t("landing.breakdown.actions.edit")}</button>
      </div>
    </div>
  )
}

/* ---- HUD demo card (dimmed until hover) ---- */
function HudDemoCard() {
  const { t } = useTranslation()

  return (
    <motion.div
      className="lp-card lp-hud-demo-card col-span-2"
      data-hint="↑ hover"
      style={{ "--rd": "160ms" } as React.CSSProperties}
      {...revealUp(0.16)}
    >
      <div className="body">
        <div className="lp-card-label">{t("landing.cards.hud.label")}</div>
        <h3>
          {t("landing.cards.hud.headingOne")}
          <br />
          <span className="light">{t("landing.cards.hud.headingTwo")}</span>
        </h3>
        <p>{t("landing.cards.hud.description")}</p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "auto",
            paddingTop: 24,
          }}
        >
          <div className="lp-hud">
            <span className="live" />
            <span className="t">12:48</span>
            <span className="nm">· {t("landing.mock.taskShort")}</span>
            <span className="ring" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ---- Distraction shield demo card (BLOCKED on hover) ---- */
function DistractionCard() {
  const { t } = useTranslation()

  return (
    <motion.div
      className="lp-card col-span-2"
      data-hint="↑ hover"
      style={{ "--rd": "80ms" } as React.CSSProperties}
      {...revealUp(0.08)}
    >
      <div className="body">
        <div className="lp-card-label">
          {t("landing.cards.blocklist.label")}
        </div>
        <h3>
          {t("landing.cards.blocklist.headingOne")}
          <br />
          <span className="light">
            {t("landing.cards.blocklist.headingTwo")}
          </span>
        </h3>
        <p>{t("landing.cards.blocklist.description")}</p>
        <div className="lp-distraction-tabs">
          <div className="lp-dt-tab">
            <XIcon />
            <span className="lp-dt-nm">x.com</span>
            <span className="lp-dt-badge hard">{t("landing.mock.hard")}</span>
            <span className="lp-dt-blocked">{t("landing.mock.blocked")}</span>
          </div>
          <div className="lp-dt-tab">
            <YoutubeIcon />
            <span className="lp-dt-nm">youtube.com</span>
            <span className="lp-dt-badge hard">{t("landing.mock.hard")}</span>
            <span className="lp-dt-blocked">{t("landing.mock.blocked")}</span>
          </div>
          <div className="lp-dt-tab">
            <RedditIcon />
            <span className="lp-dt-nm">reddit.com</span>
            <span className="lp-dt-badge soft">{t("landing.mock.soft")}</span>
            <span className="lp-dt-blocked">{t("landing.mock.blocked")}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ---- Bento / product section ----TW_CONVERTED */
function BentoSection() {
  const { t } = useTranslation()

  return (
    <section className="py-20" id="product">
      <div className="mx-auto max-w-330 sm:px-6 lg:px-0">
        <motion.div className="mb-8" {...revealUp(0)}>
          <span className="bg-canvas mb-4 inline-flex items-center gap-2 rounded-full border px-2 py-1 font-mono text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {t("landing.product.eyebrow")}
          </span>
          <h2 className="font-sans-tight text-3xl font-[550] md:text-4xl">
            <span className="light">{t("landing.product.headingOne")}</span>
            <br />
            {t("landing.product.headingTwo")}
          </h2>
          <p className="mt-3 max-w-140 text-base text-muted-foreground">
            {t("landing.product.description")}
          </p>
        </motion.div>

        <div className="grid grid-cols-6 gap-3">
          <motion.div
            className="lp-card col-span-4 row-span-2"
            style={{ "--rd": "0ms" } as React.CSSProperties}
            {...revealUp(0)}
          >
            <div className="body">
              <div>
                <div className="lp-card-label">
                  {t("landing.cards.breakdown.label")}
                </div>
                <h3>
                  {t("landing.cards.breakdown.headingOne")}
                  <br />
                  <span className="light">
                    {t("landing.cards.breakdown.headingTwo")}
                  </span>
                </h3>
                <p>{t("landing.cards.breakdown.description")}</p>
              </div>

              <BreakdownMock />
            </div>
          </motion.div>

          <SprintDemoCard />

          <HudDemoCard />

          <motion.div
            className="lp-card with-gradient bl col-span-3"
            {...revealUp(0)}
          >
            <div className="body">
              <div
                className="lp-card-label"
                style={{ color: "rgba(255,255,255,0.8)" }}
              >
                {t("landing.cards.shield.label")}
              </div>
              <h3 style={{ color: "#fff", marginTop: "auto" }}>
                {t("landing.cards.shield.headingOne")}
                <br />
                <span className="light">
                  {t("landing.cards.shield.headingTwo")}
                </span>
              </h3>
              <p style={{ color: "rgba(255,255,255,0.85)" }}>
                {t("landing.cards.shield.description")}
              </p>
            </div>
          </motion.div>

          <motion.div {...revealUp(0.1)} className="col-span-3">
            <PixelCard
              variant="default"
              colors="#0c0404,#1a1014,#2a1820,#F9B314,#FFC22E"
              gap={6}
              speed={40}
              className="lp-card lp-pixel-bento col-span-3"
              style={{ "--rd": "100ms" } as React.CSSProperties}
            >
              <div className="lp-block-mock lp-pixel-content">
                <span className="tld">{t("landing.blocked.eyebrow")}</span>
                <h4>
                  {t("landing.blocked.headingPrefix")}{" "}
                  <em>{t("landing.blocked.headingEmphasis")}</em>.
                </h4>
                <p>{t("landing.blocked.description")}</p>
                <div className="receipt">
                  <div className="r">
                    <span className="l">{t("landing.blocked.workingOn")}</span>
                    <span className="v">{t("landing.mock.taskShort")}</span>
                  </div>
                  <div className="r">
                    <span className="l">
                      {t("landing.blocked.sprintLength")}
                    </span>
                    <span className="v">25 min</span>
                  </div>
                  <div className="r t">
                    <span className="l">{t("landing.blocked.timeLeft")}</span>
                    <span className="v">12:48</span>
                  </div>
                </div>
              </div>
            </PixelCard>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ---- Heatmap with stagger reveal ---- */
function Heatmap() {
  const levels = [
    0.2, 0.5, 0.1, 0.3, 0.7, 0.4, 0.2, 0.6, 0.9, 0.5, 0.4, 0.2, 0.3, 0.3, 0.4,
    0.6, 0.8, 1, 0.7, 0.3, 0.5, 0.8, 0.6, 0.5, 0.3, 0.2, 0.1, 0.2, 0.4, 0.5,
    0.8, 0.5, 0.2, 0.4, 0.7, 0.4, 0.3, 0.2, 0.1, 0.05, 0.1, 0.2, 0.4, 0.5, 0.3,
    0.1, 0.3, 0.5, 0.3, 0.2, 0.1, 0.05,
  ]

  return (
    <motion.div className="lp-heat-grid" {...revealUp(0.12)}>
      {levels.map((lvl, i) => (
        <motion.span
          key={i}
          className="c"
          style={{ "--lvl": lvl } as React.CSSProperties}
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, delay: i * 0.018, ease: revealEase }}
        />
      ))}
    </motion.div>
  )
}

/* ---- Extension section ---- */
function ExtensionSection() {
  const { t } = useTranslation()

  return (
    <section
      className="lp-bento lp-section"
      id="extension"
      style={{ paddingTop: 0 }}
    >
      <div className="mx-auto max-w-330 sm:px-6 lg:px-0">
        <motion.div className="lp-section-head" {...revealUp(0)}>
          <span className="lp-eyebrow-pill">
            {t("landing.extension.eyebrow")}
          </span>
          <h2>
            <span className="light">{t("landing.extension.headingOne")}</span>
            <br />
            {t("landing.extension.headingTwo")}
          </h2>
          <p>{t("landing.extension.description")}</p>
        </motion.div>

        <div className="grid grid-cols-6 gap-3">
          <motion.div
            className="lp-card fog col-span-4"
            style={{ "--rd": "0ms", padding: 40 } as React.CSSProperties}
            {...revealUp(0)}
          >
            <div
              className="body"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 32,
                alignItems: "start",
              }}
            >
              <div>
                <div className="lp-card-label">
                  {t("landing.extension.popup.label")}
                </div>
                <h3>
                  {t("landing.extension.popup.headingOne")}
                  <br />
                  <span className="light">
                    {t("landing.extension.popup.headingTwo")}
                  </span>
                </h3>
                <p style={{ marginTop: 12 }}>
                  {t("landing.extension.popup.description")}
                </p>
              </div>
              <div className="lp-ext-popup self-center">
                <div className="head">
                  <span className="live">{t("landing.mock.sprint42")}</span>
                  <span>0:32:48 {t("landing.mock.left")}</span>
                </div>
                <div className="task-name">{t("landing.mock.taskShort")}</div>
                <div className="timer">12:48</div>
                <div className="progress" />
                <div className="step done">
                  <span className="b" />
                  {t("landing.mock.steps.outline")}
                </div>
                <div className="step done">
                  <span className="b" />
                  {t("landing.mock.steps.hook")}
                </div>
                <div className="step now">
                  <span className="b" />
                  {t("landing.mock.steps.statement")}
                </div>
                <div className="step">
                  <span className="b" />
                  {t("landing.mock.steps.bridge")}
                </div>
                <div className="footer">
                  <button>{t("landing.mock.actions.addFiveShort")}</button>
                  <button>{t("landing.mock.actions.pause")}</button>
                  <button className="primary">
                    {t("landing.mock.actions.endSprint")}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="lp-card col-span-2"
            style={{ "--rd": "100ms", padding: 40 } as React.CSSProperties}
            {...revealUp(0.1)}
          >
            <div className="body">
              <div className="lp-card-label">
                {t("landing.extension.pairing.label")}
              </div>
              <h3>
                {t("landing.extension.pairing.headingOne")}
                <br />
                <span className="light">
                  {t("landing.extension.pairing.headingTwo")}
                </span>
              </h3>
              <p>{t("landing.extension.pairing.description")}</p>
              <div style={{ marginTop: "auto", paddingTop: 24 }}>
                <div className="rounded-2xl bg-amber-50 p-8 text-center">
                  <div
                    style={{
                      fontFamily: "var(--font-ibm-mono)",
                      fontSize: 11,
                      color: "var(--muted-foreground)",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                    }}
                  >
                    {t("landing.extension.pairing.confirm")}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-funnel)",
                      fontWeight: 300,
                      fontSize: 48,
                      letterSpacing: "-0.04em",
                      color: "var(--ink)",
                      fontFeatureSettings: "'tnum' 1",
                    }}
                  >
                    BR8 — 9KF
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-ibm-mono)",
                      fontSize: 11,
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {t("landing.extension.pairing.expires")}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="lp-card col-span-2"
            style={{ "--rd": "0ms" } as React.CSSProperties}
            {...revealUp(0)}
          >
            <div className="body">
              <div className="lp-card-label">
                {t("landing.extension.ambient.label")}
              </div>
              <h3>
                {t("landing.extension.ambient.headingOne")}
                <br />
                <span className="light">
                  {t("landing.extension.ambient.headingTwo")}
                </span>
              </h3>
              <p>{t("landing.extension.ambient.description")}</p>
              <div
                style={{
                  marginTop: "auto",
                  paddingTop: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <div className="lp-hud">
                  <span className="live" />
                  <span className="t">12:48</span>
                  <span className="ring" />
                </div>
                <div className="lp-hud">
                  <span className="live" />
                  <span className="t">12:48</span>
                  <span className="nm">
                    · {t("landing.mock.taskShortLower")}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <DistractionCard />

          <motion.div
            className="lp-card col-span-2"
            style={{ "--rd": "160ms" } as React.CSSProperties}
            {...revealUp(0.16)}
          >
            <div className="body">
              <div className="lp-card-label">
                {t("landing.extension.slip.label")}
              </div>
              <h3>
                {t("landing.extension.slip.headingOne")}
                <br />
                <span className="light">
                  {t("landing.extension.slip.headingTwo")}
                </span>
              </h3>
              <p>{t("landing.extension.slip.description")}</p>
              <div
                style={{
                  marginTop: "auto",
                  paddingTop: 16,
                  background: "var(--fog)",
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {t("landing.extension.slip.prompt")}
                </div>
                <div
                  style={{
                    color: "var(--cool)",
                    fontSize: 12.5,
                    marginTop: 4,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {t("landing.extension.slip.costPrefix")}{" "}
                  <b style={{ color: "var(--ink)" }}>
                    {t("landing.extension.slip.costStrong")}
                  </b>{" "}
                  {t("landing.extension.slip.costSuffix")}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button
                    className="lp-btn yellow"
                    style={{
                      height: 32,
                      fontSize: 12,
                      flex: 1,
                      padding: "0 10px",
                    }}
                  >
                    {t("landing.extension.slip.back")}
                  </button>
                  <button
                    className="lp-btn"
                    style={{ height: 32, fontSize: 12, padding: "0 10px" }}
                  >
                    {t("landing.extension.slip.fiveMin")}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="lp-card with-gradient tl col-span-3"
            style={{ "--rd": "0ms", minHeight: 320 } as React.CSSProperties}
            {...revealUp(0)}
          >
            <div className="body">
              <div
                className="lp-card-label"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                {t("landing.extension.patterns.label")}
              </div>
              <h3 style={{ color: "#fff" }}>
                {t("landing.extension.patterns.headingOne")}
                <br />
                <span className="light">
                  {t("landing.extension.patterns.headingTwo")}
                </span>
              </h3>
              <p style={{ color: "rgba(255,255,255,0.85)" }}>
                {t("landing.extension.patterns.description")}
              </p>
            </div>
          </motion.div>

          <motion.div
            className="lp-card col-span-3"
            style={{ "--rd": "100ms" } as React.CSSProperties}
            {...revealUp(0.1)}
          >
            <div className="body">
              <div className="lp-card-label">
                {t("landing.extension.heatmap.label")}
              </div>
              <h3>
                {t("landing.extension.heatmap.headingOne")}
                <br />
                <span className="light">
                  {t("landing.extension.heatmap.headingTwo")}
                </span>
              </h3>
              <Heatmap />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 14,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--muted-foreground)",
                }}
              >
                <span>{t("landing.extension.heatmap.ago")}</span>
                <span>{t("landing.extension.heatmap.today")}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ---- Pricing section ---- */
function PricingSection() {
  const { t } = useTranslation()
  const [annual, setAnnual] = useState(true)
  const monthlyRef = useRef<HTMLButtonElement>(null)
  const annualRef = useRef<HTMLButtonElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)

  const positionPill = useCallback(
    (noAnim: boolean) => {
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
    },
    [annual]
  )

  useEffect(() => {
    positionPill(true)
  }, [positionPill])
  useEffect(() => {
    positionPill(false)
  }, [positionPill])

  const pricingTiers = t("landing.pricing.tiers", {
    returnObjects: true,
  }) as PricingTier[]
  const tierDelays = ["0ms", "100ms", "200ms"]

  return (
    <section className="lp-pricing lp-section" id="pricing">
      <div className="mx-auto max-w-330 sm:px-6 lg:px-0">
        <motion.div className="lp-section-head" {...revealUp(0)}>
          <span className="lp-eyebrow-pill">
            {t("landing.pricing.eyebrow")}
          </span>
          <h2>
            <span className="light">{t("landing.pricing.headingOne")}</span>
            <br />
            {t("landing.pricing.headingTwo")}
          </h2>
          <p>{t("landing.pricing.description")}</p>
          <div className="lp-billing-toggle">
            <span ref={pillRef} className="lp-bt-pill" />
            <button
              ref={monthlyRef}
              className={!annual ? "active" : ""}
              onClick={() => setAnnual(false)}
            >
              {t("landing.pricing.monthly")}
            </button>
            <button
              ref={annualRef}
              className={annual ? "active" : ""}
              onClick={() => setAnnual(true)}
            >
              {t("landing.pricing.annually")} <span className="save">−20%</span>
            </button>
          </div>
        </motion.div>

        <div className="lp-tier-row">
          {pricingTiers.map((tier, index) => {
            const delay = tierDelays[index] ?? "0ms"
            const isFeatured = tier.name === "Pro"
            const price = annual
              ? (tier.priceAnnual ?? tier.price)
              : (tier.priceMonthly ?? tier.price)
            const per = annual
              ? (tier.perAnnual ?? tier.per)
              : (tier.perMonthly ?? tier.per)
            const billed = annual
              ? (tier.billedAnnual ?? tier.billed)
              : (tier.billedMonthly ?? tier.billed)
            const ctaHref =
              tier.name === "Team" ? "mailto:hi@lockin.app" : "/app/sign-up"

            if (isFeatured) {
              return (
                <motion.div
                  key={tier.name}
                  {...revealScale(Number.parseInt(delay, 10) / 1000)}
                >
                  <BorderGlow
                    className="lp-tier-pro h-full"
                    style={{ "--rd": delay } as React.CSSProperties}
                    backgroundColor="var(--card)"
                    glowColor="var(--primary)"
                    colors={["var(--primary)"]}
                    borderRadius={18}
                    glowRadius={36}
                    glowIntensity={1.4}
                    coneSpread={22}
                    fillOpacity={0}
                    continuous
                    continuousSpeed={0.35}
                  >
                    <div className="lp-tier-pro-inner">
                      {tier.tag && (
                        <div className="lp-tier-tag">{tier.tag}</div>
                      )}
                      <div className="lp-tier-name">{tier.name}</div>
                      <div className="lp-tier-desc">{tier.desc}</div>
                      <div className="lp-price-row">
                        <span
                          key={price}
                          className="lp-price-amt lp-price-flip"
                        >
                          {price}
                        </span>
                        <span className="lp-price-per">{per}</span>
                      </div>
                      <div className="lp-billed">{billed}</div>
                      <ul className="lp-features">
                        {tier.features.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                      <Link
                        className="lp-btn yellow"
                        href={ctaHref}
                        style={{
                          marginTop: "auto",
                          width: "100%",
                          justifyContent: "center",
                        }}
                      >
                        {tier.cta} <span className="arr">→</span>
                      </Link>
                    </div>
                  </BorderGlow>
                </motion.div>
              )
            }
            return (
              <motion.div
                key={tier.name}
                className="lp-tier"
                style={{ "--rd": delay } as React.CSSProperties}
                {...revealScale(Number.parseInt(delay, 10) / 1000)}
              >
                <div className="lp-tier-name">{tier.name}</div>
                <div className="lp-tier-desc">{tier.desc}</div>
                <div className="lp-price-row">
                  <span className="lp-price-amt">{price}</span>
                  <span className="lp-price-per">{per}</span>
                </div>
                <div className="lp-billed">{billed}</div>
                <ul className="lp-features">
                  {tier.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
                <Link
                  className="lp-btn"
                  href={ctaHref}
                  style={{
                    marginTop: "auto",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  {tier.cta}
                  {tier.name === "Team" && <span className="arr">→</span>}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---- FAQ accordion item ---- */
function FaqItem({
  question,
  answer,
  defaultOpen = false,
}: {
  question: string
  answer: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <motion.div
      className={`lp-faq-item ${open ? "open" : ""}`}
      {...revealUp(0)}
    >
      <div
        className="lp-faq-summary"
        onClick={() => setOpen(!open)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen(!open)}
      >
        {question}
        <span className="lp-faq-icon" />
      </div>
      <div className="lp-faq-body">
        <div>{answer}</div>
      </div>
    </motion.div>
  )
}

function FaqSection() {
  const { t } = useTranslation()
  const faqs = t("landing.faq.items", { returnObjects: true }) as FaqEntry[]

  return (
    <section className="lp-faq lp-section" id="faq">
      <div className="lp-wrap lp-faq-wrap">
        <h2>
          <span className="light">{t("landing.faq.headingLight")}</span>{" "}
          {t("landing.faq.headingRest")}
        </h2>
        <p className="sub">
          {t("landing.faq.subPrefix")}{" "}
          <a href="mailto:hi@lockin.app">hi@lockin.app</a>{" "}
          {t("landing.faq.subSuffix")}
        </p>

        {faqs.map((faq, index) => (
          <FaqItem
            key={faq.question}
            defaultOpen={index === 0}
            question={faq.question}
            answer={faq.answer}
          />
        ))}
      </div>
    </section>
  )
}

/* ---- Big CTA section ---- */
/* ---- Footer ---- */
function SiteFooter() {
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const currentLocale = i18n.language as AppLocale

  const switchLocale = (locale: AppLocale) => {
    setTimeout(() => {
      window.document.cookie = `${I18N_COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`
      router.refresh()
    }, 0)
  }

  return (
    <footer className="lp-footer">
      <div className="lp-wrap">
        <div className="lp-foot-grid">
          <div>
            <LogoAccent className="-ml-1 h-10" />
            <p className="lp-foot-tagline">{t("landing.footer.tagline")}</p>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant={"outline"}
                    size={"lg"}
                    className={"text-sm!"}
                  />
                }
              >
                <LanguagesIcon data-icon="inline-start" />
                {getLocaleDisplayName(currentLocale)}
                <ChevronDown
                  data-icon="inline-end"
                  className="text-muted-foreground"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  {SUPPORTED_LOCALES.map((locale) => (
                    <DropdownMenuItem
                      key={locale}
                      onClick={() => switchLocale(locale)}
                    >
                      {getLocaleDisplayName(locale)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="lp-foot-col">
            <h4>{t("landing.footer.product")}</h4>
            <a href="#">{t("landing.footer.webApp")}</a>
            <a href="#">{t("landing.footer.browserExtension")}</a>
            <a href="#pricing">{t("landing.nav.pricing")}</a>
            <a href="#">{t("landing.footer.changelog")}</a>
            <a href="#">{t("landing.footer.roadmap")}</a>
          </div>
          <div className="lp-foot-col">
            <h4>{t("landing.footer.compare")}</h4>
            <a href="#">Todoist</a>
            <a href="#">Motion</a>
            <a href="#">Sunsama</a>
            <a href="#">Cold Turkey</a>
          </div>
          <div className="lp-foot-col">
            <h4>{t("landing.footer.company")}</h4>
            <a href="#">{t("landing.nav.manifesto")}</a>
            <a href="#">{t("landing.footer.blog")}</a>
            <a href="#">{t("landing.footer.brand")}</a>
            <a href="#">{t("landing.footer.pressKit")}</a>
          </div>
        </div>
        <div className="lp-foot-meta">
          <div className="flex items-center gap-2">
            <LogoLab className="h-3 opacity-70" />
            <span className="h-3.75">©2026</span>
          </div>
          <span className="links">
            <a href="#">{t("landing.footer.privacy")}</a>
            <a href="#">{t("landing.footer.terms")}</a>
            <a href="#">{t("landing.footer.security")}</a>
          </span>
        </div>
      </div>
    </footer>
  )
}
