"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

export function PublishPlanAsTemplateDialog({ planId }: { planId: string }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/templates/from-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? "Khong the tao template.")
      }

      setOpen(false)
      router.push(`/app/templates/editor/${data.template.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Dang lam template
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tao template tu plan hien tai?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            LockIn se flatten subtasks, bo personal progress, va tao mot draft de ban chinh sua truoc khi gui duyet.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Huy
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
              Tao draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
