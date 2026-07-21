"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowUp } from "lucide-react"

export function HeroInput() {
  const router = useRouter()
  const [isFocused, setIsFocused] = useState(false)

  function handleSend() {
    router.push("/app/sign-in")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const content = (
    <div className="relative overflow-hidden rounded-2xl border bg-card">
      <textarea
        className="w-full resize-none bg-transparent px-5 pt-5 pb-12 text-sm text-foreground placeholder:text-black/50 focus:outline-none"
        placeholder="Mình giúp được gì cho bạn?"
        rows={3}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        onClick={handleSend}
        className="absolute right-2.5 bottom-2.5 rounded-full bg-[#f9b314] p-2 transition-colors hover:bg-[#e8a510] active:scale-[0.96] transition-transform"
      >
        <ArrowUp className="h-6 w-6 text-black" />
      </button>
    </div>
  )

  return content
}