"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { LogoAccent } from "@workspace/ui/components/logo-accent"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { ChevronRight } from "@untitledui/icons"
import { motion, MotionConfig, AnimatePresence } from "motion/react"
import { revealEase, revealUp } from "@/lib/landing-animations"
import { Show } from "@clerk/nextjs"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@workspace/ui/components/accordion"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { ChevronDown, LanguagesIcon, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@workspace/ui/lib/utils"
import {
  getLocaleDisplayName,
  I18N_COOKIE_NAME,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@workspace/i18n"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8 rounded-full text-neutral-500", className)}
      >
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "h-8 w-8 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
        className
      )}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

/* On-load hero reveal: each element enters slightly after the previous one */
const heroReveal = (delay = 0) => ({
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.6, ease: revealEase, delay },
})

export function StickyHeader({ showSticky }: { showSticky?: boolean }) {
  const { t } = useTranslation()

  const STICKY_LINKS = [
    { label: t("landing.nav.home"), href: "/", active: true },
    { label: t("landing.nav.features"), href: "/#features", active: false },
    { label: t("landing.nav.resources"), href: "/#resources", active: false },
    { label: t("landing.nav.pricing"), href: "/#pricing", active: false },
    { label: t("landing.nav.help"), href: "/#help", active: false },
  ]

  return (
    <AnimatePresence>
      {showSticky && (
        <motion.div
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -64, opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed top-0 right-0 left-0 z-50 border-b border-neutral-200/50 bg-white/80 px-6 backdrop-blur-md sm:px-8 dark:border-neutral-800/50 dark:bg-neutral-950/80"
        >
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            {/* Left - Logo */}
            <Link href="/" className="inline-flex shrink-0 items-center">
              <LogoAccent className="h-[34px]" />
            </Link>

            {/* Middle - Nav Links */}
            <nav className="hidden items-center gap-6 md:flex">
              {STICKY_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              <Show when={"signed-in"}>
                <Link href="/app/sign-in">
                  <Button
                    className={
                      "will-change-tranform rounded-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                    }
                  >
                    {t("landing.nav.goToApp")}
                  </Button>
                </Link>
              </Show>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function HeroSection() {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDarkMode = mounted && resolvedTheme === "dark"

  const NAV_LINKS = [
    { label: t("landing.nav.home"), href: "/", active: true },
    { label: t("landing.nav.features"), href: "/#features", active: false },
    { label: t("landing.nav.resources"), href: "/#resources", active: false },
    { label: t("landing.nav.pricing"), href: "/#pricing", active: false },
    { label: t("landing.nav.help"), href: "/#help", active: false },
  ]

  return (
    <div
      id="main-section"
      className="relative flex h-[calc(100dvh-1.5rem)] min-h-[720px] flex-col overflow-hidden rounded-2xl border border-border bg-neutral-100 shadow-md dark:border-neutral-800 dark:bg-neutral-900/90"
    >
      {/* Warm glow along the bottom edge, washed out by a full-card backdrop blur */}
      <div
        className="pointer-events-none absolute inset-0 -bottom-40"
        aria-hidden="true"
      >
        {/* Blobs rise and bloom in after the hero cascade, then drift on slow loops */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0, y: 64 }}
          animate={{ opacity: 0.8, y: 0 }}
          transition={{ duration: 3, ease: revealEase, delay: 1 }}
        >
          <motion.div
            className="absolute top-1/2 left-[12%] h-[54%] w-[29%] rounded-full bg-[#FF7F07]"
            animate={{ y: [0, -48, 0], scale: [1, 1.08, 1] }}
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-1/2 left-[35.5%] h-[54%] w-[29%] rounded-full bg-[#EF4343]"
            animate={{ y: [0, 42, 0], scale: [1, 0.94, 1] }}
            transition={{
              duration: 13,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.2,
            }}
          />
          <motion.div
            className="absolute top-1/2 left-[59%] h-[54%] w-[29%] rounded-full bg-[#F9B314]"
            animate={{ x: [0, 38, 0], y: [0, -20, 0], scale: [1, 1.06, 1] }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2.1,
            }}
          />
        </motion.div>
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[165px] dark:bg-neutral-950/40" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 pt-4">
        <Link href="/" className="inline-flex shrink-0 items-center">
          <LogoAccent className="h-[34px]" />
        </Link>

        <nav
          aria-label="Main"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2.5 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`rounded-full px-3 py-1.5 text-sm leading-5 font-medium transition-colors ${
                link.active
                  ? "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                  : "text-muted-foreground hover:text-foreground dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Show when={"signed-out"}>
            <Link href="/app/sign-in">
              <Button
                className={
                  "will-change-tranform rounded-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                }
              >
                {t("landing.nav.login")}
              </Button>
            </Link>
          </Show>
        </div>
      </header>

      <section className="relative z-10 mt-12 flex w-full flex-col items-start gap-6 px-4 text-left sm:items-center sm:text-center">
        <div className="flex flex-col items-start gap-4 sm:items-center">
          <motion.div {...heroReveal(0)}>
            <Badge
              variant={"outline"}
              className="px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900/80"
            >
              <span className="text-xs leading-4 font-medium text-[rgba(17,17,17,0.9)] opacity-80 dark:text-neutral-200">
                {t("landing.hero.badge")}
              </span>
              <ChevronRight className="size-4 dark:text-neutral-200" />
            </Badge>
          </motion.div>

          <div className="flex flex-col items-start gap-4 sm:items-center">
            <motion.h1
              className="text-[28px] leading-[34px] font-medium tracking-[-0.01em] text-[rgba(17,17,17,0.9)] sm:text-4xl sm:leading-10 dark:text-neutral-100"
              {...heroReveal(0.08)}
            >
              {t("landing.hero.titleOne")}
              <br />
              {t("landing.hero.titleTwo")}
            </motion.h1>
            <motion.p
              className="w-full max-w-lg text-base leading-relaxed font-[450] text-[rgba(17,17,17,0.6)] dark:text-neutral-400"
              {...heroReveal(0.16)}
            >
              {t("landing.hero.description")}
            </motion.p>
          </div>
        </div>

        <motion.div
          className="flex h-10 items-center gap-2"
          {...heroReveal(0.24)}
        >
          <Show when={"signed-out"}>
            <Link href="/app/sign-up">
              <Button
                size={"lg"}
                className={
                  "rounded-full bg-neutral-900 text-white will-change-transform hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                }
              >
                {t("landing.hero.getStarted")}
              </Button>
            </Link>
            <Link href="#">
              <Button
                size={"lg"}
                variant="outline"
                className="rounded-full will-change-transform dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {t("landing.hero.watchDemo")}
              </Button>
            </Link>
          </Show>

          <Show when={"signed-in"}>
            <Link href="/app">
              <Button
                size={"lg"}
                className={
                  "rounded-full bg-neutral-900 text-white will-change-transform hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                }
              >
                {t("landing.nav.goToApp")}
              </Button>
            </Link>
          </Show>
        </motion.div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: revealEase, delay: 0.32 }}
        className="relative z-10 mt-10 min-h-0 flex-1 sm:px-12"
      >
        <div className="mx-auto h-full w-full max-w-6xl">
          <div className="w-[150%] lg:w-full">
            <Image
              src={
                isDarkMode
                  ? "/product-demo-dark.svg"
                  : "/product-demo-white.svg"
              }
              alt={t("landing.hero.demoAlt")}
              width={1440}
              height={1024}
              priority
              className="w-full"
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function IntroducingSection() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 md:py-32">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
        {/* Left column */}
        <motion.div
          className="text-md shrink-0 leading-relaxed font-medium whitespace-nowrap text-[#9D6D00] lg:w-1/4 dark:text-amber-400"
          {...revealUp(0)}
        >
          {t("landing.introducing.eyebrow")}
        </motion.div>

        {/* Right column */}
        <div className="flex max-w-[660px] flex-col gap-1">
          <motion.h2
            className="text-lg font-medium text-neutral-900 dark:text-neutral-100"
            {...revealUp(0.08)}
          >
            {t("landing.introducing.title")}
          </motion.h2>
          <motion.p
            className="text-md leading-relaxed font-normal text-muted-foreground opacity-80 dark:text-neutral-400"
            {...revealUp(0.16)}
          >
            {t("landing.introducing.description")}
          </motion.p>
        </div>
      </div>
    </section>
  )
}

function ThreeSimpleStepsSection() {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDarkMode = mounted && resolvedTheme === "dark"

  return (
    <section className="mx-auto max-w-7xl border-t border-neutral-200/60 px-6 py-24 sm:px-8 md:py-32 dark:border-neutral-800/60">
      {/* Header */}
      <div className="mb-20 sm:mb-24">
        <motion.h2
          className="max-w-lg text-3xl font-medium tracking-tight whitespace-pre-line text-[rgba(17,17,17,0.9)] sm:text-4xl lg:text-4xl dark:text-neutral-100"
          {...revealUp(0)}
        >
          {t("landing.steps.title")}
        </motion.h2>
      </div>

      {/* Steps List */}
      <div className="flex flex-col gap-24 md:gap-32">
        {/* Step 1 */}
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:justify-between lg:gap-24">
          {/* Left Column - Text */}
          <div className="flex max-w-md shrink-0 flex-col lg:w-[30%] lg:justify-between lg:self-stretch">
            <div>
              <motion.span
                className="mb-2 block font-mono text-sm tracking-wide text-muted-foreground/60 dark:text-neutral-500"
                {...revealUp(0)}
              >
                {t("landing.steps.step1.num")}
              </motion.span>
              <motion.h3
                className="mb-2 text-2xl font-medium tracking-tight text-[rgba(17,17,17,0.9)] dark:text-neutral-100"
                {...revealUp(0.04)}
              >
                {t("landing.steps.step1.title")}
              </motion.h3>
              <motion.p
                className="text-sm leading-relaxed text-[rgba(17,17,17,0.6)] dark:text-neutral-400"
                {...revealUp(0.08)}
              >
                {t("landing.steps.step1.description")}
              </motion.p>
            </div>

            <div>
              <motion.div
                className="mt-4 flex items-center gap-2"
                {...revealUp(0.12)}
              >
                <Link href="/app/sign-up">
                  <Button
                    size={"sm"}
                    className={
                      "rounded-full bg-neutral-900 px-3 text-white will-change-transform hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                    }
                  >
                    {t("landing.steps.step1.cta")}
                  </Button>
                </Link>
                <Link href="#">
                  <Button
                    size={"sm"}
                    variant="outline"
                    className="rounded-full px-3 will-change-transform dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    {t("landing.steps.step1.demo")}
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Right Column - Mockup SVG */}
          <motion.div
            className="relative w-full shrink-0 lg:w-[70%]"
            {...revealUp(0.12)}
          >
            <div className="relative overflow-hidden">
              <Image
                src={
                  isDarkMode ? "/plan-with-ai-dark.svg" : "/plan-with-ai.svg"
                }
                alt={t("landing.steps.step1.alt")}
                width={760}
                height={404}
                priority
                className="h-auto w-full object-contain"
              />
              {/* Progressive white gradient overlay on the right */}
              <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent via-white/30 to-white sm:w-36 lg:w-48 dark:via-neutral-950/30 dark:to-neutral-950" />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 w-full bg-gradient-to-b from-transparent via-white/30 to-white sm:h-16 lg:h-24 dark:via-neutral-950/30 dark:to-neutral-950" />
            </div>
          </motion.div>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:justify-between lg:gap-24">
          {/* Left Column - Text */}
          <div className="flex max-w-md shrink-0 flex-col lg:w-[30%] lg:self-stretch">
            <motion.span
              className="mb-2 block font-mono text-sm tracking-wide text-muted-foreground/60 dark:text-neutral-500"
              {...revealUp(0)}
            >
              {t("landing.steps.step2.num")}
            </motion.span>
            <motion.h3
              className="mb-2 text-2xl font-medium tracking-tight text-[rgba(17,17,17,0.9)] dark:text-neutral-100"
              {...revealUp(0.04)}
            >
              {t("landing.steps.step2.title")}
            </motion.h3>
            <motion.p
              className="text-base leading-relaxed text-[rgba(17,17,17,0.6)] dark:text-neutral-400"
              {...revealUp(0.08)}
            >
              {t("landing.steps.step2.description")}
            </motion.p>
          </div>

          {/* Right Column - Mockup SVG */}
          <motion.div
            className="relative w-full shrink-0 lg:w-[70%]"
            {...revealUp(0.12)}
          >
            <div className="relative overflow-hidden">
              <Image
                src={
                  isDarkMode ? "/make-it-yours-dark.svg" : "/make-it-yours.svg"
                }
                alt={t("landing.steps.step2.alt")}
                width={760}
                height={404}
                className="h-auto w-full object-contain"
              />
              {/* Progressive white gradient overlay on the right */}
              <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent via-white/30 to-white sm:w-36 lg:w-48 dark:via-neutral-950/30 dark:to-neutral-950" />

              {/* Progressive white gradient overlay on the bottom */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 w-full bg-gradient-to-b from-transparent via-white/30 to-white sm:h-16 lg:h-24 dark:via-neutral-950/30 dark:to-neutral-950" />
            </div>
          </motion.div>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:justify-between lg:gap-24">
          {/* Left Column - Text */}
          <div className="flex max-w-md shrink-0 flex-col lg:w-[30%] lg:self-stretch">
            <motion.span
              className="mb-2 block font-mono text-sm tracking-wide text-muted-foreground/60 dark:text-neutral-500"
              {...revealUp(0)}
            >
              {t("landing.steps.step3.num")}
            </motion.span>
            <motion.h3
              className="mb-2 text-2xl font-medium tracking-tight text-[rgba(17,17,17,0.9)] dark:text-neutral-100"
              {...revealUp(0.04)}
            >
              {t("landing.steps.step3.title")}
            </motion.h3>
            <motion.p
              className="text-base leading-relaxed text-[rgba(17,17,17,0.6)] dark:text-neutral-400"
              {...revealUp(0.08)}
            >
              {t("landing.steps.step3.description")}
            </motion.p>
          </div>

          {/* Right Column - Mockup SVG */}
          <motion.div
            className="relative w-full shrink-0 lg:w-[70%]"
            {...revealUp(0.12)}
          >
            <div className="relative overflow-hidden">
              <Image
                src={
                  isDarkMode
                    ? "/stay-in-the-zone-dark.svg"
                    : "/stay-in-the-zone.svg"
                }
                alt={t("landing.steps.step3.alt")}
                width={760}
                height={404}
                className="h-auto w-full object-contain"
              />
              {/* Progressive white gradient overlay on the right */}
              <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent via-white/30 to-white sm:w-36 lg:w-48 dark:via-neutral-950/30 dark:to-neutral-950" />

              {/* Progressive white gradient overlay on the bottom */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 w-full bg-gradient-to-b from-transparent via-white/30 to-white sm:h-16 lg:h-24 dark:via-neutral-950/30 dark:to-neutral-950" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function ExtensionSection() {
  const { t } = useTranslation()

  const sites = [
    {
      site: "/x.svg",
      domain: "x.com",
      mode: t("landing.extension.cards.rules.modes.hard", {
        defaultValue: "hard",
      }),
    },
    {
      site: "/youtube.svg",
      domain: "youtube.com",
      mode: t("landing.extension.cards.rules.modes.hard", {
        defaultValue: "hard",
      }),
    },
    {
      site: "/reddit.svg",
      domain: "reddit.com",
      mode: t("landing.extension.cards.rules.modes.soft", {
        defaultValue: "soft",
      }),
    },
  ]

  return (
    <section
      id="extension"
      className="mx-auto max-w-7xl border-t border-neutral-200/60 px-6 py-24 sm:px-8 md:py-32 dark:border-neutral-800/60"
    >
      <div className="mx-auto max-w-[1152px]">
        <motion.div className="mb-20 max-w-[525px]" {...revealUp(0)}>
          <h2 className="max-w-lg text-3xl font-medium tracking-tight whitespace-pre-line text-[rgba(17,17,17,0.9)] sm:text-4xl lg:text-4xl dark:text-neutral-100">
            {t("landing.extension.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground/80 sm:text-base dark:text-neutral-400">
            {t("landing.extension.description")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3 md:grid-rows-[1fr_1fr]">
          <FeatureCard className="md:col-span-2" delay={0}>
            <div className="grid h-full gap-9 md:grid-cols-[378px_1fr]">
              <FeatureCopy>
                <span className="font-medium text-[rgba(17,17,17,0.9)] dark:text-neutral-100">
                  {t("landing.extension.cards.distractions.bold")}
                </span>{" "}
                {t("landing.extension.cards.distractions.text")}
              </FeatureCopy>
              <ExtensionPopupMock />
            </div>
          </FeatureCard>

          <FeatureCard className="md:col-start-3 md:row-start-1" delay={0.08}>
            <FeatureCopy>
              <span className="font-medium text-[rgba(17,17,17,0.9)] dark:text-neutral-100">
                {t("landing.extension.cards.pairing.bold")}
              </span>{" "}
              {t("landing.extension.cards.pairing.text")}
            </FeatureCopy>
            <PairingCode />
          </FeatureCard>

          <FeatureCard className="md:row-start-2" delay={0.16}>
            <FeatureCopy>
              <span className="font-medium text-[rgba(17,17,17,0.9)] dark:text-neutral-100">
                {t("landing.extension.cards.eyeline.bold")}
              </span>{" "}
              {t("landing.extension.cards.eyeline.text")}
            </FeatureCopy>
            <TimerPill />
          </FeatureCard>

          <FeatureCard className="md:row-start-2" delay={0.24}>
            <FeatureCopy>
              <span className="font-medium text-[rgba(17,17,17,0.9)] dark:text-neutral-100">
                {t("landing.extension.cards.rules.bold")}
              </span>{" "}
              {t("landing.extension.cards.rules.text")}
            </FeatureCopy>
            <div className="mt-auto space-y-1" aria-hidden="true">
              {sites.map(({ site, domain, mode }) => (
                <div
                  key={site}
                  className="mt-auto flex items-center justify-between rounded-full border bg-white px-3 py-2.5 text-sm shadow-2xs dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <span className="flex items-center gap-2 text-[rgba(17,17,17,0.9)] dark:text-neutral-100">
                    <Image src={site} alt={site} width={16} height={16} />
                    {domain}
                  </span>
                  <span className="text-[rgba(17,17,17,0.6)] dark:text-neutral-400">
                    {mode}
                  </span>
                </div>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard className="md:row-start-2" delay={0.32}>
            <FeatureCopy>
              <span className="font-medium text-[rgba(17,17,17,0.9)] dark:text-neutral-100">
                {t("landing.extension.cards.nudge.bold")}
              </span>{" "}
              {t("landing.extension.cards.nudge.text")}
            </FeatureCopy>
            <div
              className="mt-auto rounded-2xl border bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
              aria-hidden="true"
            >
              <p className="text-sm leading-5 font-medium text-[rgba(17,17,17,0.9)] dark:text-neutral-100">
                {t("landing.extension.cards.nudge.title", {
                  defaultValue: "Stay on reddit.com?",
                })}
              </p>
              <p className="text-sm leading-5 text-muted-foreground/80 dark:text-neutral-400">
                {t("landing.extension.cards.nudge.description", {
                  defaultValue:
                    "5 more min costs you ~1 step from this sprint.",
                })}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  className={
                    "will-change-tranform rounded-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                  }
                >
                  {t("landing.extension.cards.nudge.backToWork", {
                    defaultValue: "Back to work",
                  })}
                </Button>
                <Button
                  variant="outline"
                  className={
                    "will-change-tranform rounded-full border border-[rgba(17,17,17,0.05)] text-[rgba(17,17,17,0.9)] hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  }
                >
                  {t("landing.extension.cards.nudge.plusFiveMins", {
                    defaultValue: "+5 mins",
                  })}
                </Button>
              </div>
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={`flex max-h-90 flex-col overflow-hidden rounded-2xl bg-neutral-50 p-6 dark:border dark:border-neutral-800/80 dark:bg-neutral-900/60 ${className}`}
      {...revealUp(delay)}
    >
      {children}
    </motion.div>
  )
}

function FeatureCopy({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        "mb-10 max-w-[317px] text-base leading-6 [text-wrap:pretty] text-muted-foreground/80 dark:text-neutral-400",
        className
      )}
    >
      {children}
    </p>
  )
}

function ExtensionPopupMock() {
  const { t } = useTranslation()

  return (
    <div
      className="flex aspect-[4/3] w-full max-w-sm flex-col justify-between self-center rounded-2xl border border-neutral-800 bg-neutral-950 p-5 font-sans text-white shadow-[0_30px_50px_-20px_rgba(0,0,0,0.5)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_40px_60px_-24px_rgba(0,0,0,0.55)]"
      aria-hidden="true"
    >
      <div>
        <div className="mb-3.5 flex items-center justify-between font-mono text-[10px] tracking-[0.12em] text-white/50 uppercase">
          <span className="inline-flex items-center gap-1.5 font-medium text-primary">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            {t("landing.mock.sprint42", { defaultValue: "Sprint #42" })}
          </span>
          <span>
            0:32:48 {t("landing.mock.left", { defaultValue: "left" })}
          </span>
        </div>

        <div className="text-[15px] font-medium tracking-[-0.02em] text-white">
          {t("landing.mock.taskShort", {
            defaultValue: "Draft launch post for Twitter",
          })}
        </div>

        <div className="my-1.5 font-sans text-4xl leading-none font-light tracking-[-0.045em] text-white tabular-nums sm:text-5xl">
          12:48
        </div>

        <div className="relative mb-3.5 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[62%] rounded-full bg-primary" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 py-0.5 text-[12.5px] text-white/35 line-through decoration-white/20">
            <span className="size-[10px] shrink-0 rounded-full border-[1.5px] border-primary bg-primary" />
            {t("landing.mock.steps.outline", { defaultValue: "Draft outline" })}
          </div>

          <div className="flex items-center gap-2 py-0.5 text-[12.5px] text-white/35 line-through decoration-white/20">
            <span className="size-[10px] shrink-0 rounded-full border-[1.5px] border-primary bg-primary" />
            {t("landing.mock.steps.hook", { defaultValue: "Write hook" })}
          </div>

          <div className="flex items-center gap-2 py-0.5 text-[12.5px] font-medium text-white">
            <span className="size-[10px] shrink-0 animate-pulse rounded-full border-[1.5px] border-primary ring-2 ring-primary/20" />
            {t("landing.mock.steps.statement", {
              defaultValue: "Write value statement",
            })}
          </div>

          <div className="flex items-center gap-2 py-0.5 text-[12.5px] text-white/70">
            <span className="size-[10px] shrink-0 rounded-full border-[1.5px] border-white/25" />
            {t("landing.mock.steps.bridge", { defaultValue: "Add CTA & link" })}
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex gap-1.5 border-t border-white/10 pt-3">
        <button
          tabIndex={-1}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
        >
          {t("landing.mock.actions.addFiveShort", { defaultValue: "+5m" })}
        </button>
        <button
          tabIndex={-1}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
        >
          {t("landing.mock.actions.pause", { defaultValue: "Pause" })}
        </button>
        <button
          tabIndex={-1}
          className="flex-1 rounded-lg border border-primary bg-primary px-3 py-2 text-xs font-semibold text-neutral-950 transition-colors hover:bg-amber-400"
        >
          {t("landing.mock.actions.endSprint", { defaultValue: "End Sprint" })}
        </button>
      </div>
    </div>
  )
}

function PairingCode() {
  const { t } = useTranslation()

  return (
    <div
      className="text mt-auto flex flex-col items-center rounded-2xl border bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
      aria-hidden="true"
    >
      <span className="font-[family-name:var(--font-ibm-mono)] text-[10px] leading-5 tracking-wide text-[rgba(17,17,17,0.5)] uppercase dark:text-neutral-400">
        {t("landing.extension.cards.pairing.confirm", {
          defaultValue: "Confirm pairing code",
        })}
      </span>
      <span className="my-2 text-3xl leading-9 text-[rgba(17,17,17,0.9)] dark:text-neutral-100">
        BR8 -K9F
      </span>
      <span className="font-[family-name:var(--font-ibm-mono)] text-[10px] leading-5 text-[rgba(17,17,17,0.5)] uppercase dark:text-neutral-400">
        {t("landing.extension.cards.pairing.expires", {
          defaultValue: "expires in 2:31",
        })}
      </span>
    </div>
  )
}

function TimerPill() {
  const { t } = useTranslation()

  return (
    <div
      className="mt-auto flex w-fit items-center gap-2 rounded-full bg-[rgba(17,17,17,0.9)] px-1 py-3 text-white dark:border dark:border-neutral-700 dark:bg-neutral-800"
      aria-hidden="true"
    >
      <span className="mx-2 size-2 rounded-full bg-primary"></span>
      <span className="text-sm font-medium tabular-nums">12:48</span>
      <span className="text-sm opacity-60">
        {t("landing.extension.cards.eyeline.timerLabel", {
          defaultValue: "Focus Sprint",
        })}
      </span>
      <span className="mx-2 size-6 rounded-full ring-4 ring-primary"></span>
    </div>
  )
}

function PricingSection() {
  const { t } = useTranslation()

  const PRICING_PLANS = [
    {
      name: t("landing.pricing.plans.free.name"),
      price: t("landing.pricing.plans.free.price"),
      features: t("landing.pricing.plans.free.features", {
        returnObjects: true,
      }) as string[],
    },
    {
      name: t("landing.pricing.plans.plus.name"),
      price: t("landing.pricing.plans.plus.price"),
      features: t("landing.pricing.plans.plus.features", {
        returnObjects: true,
      }) as string[],
    },
    {
      name: t("landing.pricing.plans.pro.name"),
      price: t("landing.pricing.plans.pro.price"),
      features: t("landing.pricing.plans.pro.features", {
        returnObjects: true,
      }) as string[],
    },
  ]

  return (
    <section
      id="pricing"
      className="mx-auto max-w-7xl border-t border-neutral-200/60 px-6 py-24 sm:px-8 md:py-32 dark:border-neutral-800/60"
    >
      {/* Header */}
      <div className="mb-12">
        <motion.h2
          className="text-3xl font-medium tracking-tight text-[rgba(17,17,17,0.9)] sm:text-4xl dark:text-neutral-100"
          {...revealUp(0)}
        >
          {t("landing.pricing.title")}
        </motion.h2>
        <motion.p
          className="mt-2 text-sm text-muted-foreground/80 sm:text-base dark:text-neutral-400"
          {...revealUp(0.04)}
        >
          {t("landing.pricing.subtitle")}
        </motion.p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
        {PRICING_PLANS.map((plan, idx) => (
          <motion.div
            key={plan.name}
            {...revealUp(idx * 0.08)}
            className="flex flex-col rounded-2xl border bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex flex-1 flex-col rounded-xl border bg-white p-5 sm:p-5 dark:border-neutral-800/60 dark:bg-neutral-900/60">
              {/* Plan Header */}
              <div className="mb-5">
                <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-100">
                  {plan.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1 text-3xl tracking-tight text-neutral-900 dark:text-neutral-100">
                  {plan.price}
                  <span className="text-sm font-normal tracking-normal text-neutral-400 dark:text-neutral-400">
                    {t("landing.pricing.perMonth")}
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mb-6">
                <Link href="/app/sign-up" className="w-full">
                  <Button className="w-full rounded-full bg-neutral-900 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
                    {t("landing.pricing.cta")}
                  </Button>
                </Link>
              </div>

              {/* Features List */}
              <ul className="flex flex-col gap-2 text-sm leading-normal text-neutral-600/90 dark:text-neutral-300">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-neutral-800 dark:text-neutral-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="whitespace-pre-line">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function FAQSection() {
  const { t } = useTranslation()

  const FAQ_ITEMS = [
    {
      value: "faq-1",
      question: t("landing.faq.items.faq-1.question"),
      answer: t("landing.faq.items.faq-1.answer"),
    },
    {
      value: "faq-2",
      question: t("landing.faq.items.faq-2.question"),
      answer: t("landing.faq.items.faq-2.answer"),
    },
    {
      value: "faq-3",
      question: t("landing.faq.items.faq-3.question"),
      answer: t("landing.faq.items.faq-3.answer"),
    },
    {
      value: "faq-4",
      question: t("landing.faq.items.faq-4.question"),
      answer: t("landing.faq.items.faq-4.answer"),
    },
    {
      value: "faq-5",
      question: t("landing.faq.items.faq-5.question"),
      answer: t("landing.faq.items.faq-5.answer"),
    },
    {
      value: "faq-6",
      question: t("landing.faq.items.faq-6.question"),
      answer: t("landing.faq.items.faq-6.answer"),
    },
    {
      value: "faq-7",
      question: t("landing.faq.items.faq-7.question"),
      answer: t("landing.faq.items.faq-7.answer"),
    },
  ]

  return (
    <section
      id="faq"
      className="mx-auto max-w-7xl border-t border-neutral-200/60 px-6 py-24 sm:px-8 md:py-32 dark:border-neutral-800/60"
    >
      {/* Header */}
      <div className="mb-16">
        <motion.h2
          className="text-3xl font-medium tracking-tight text-[rgba(17,17,17,0.9)] sm:text-4xl dark:text-neutral-100"
          {...revealUp(0)}
        >
          {t("landing.faq.title")}
        </motion.h2>
        <motion.p
          className="mt-2 text-sm text-muted-foreground/80 sm:text-base dark:text-neutral-400"
          {...revealUp(0.04)}
        >
          {t("landing.faq.subtitle")}
        </motion.p>
      </div>

      {/* Accordion List */}
      <motion.div {...revealUp(0.08)}>
        <Accordion className="mr-auto max-w-4xl border-t border-neutral-200/60 dark:border-neutral-800/60">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem
              key={item.value}
              value={item.value}
              className="border-b border-neutral-200/60 dark:border-neutral-800/60"
            >
              <AccordionTrigger className="py-4 text-sm font-medium text-neutral-800 hover:no-underline sm:text-base dark:text-neutral-200 dark:hover:text-white">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="pr-4 pb-6 text-sm leading-relaxed text-neutral-600/90 sm:text-base dark:text-neutral-400">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  )
}

export function FooterSection() {
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const currentLocale = i18n.language as AppLocale

  const switchLocale = (locale: AppLocale) => {
    setTimeout(() => {
      window.document.cookie = `${I18N_COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`
      router.refresh()
    }, 0)
  }

  const FOOTER_COLUMNS = [
    {
      title: t("landing.footer.columns.features.title"),
      links: [
        { label: t("landing.footer.columns.features.aiAssistant"), href: "#" },
        { label: t("landing.footer.columns.features.sprintMode"), href: "#" },
        {
          label: t("landing.footer.columns.features.browserExtension"),
          href: "#",
        },
      ],
    },
    {
      title: t("landing.footer.columns.resources.title"),
      links: [
        { label: t("landing.footer.columns.resources.blog"), href: "#" },
        {
          label: t("landing.footer.columns.resources.changelog"),
          href: "#",
          external: true,
        },
        {
          label: t("landing.footer.columns.resources.docs"),
          href: "#",
          external: true,
        },
        {
          label: t("landing.footer.columns.resources.community"),
          href: "#",
          external: true,
        },
      ],
    },
    {
      title: t("landing.footer.columns.company.title"),
      links: [
        { label: t("landing.footer.columns.company.about"), href: "#" },
        {
          label: t("landing.footer.columns.company.careers"),
          href: "#",
          external: true,
        },
      ],
    },
    {
      title: t("landing.footer.columns.trust.title"),
      links: [
        {
          label: t("landing.footer.columns.trust.terms"),
          href: "/trust/terms-of-service",
        },
        {
          label: t("landing.footer.columns.trust.privacy"),
          href: "/trust/privacy-policy",
        },
      ],
    },
  ]

  return (
    <footer className="mx-auto max-w-7xl border-t border-neutral-200/60 px-6 py-16 sm:px-8 md:py-24 dark:border-neutral-800/60">
      <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5">
        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <span className="text-sm font-medium text-muted-foreground/60 dark:text-neutral-500">
              {column.title}
            </span>
            <ul className="flex flex-col gap-2.5 text-sm">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-0.5 text-neutral-600 transition-colors hover:text-neutral-900 hover:underline hover:decoration-dotted dark:text-neutral-400 dark:hover:text-neutral-100"
                  >
                    {link.label}
                    {link.external && <span className="text-[10px]">↗</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom Copyright & Socials & Language Switcher */}
      <div className="mt-16 flex flex-col gap-4 border-t border-neutral-200/50 pt-8 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800/50">
        <span className="text-xs text-neutral-400 dark:text-neutral-500">
          {t("landing.footer.copyright")}
        </span>

        {/* Dropdown Language Selector & Theme Toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant={"outline"}
                  size={"sm"}
                  className="h-8 rounded-full text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
                />
              }
            >
              <LanguagesIcon className="mr-1.5 h-3.5 w-3.5" />
              {getLocaleDisplayName(currentLocale)}
              <ChevronDown className="ml-1.5 h-3 w-3 text-neutral-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuGroup>
                {SUPPORTED_LOCALES.map((locale) => (
                  <DropdownMenuItem
                    key={locale}
                    onClick={() => switchLocale(locale)}
                    className="text-xs font-medium"
                  >
                    {getLocaleDisplayName(locale)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  const [showSticky, setShowSticky] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const mainSection = document.getElementById("main-section")
      if (mainSection) {
        const rect = mainSection.getBoundingClientRect()
        // rect.bottom <= 0 means we scrolled past the bottom edge of main-section
        setShowSticky(rect.bottom <= 0)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement instanceof HTMLElement &&
          document.activeElement.isContentEditable)
      ) {
        return
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <StickyHeader showSticky={showSticky} />

      <div className="min-h-dvh p-3">
        <HeroSection />
        <IntroducingSection />
        <ThreeSimpleStepsSection />
        <ExtensionSection />
        <PricingSection />
        <FAQSection />
        <FooterSection />
      </div>
    </MotionConfig>
  )
}
