"use client"

import * as React from "react"
import { createPortal } from "react-dom"

interface HeaderPortalContextType {
  leftContainer: HTMLDivElement | null
  rightContainer: HTMLDivElement | null
  setLeftContainer: (el: HTMLDivElement | null) => void
  setRightContainer: (el: HTMLDivElement | null) => void
  hasLeftContent: boolean
  setHasLeftContent: (has: boolean) => void
  hasRightContent: boolean
  setHasRightContent: (has: boolean) => void
  visible: boolean
  setVisible: (v: boolean) => void
}

const HeaderPortalContext = React.createContext<HeaderPortalContextType | undefined>(undefined)

export function HeaderPortalProvider({ children }: { children: React.ReactNode }) {
  const [leftContainer, setLeftContainer] = React.useState<HTMLDivElement | null>(null)
  const [rightContainer, setRightContainer] = React.useState<HTMLDivElement | null>(null)
  const [hasLeftContent, setHasLeftContent] = React.useState(false)
  const [hasRightContent, setHasRightContent] = React.useState(false)
  const [visible, setVisible] = React.useState(true)

  return (
    <HeaderPortalContext.Provider
      value={{
        leftContainer,
        rightContainer,
        setLeftContainer,
        setRightContainer,
        hasLeftContent,
        setHasLeftContent,
        hasRightContent,
        setHasRightContent,
        visible,
        setVisible,
      }}
    >
      {children}
    </HeaderPortalContext.Provider>
  )
}

export function useHeaderContext() {
  const context = React.useContext(HeaderPortalContext)
  if (!context) {
    throw new Error("useHeaderContext must be used within a HeaderPortalProvider")
  }
  return context
}

export function HeaderLeft({ children }: { children: React.ReactNode }) {
  const context = useHeaderContext()
  
  React.useEffect(() => {
    context.setHasLeftContent(true)
    return () => {
      context.setHasLeftContent(false)
    }
  }, [context])

  if (!context.leftContainer) return null
  return createPortal(children, context.leftContainer)
}

export function HeaderRight({ children }: { children: React.ReactNode }) {
  const context = useHeaderContext()

  React.useEffect(() => {
    context.setHasRightContent(true)
    return () => {
      context.setHasRightContent(false)
    }
  }, [context])

  if (!context.rightContainer) return null
  return createPortal(children, context.rightContainer)
}

export function HeaderVisibility({ visible }: { visible: boolean }) {
  const context = useHeaderContext()

  React.useEffect(() => {
    context.setVisible(visible)
    return () => {
      context.setVisible(true)
    }
  }, [visible, context])

  return null
}
