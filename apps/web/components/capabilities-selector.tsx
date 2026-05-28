// capabilities-selector.tsx
"use client"

import {
  memo,
  useState,
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react"
import { Select as SelectPrimitive } from "radix-ui"
import type { VariantProps } from "class-variance-authority"
import { CheckIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import {
  SelectRoot,
  SelectTrigger,
  SelectContent,
  type SelectItem,
  type selectTriggerVariants,
} from "@/components/select"

export type CapabilityOption = {
  id: string
  name: string
  icon?: ReactNode
  description?: string
  disabled?: boolean
}

type CapabilitiesSelectorContextValue = {
  capabilities: CapabilityOption[]
  value: string | undefined
}

const CapabilitiesSelectorContext =
  createContext<CapabilitiesSelectorContextValue | null>(null)

function useCapabilitiesSelectorContext() {
  const ctx = useContext(CapabilitiesSelectorContext)
  if (!ctx) {
    throw new Error(
      "CapabilitiesSelector sub-components must be used within CapabilitiesSelector.Root"
    )
  }
  return ctx
}

export type CapabilitiesSelectorRootProps = {
  capabilities: CapabilityOption[]
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  children: ReactNode
}

function CapabilitiesSelectorRoot({
  capabilities,
  defaultValue: defaultValueProp,
  children,
  value,
  ...selectProps
}: CapabilitiesSelectorRootProps) {
  const defaultValue = defaultValueProp ?? capabilities[0]?.id
  return (
    <CapabilitiesSelectorContext.Provider value={{ capabilities, value }}>
      <SelectRoot
        {...(defaultValue !== undefined ? { defaultValue } : undefined)}
        {...(value !== undefined ? { value } : undefined)}
        {...selectProps}
      >
        {children}
      </SelectRoot>
    </CapabilitiesSelectorContext.Provider>
  )
}

function CapabilitiesSelectorTrigger({
  className,
  variant,
  size,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof SelectTrigger>) {
  return (
    <SelectTrigger
      data-slot="capabilities-selector-trigger"
      variant={variant}
      size={size}
      className={cn("aui-capabilities-selector-trigger", className)}
      {...props}
    >
      {children ?? <CapabilitiesSelectorValue />}
    </SelectTrigger>
  )
}

function CapabilitiesSelectorValue() {
  const { capabilities, value } = useCapabilitiesSelectorContext()
  const selectedCapability =
    value != null ? capabilities.find((c) => c.id === value) : undefined

  if (!selectedCapability) {
    return <span className="text-muted-foreground">Add capability</span>
  }

  return (
    <span>
      <span className="flex items-center gap-2">
        {selectedCapability.icon && (
          <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">
            {selectedCapability.icon}
          </span>
        )}
        <span className="truncate font-medium">{selectedCapability.name}</span>
      </span>
    </span>
  )
}

function CapabilitiesSelectorContent({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof SelectContent>) {
  const { capabilities } = useCapabilitiesSelectorContext()

  return (
    <SelectContent
      data-slot="capabilities-selector-content"
      className={cn("max-w-80 min-w-60", className)}
      {...props}
    >
      {children ?? [
        <SelectPrimitive.Item
          key="none"
          value="__none__"
          textValue="None"
          className={cn(
            "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 ps-3 pe-9 text-sm outline-none select-none",
            "focus:bg-accent focus:text-accent-foreground",
            "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          )}
        >
          <span className="inset-e-2 absolute flex size-4 items-center justify-center">
            <SelectPrimitive.ItemIndicator>
              <CheckIcon className="size-4" />
            </SelectPrimitive.ItemIndicator>
          </span>
          <SelectPrimitive.ItemText>
            <span className="text-muted-foreground">None</span>
          </SelectPrimitive.ItemText>
        </SelectPrimitive.Item>,
        ...capabilities.map((capability) => (
          <SelectPrimitive.Item
            key={capability.id}
            value={capability.id}
            textValue={capability.name}
            className={cn(
              "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 ps-3 pe-9 text-sm outline-none select-none",
              "focus:bg-accent focus:text-accent-foreground",
              "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            )}
            disabled={capability.disabled}
          >
            <span className="inset-e-2 absolute flex size-4 items-center justify-center">
              <SelectPrimitive.ItemIndicator>
                <CheckIcon className="size-4" />
              </SelectPrimitive.ItemIndicator>
            </span>
            <SelectPrimitive.ItemText className="w-full">
              <span className="flex items-center gap-3 text-sm">
                {capability.icon && (
                  <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">
                    {capability.icon}
                  </span>
                )}
                <div className="flex flex-col items-start">
                  <span className="truncate font-medium">
                    {capability.name}
                  </span>
                  {capability.description && (
                    <span className="w-full truncate text-xs text-muted-foreground">
                      {capability.description}
                    </span>
                  )}
                </div>
              </span>
            </SelectPrimitive.ItemText>
          </SelectPrimitive.Item>
        )),
      ]}
    </SelectContent>
  )
}

const CapabilitiesSelectorImpl = ({
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  defaultValue,
  capabilities,
  variant,
  size,
  contentClassName,
  ...forwardedProps
}: Omit<CapabilitiesSelectorRootProps, "children"> &
  VariantProps<typeof selectTriggerVariants> & {
    contentClassName?: string
  }) => {
  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = useState(
    () => defaultValue ?? "__none__"
  )

  const value = isControlled ? controlledValue : internalValue
  const onValueChange = controlledOnValueChange ?? setInternalValue

  return (
    <CapabilitiesSelectorRoot
      capabilities={capabilities}
      value={value === "__none__" ? undefined : value}
      onValueChange={(newValue) =>
        onValueChange(newValue === undefined ? "__none__" : newValue)
      }
      {...forwardedProps}
    >
      <CapabilitiesSelectorTrigger
        variant={variant}
        size={size}
        className="rounded-full border border-border"
      />
      <CapabilitiesSelectorContent className={contentClassName} />
    </CapabilitiesSelectorRoot>
  )
}

type CapabilitiesSelectorComponent = typeof CapabilitiesSelectorImpl & {
  displayName?: string
  Root: typeof CapabilitiesSelectorRoot
  Trigger: typeof CapabilitiesSelectorTrigger
  Content: typeof CapabilitiesSelectorContent
  Value: typeof CapabilitiesSelectorValue
}

const CapabilitiesSelector = memo(
  CapabilitiesSelectorImpl
) as unknown as CapabilitiesSelectorComponent

CapabilitiesSelector.displayName = "CapabilitiesSelector"
CapabilitiesSelector.Root = CapabilitiesSelectorRoot
CapabilitiesSelector.Trigger = CapabilitiesSelectorTrigger
CapabilitiesSelector.Content = CapabilitiesSelectorContent
CapabilitiesSelector.Value = CapabilitiesSelectorValue

export {
  CapabilitiesSelector,
  CapabilitiesSelectorRoot,
  CapabilitiesSelectorTrigger,
  CapabilitiesSelectorContent,
  CapabilitiesSelectorValue,
}
