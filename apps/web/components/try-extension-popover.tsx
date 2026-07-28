"use client"

import type React from "react"
import { useTranslation } from "react-i18next"
import { ExternalLinkIcon, PuzzleIcon, ShieldCheckIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { SidebarMenuButton } from "@workspace/ui/components/sidebar"
import { LOCKIN_EXTENSION_STORE_URL } from "@/lib/focus/extension-bridge"

export function TryExtensionPopover({
  trigger,
}: {
  trigger?: React.ReactElement
}) {
  const { t } = useTranslation()

  return (
    <Dialog>
      <DialogTrigger
        render={
          trigger ?? (
            <SidebarMenuButton>
            <PuzzleIcon data-icon="inline-start" />
            {t("app.extension.try", { defaultValue: "Try Extension" })}
            </SidebarMenuButton>
          )
        }
      />
      <DialogContent className="max-h-[min(820px,calc(100vh-2rem))] overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="gap-2 px-5 pt-5">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <ShieldCheckIcon className="size-4" />
            </span>
            <div>
              <DialogTitle>
                {t("app.extension.tryTitle", {
                  defaultValue: "LockIn Chrome Extension",
                })}
              </DialogTitle>
              <DialogDescription>
                {t("app.extension.tryDescription", {
                  defaultValue:
                    "Bring your sprint timer, tab guard, and blocked-site reminders into the browser.",
                })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto px-5 pb-2">
          <figure className="overflow-hidden rounded-lg border bg-muted/30">
            <img
              src="/extension/2.png"
              alt="LockIn extension preview"
              className="h-auto max-h-[min(460px,52vh)] w-full object-contain"
            />
          </figure>
          <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
            <p>
              {t("app.extension.pitchOne", {
                defaultValue:
                  "Keep your sprint visible while you browse, without returning to the app.",
              })}
            </p>
            <p>
              {t("app.extension.pitchTwo", {
                defaultValue:
                  "LockIn can remind you when you drift, redirect hard-blocked sites, and sync task progress back to Focus.",
              })}
            </p>
            <p>
              {t("app.extension.pitchThree", {
                defaultValue:
                  "Install it once, connect your account, then start sprints from the web app.",
              })}
            </p>
          </div>
        </div>

        <DialogFooter className="border-t px-5 py-4">
          <Button
            nativeButton={false}
            render={
              <a
                href={LOCKIN_EXTENSION_STORE_URL}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <ExternalLinkIcon data-icon="inline-start" />
            {t("app.extension.openStore", {
              defaultValue: "Open Chrome Store",
            })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
