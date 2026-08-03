import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type AppPageShellProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function AppPageShell({
  children,
  className,
  contentClassName,
}: AppPageShellProps) {
  return (
    <main
      className={cn(
        "h-full overflow-y-auto bg-background text-foreground",
        className
      )}
    >
      <section
        className={cn(
          "mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pt-28 pb-16 md:px-8",
          "animate-in duration-200 fill-mode-both fade-in slide-in-from-bottom-1",
          contentClassName
        )}
      >
        {children}
      </section>
    </main>
  )
}
