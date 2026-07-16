"use client"

import React from "react"
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence } from "framer-motion"
import AmbientPixelCard from "./AmbientPixelCard"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@workspace/ui/components/dialog"

interface GuideIllustrationProps {
  step: number
}

function GuideIllustration({ step }: GuideIllustrationProps) {
  return (
    <div className="relative -mx-6 -mt-6 mb-6 flex h-52 flex-col items-center justify-center overflow-hidden border-b border-border/40 bg-muted/40 select-none dark:bg-muted/10">
      {/* Ambient background glow */}
      <div className="bg-radial-gradient pointer-events-none absolute inset-0 from-primary/10 via-transparent to-transparent opacity-60" />

      {/* Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.025)_1px,transparent_1px)] bg-[size:16px_16px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)]" />

      <div className="relative z-10 flex items-center justify-center">
        {step === 0 && (
          <div className="relative flex items-center justify-center">
            <div className="absolute h-24 w-24 animate-ping rounded-full border border-primary/20 opacity-25" />
            <div className="absolute h-18 w-18 rounded-full border border-primary/30 opacity-55" />
            <svg
              className="h-12 w-12 text-[#f9b314]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              <circle cx="12" cy="16" r="1.5" fill="currentColor" />
            </svg>
          </div>
        )}
        {step === 1 && (
          <div className="relative flex items-center justify-center">
            <svg
              className="h-12 w-12 text-[#f9b314]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
        )}
        {step === 2 && (
          <div className="relative flex items-center justify-center">
            <svg
              className="h-12 w-12 text-[#f9b314]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 4V2" />
              <path d="M15 16v-2" />
              <path d="M8 9h2" />
              <path d="M20 9h-2" />
              <path d="M17.8 11.8L19 13" />
              <path d="M12.2 6.2L11 5" />
              <path d="M17.8 6.2L19 5" />
              <path d="M12.2 11.8L11 13" />
              <path d="M15 9l-9.7 9.7a1 1 0 0 1-1.4 0l-1.4-1.4a1 1 0 0 1 0-1.4L12.2 6.2" />
            </svg>
          </div>
        )}
        {step === 3 && (
          <div className="relative flex items-center justify-center">
            <svg
              className="h-12 w-12 text-[#f9b314]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
        )}
        {step === 4 && (
          <div className="relative flex items-center justify-center">
            <svg
              className="h-12 w-12 text-[#f9b314]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
              <path d="M12 2v2" />
            </svg>
          </div>
        )}
        {step === 5 && (
          <div className="relative flex items-center justify-center">
            <svg
              className="h-12 w-12 text-[#f9b314]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 20V10" />
              <path d="M12 20V4" />
              <path d="M6 20v-6" />
              <path d="M3 20h18" />
            </svg>
          </div>
        )}
        {step === 6 && (
          <div className="relative flex items-center justify-center">
            <svg
              className="h-12 w-12 text-[#f9b314]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}

export function GettingStartedGuide() {
  const { t } = useTranslation()
  const [isGuideOpen, setIsGuideOpen] = React.useState(false)
  const [guideStep, setGuideStep] = React.useState(0)

  const handleGuideOpenChange = (open: boolean) => {
    setIsGuideOpen(open)
    if (open) {
      setGuideStep(0)
    }
  }

  return (
    <AmbientPixelCard
      className="mb-2 flex w-full flex-col items-start rounded-xl border border-border/70 bg-card bg-gradient-to-r from-primary/0 to-primary/10 text-left shadow-xs"
      colors="#FFBB26"
      speed={50}
    >
      <div className="relative z-10 flex w-full flex-col gap-1 p-3 text-left dark:bg-card/60">
        <div className="flex items-center gap-1 text-sm text-foreground">
          <span>
            {t("app.guide.cardTitle", { defaultValue: "Getting Started" })}
          </span>
        </div>
        <div className="text-xs font-normal text-muted-foreground">
          <span>
            {t("app.guide.cardDescription", {
              defaultValue:
                "Learn how LockIn turns overwhelming tasks into actionable Sprint plans.",
            })}
          </span>
        </div>
        <Dialog open={isGuideOpen} onOpenChange={handleGuideOpenChange}>
          <DialogTrigger
            render={
              <Button className="mt-1 w-fit" size={"xs"} variant={"outline"}>
                {t("app.guide.viewGuide", { defaultValue: "View Guide" })}
              </Button>
            }
          />
          <DialogContent
            className="flex flex-col overflow-hidden lg:min-h-135 lg:min-w-170"
            showCloseButton={false}
          >
            {/* Visually Hidden Title and Description for Screen Readers */}
            <div className="sr-only">
              <DialogTitle>
                {t("app.guide.dialogTitle", {
                  defaultValue: "Getting Started with LockIn",
                })}
              </DialogTitle>
              <DialogDescription>
                {t("app.guide.dialogDescription", {
                  defaultValue:
                    "A step-by-step guide to get started with LockIn.",
                })}
              </DialogDescription>
            </div>

            {/* Animated Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={guideStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                className="flex flex-1 flex-col justify-between"
              >
                <div className="flex flex-1 flex-col">
                  {/* Step Illustration */}
                  <GuideIllustration step={guideStep} />

                  {/* Step Content Text */}
                  {guideStep === 0 && (
                    <div className="min-h-32">
                      <h3 className="text-lg font-medium tracking-tight text-balance">
                        {t("app.guide.steps.0.title", {
                          defaultValue: "Welcome to LockIn",
                        })}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">
                        {t("app.guide.steps.0.body1", {
                          defaultValue:
                            "Most productivity apps help you organize your work. LockIn helps you actually start it.",
                        })}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                        {t("app.guide.steps.0.body2", {
                          defaultValue:
                            "Large, vague tasks often lead to procrastination because they are difficult to begin. LockIn helps you turn overwhelming work into clear, actionable steps.",
                        })}
                      </p>
                    </div>
                  )}

                  {guideStep === 1 && (
                    <div className="min-h-32">
                      <h3 className="text-lg font-medium tracking-tight text-balance">
                        {t("app.guide.steps.1.title", {
                          defaultValue: "Start with any task",
                        })}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">
                        {t("app.guide.steps.1.body1", {
                          defaultValue:
                            "Just describe what you need to get done in your own words.",
                        })}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                        {t("app.guide.steps.1.body2", {
                          defaultValue:
                            "LockIn is designed to handle messy, overwhelming tasks.",
                        })}
                      </p>
                    </div>
                  )}

                  {guideStep === 2 && (
                    <div className="min-h-32">
                      <h3 className="text-lg font-medium tracking-tight text-balance">
                        {t("app.guide.steps.2.title", {
                          defaultValue: "Let AI create the first draft",
                        })}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">
                        {t("app.guide.steps.2.body1", {
                          defaultValue:
                            "Instead of figuring out where to start, let LockIn generate a plan for you.",
                        })}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                        {t("app.guide.steps.2.body2", {
                          defaultValue:
                            "The AI breaks large tasks into smaller steps and estimates how long each step may take.",
                        })}
                      </p>
                    </div>
                  )}

                  {guideStep === 3 && (
                    <div className="min-h-32">
                      <h3 className="text-lg font-medium tracking-tight text-balance">
                        {t("app.guide.steps.3.title", {
                          defaultValue: "Review before you commit",
                        })}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">
                        {t("app.guide.steps.3.body1", {
                          defaultValue:
                            "AI suggestions are only a starting point.",
                        })}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                        {t("app.guide.steps.3.body2", {
                          defaultValue:
                            "Before beginning, you can edit steps, adjust their time estimates, reorder, and add your own steps.",
                        })}
                      </p>
                    </div>
                  )}

                  {guideStep === 4 && (
                    <div className="min-h-32">
                      <h3 className="text-lg font-medium tracking-tight text-balance">
                        {t("app.guide.steps.4.title", {
                          defaultValue: "Enter Sprint Mode",
                        })}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">
                        {t("app.guide.steps.4.body1", {
                          defaultValue: "When you are ready, start a Sprint.",
                        })}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                        {t("app.guide.steps.4.body2", {
                          defaultValue:
                            "Sprint Mode removes distractions and focuses your attention on one step at a time.",
                        })}
                      </p>
                    </div>
                  )}

                  {guideStep === 5 && (
                    <div className="min-h-32">
                      <h3 className="text-lg font-medium tracking-tight text-balance">
                        {t("app.guide.steps.5.title", {
                          defaultValue: "Progress is built one step at a time",
                        })}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">
                        {t("app.guide.steps.5.body1", {
                          defaultValue:
                            "You do not need to finish everything today. Each completed Sprint moves the project forward.",
                        })}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                        {t("app.guide.steps.5.body2", {
                          defaultValue:
                            "When a Sprint ends, LockIn summarizes your progress and helps you decide what to do next.",
                        })}
                      </p>
                    </div>
                  )}

                  {guideStep === 6 && (
                    <div className="min-h-32">
                      <h3 className="text-lg font-medium tracking-tight text-balance">
                        {t("app.guide.steps.6.title", {
                          defaultValue: "Ready to start?",
                        })}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">
                        {t("app.guide.steps.6.body1", {
                          defaultValue:
                            "Think of something you have been putting off.",
                        })}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                        {t("app.guide.steps.6.body2", {
                          defaultValue:
                            "LockIn will help you turn it into a plan you can actually begin.",
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer buttons and indicators */}
                {guideStep === 0 ? (
                  <Button
                    onClick={() => setGuideStep(1)}
                    className="mt-auto w-fit self-end"
                  >
                    {t("app.guide.getStarted", { defaultValue: "Get started" })}
                  </Button>
                ) : (
                  <div className="mt-auto flex w-full items-center justify-between border-t border-border/40 pt-4">
                    <span className="text-xs text-muted-foreground select-none">
                      {t("app.guide.stepCounter", {
                        step: guideStep,
                        total: 6,
                        defaultValue: `Step ${guideStep} of 6`,
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setGuideStep((prev) => prev - 1)}
                        variant="ghost"
                        size="sm"
                      >
                        {t("app.aiTools.back", { defaultValue: "Back" })}
                      </Button>
                      {guideStep < 6 ? (
                        <Button
                          onClick={() => setGuideStep((prev) => prev + 1)}
                          size="sm"
                        >
                          {t("app.aiTools.next", { defaultValue: "Next" })}
                        </Button>
                      ) : (
                        <DialogClose render={<Button size="sm" />}>
                          {t("app.guide.start", { defaultValue: "Start" })}
                        </DialogClose>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </div>
    </AmbientPixelCard>
  )
}
