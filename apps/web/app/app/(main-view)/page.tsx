"use client"

import { Button } from "@workspace/ui/components/button"
import { ArrowUpIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { createDbChat } from "@/lib/chat/db-chat-client"
import { savePendingAskPrompt } from "@/lib/chat/pending-ask-prompt"
import { buildAskHref } from "@/lib/routing/ask-url"

export default function Page() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [isSubmittingPrompt, setIsSubmittingPrompt] = useState(false)

  const handleSubmitPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextPrompt = prompt.trim()
    if (!nextPrompt || isSubmittingPrompt) {
      return
    }

    setIsSubmittingPrompt(true)

    try {
      const chat = await createDbChat()
      savePendingAskPrompt(chat.id, nextPrompt)
      router.push(buildAskHref({ chatSessionId: chat.id }))
    } catch (error) {
      setIsSubmittingPrompt(false)
      throw error
    }
  }

  return (
    <main className="flex h-full flex-col bg-background text-foreground">
      <section className="mx-auto my-auto flex w-full max-w-2xl flex-col justify-center px-4 py-10 md:py-20">
        <div className="mb-5 px-1 text-center">
          <h1 className="text-2xl font-medium tracking-tight">
            What do you need to get done?
          </h1>
        </div>

        <form
          className="relative flex w-full flex-col"
          onSubmit={handleSubmitPrompt}
        >
          <div className="flex w-full flex-col gap-2 rounded-2xl border bg-background p-2.5 transition-shadow focus-within:border-ring/75 focus-within:ring-2 focus-within:ring-ring/20">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="What do you need to get done?"
              className="max-h-32 min-h-10 w-full resize-none bg-transparent px-1.75 py-1 text-sm outline-none placeholder:text-muted-foreground/80"
              rows={1}
              aria-label="Message input"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  event.currentTarget.form?.requestSubmit()
                }
              }}
            />
            <div className="relative flex items-center justify-end">
              <Button
                type="submit"
                variant="default"
                size="icon-sm"
                aria-label="Send message"
                disabled={isSubmittingPrompt || prompt.trim().length === 0}
              >
                <ArrowUpIcon />
              </Button>
            </div>
          </div>
        </form>
      </section>
    </main>
  )
}
