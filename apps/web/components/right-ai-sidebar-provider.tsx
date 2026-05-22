"use client"

import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { PanelRightCloseIcon } from "lucide-react"
import { RightAiSidebar } from "./right-ai-sidebar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  usePanelRef,
} from "@workspace/ui/components/resizable"

type RightAiSidebarContextProps = {
  isOpen: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  panelRef: ReturnType<typeof usePanelRef>
}

const RightAiSidebarContext =
  React.createContext<RightAiSidebarContextProps | null>(null)

export function useRightAiSidebar() {
  const ctx = React.useContext(RightAiSidebarContext)
  if (!ctx)
    throw new Error(
      "useRightAiSidebar must be used within a RightAiSidebarProvider"
    )
  return ctx
}

export function RightAiSidebarProvider({
  children,
  defaultOpen = false,
}: {
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = React.useState<boolean>(defaultOpen)
  const panelRef = usePanelRef()
  const prevSizeRef = React.useRef<number>(400)

  const setOpen = React.useCallback((open: boolean) => {
    setIsOpen(open)
    if (panelRef.current) {
      if (open) {
        panelRef.current.resize(prevSizeRef.current)
      } else {
        const currentSize = panelRef.current.getSize()
        if (currentSize.inPixels > 15)
          panelRef.current.resize(currentSize.asPercentage)
        panelRef.current.collapse()
      }
    }
  }, [])

  const toggle = React.useCallback(() => {
    setOpen(!isOpen)
  }, [isOpen, setOpen])

  const handleLayoutChange = React.useCallback(() => {
    if (panelRef.current) {
      const isCollapsed = panelRef.current.isCollapsed()
      if (isOpen === isCollapsed) {
        setIsOpen(!isCollapsed)
        if (!isCollapsed) {
          const currentSize = panelRef.current.getSize()
          if (currentSize.inPixels > 15)
            prevSizeRef.current = currentSize.asPercentage
        }
      }
    }
  }, [isOpen])

  return (
    <RightAiSidebarContext.Provider
      value={{ isOpen, setOpen, toggle, panelRef }}
    >
      <ResizablePanelGroup
        className="max-w-screen"
        onLayoutChange={handleLayoutChange}
      >
        <ResizablePanel>{children}</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          panelRef={panelRef}
          defaultSize={defaultOpen ? "30%" : 0}
          minSize={"30%"}
          maxSize={"50%"}
          collapsible
          collapsedSize={0}
        >
          <RightAiSidebar isOpen={isOpen} onOpenChange={setOpen} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </RightAiSidebarContext.Provider>
  )
}

export function RightAiSidebarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggle } = useRightAiSidebar()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle AI sidebar"
      className={`${className} h-7 w-7`}
      onClick={() => toggle()}
      {...props}
    >
      <PanelRightCloseIcon />
      <span className="sr-only">Toggle AI sidebar</span>
    </Button>
  )
}

export default RightAiSidebarProvider
