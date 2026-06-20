"use client"

import * as React from "react"
import { createPortal } from "react-dom"

interface RightSidebarContextType {
  container: HTMLDivElement | null
  setContainer: (el: HTMLDivElement | null) => void
  hasContent: boolean
  setHasContent: (has: boolean) => void
  width: string
  setWidth: (w: string) => void
}

const RightSidebarContext = React.createContext<RightSidebarContextType | undefined>(undefined)

export function RightSidebarPortalProvider({ children }: { children: React.ReactNode }) {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null)
  const [hasContent, setHasContent] = React.useState(false)
  const [width, setWidth] = React.useState("400px")

  return (
    <RightSidebarContext.Provider
      value={{
        container,
        setContainer,
        hasContent,
        setHasContent,
        width,
        setWidth,
      }}
    >
      {children}
    </RightSidebarContext.Provider>
  )
}

export function useRightSidebarContext() {
  const context = React.useContext(RightSidebarContext)
  if (!context) {
    throw new Error("useRightSidebarContext must be used within a RightSidebarPortalProvider")
  }
  return context
}

export function RightSidebarContent({
  children,
  width = "400px",
}: {
  children: React.ReactNode
  width?: string
}) {
  const context = useRightSidebarContext()

  React.useEffect(() => {
    context.setHasContent(true)
    context.setWidth(width)
    return () => {
      context.setHasContent(false)
    }
  }, [context, width])

  if (!context.container) return null
  return createPortal(children, context.container)
}
