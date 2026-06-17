"use client"

import { type PropsWithChildren, useEffect, useState, type FC } from "react"
import { XIcon, PlusIcon, FileText } from "lucide-react"
import {
  AttachmentPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useAuiState,
  useAui,
} from "@assistant-ui/react"
import { useShallow } from "zustand/shallow"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/avatar"
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button"
import { cn } from "@/lib/utils"

const isImageContentType = (contentType: string | undefined) =>
  contentType?.startsWith("image/") ?? false

const isTextContentType = (contentType: string | undefined) =>
  contentType?.startsWith("text/") ||
  contentType === "application/json" ||
  contentType === "application/xml" ||
  contentType === "application/javascript"

const decodeDataUrlText = (data: string) => {
  const match = data.match(/^data:([^;,]+)?(;base64)?,(.*)$/)
  if (!match) return undefined

  const payload = match[3]
  if (!payload) return undefined

  try {
    return match[2]
      ? decodeURIComponent(
          Array.from(
            atob(payload),
            (char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`
          ).join("")
        )
      : decodeURIComponent(payload)
  } catch {
    return undefined
  }
}

const useFileSrc = (file: File | undefined, enabled: boolean) => {
  const [src, setSrc] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!file || !enabled) {
      setSrc(undefined)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setSrc(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [enabled, file])

  return src
}

const useFileText = (file: File | undefined, enabled: boolean) => {
  const [text, setText] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    if (!file || !enabled) {
      setText(undefined)
      return
    }

    file
      .text()
      .then((value) => {
        if (!cancelled) setText(value)
      })
      .catch(() => {
        if (!cancelled) setText(undefined)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, file])

  return text
}

type AttachmentPreviewState = {
  file?: File
  contentType?: string
  src?: string
  text?: string
}

const useAttachmentPreview = () => {
  const { file, contentType, src, text } = useAuiState(
    useShallow((s): AttachmentPreviewState => {
      if (s.attachment.file) {
        return {
          file: s.attachment.file,
          contentType: s.attachment.contentType,
        }
      }

      const imageContent = s.attachment.content?.find((c) => c.type === "image")
      if (imageContent?.image) {
        return { src: imageContent.image }
      }

      const textContent = s.attachment.content?.find((c) => c.type === "text")
      if (textContent?.text) {
        return { text: textContent.text }
      }

      const fileContent = s.attachment.content?.find((c) => c.type === "file")
      if (fileContent?.data) {
        const contentType = fileContent.mimeType

        if (isImageContentType(contentType)) {
          return { src: fileContent.data, contentType }
        }

        if (isTextContentType(contentType)) {
          return {
            text: decodeDataUrlText(fileContent.data),
            contentType,
          }
        }
      }

      return {}
    })
  )

  const fileSrc = useFileSrc(file, isImageContentType(contentType))
  const fileText = useFileText(file, isTextContentType(contentType))

  return { src: fileSrc ?? src, text: fileText ?? text }
}

type AttachmentPreviewProps = {
  src?: string
  text?: string
}

const AttachmentPreview: FC<AttachmentPreviewProps> = ({ src, text }) => {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(false)
  }, [src])

  if (text) {
    return (
      <pre className="aui-attachment-preview-text break-word max-h-[80vh] w-full overflow-y-auto rounded bg-muted p-4 font-mono text-sm whitespace-pre-wrap">
        {text}
      </pre>
    )
  }

  return (
    <img
      src={src}
      alt="Attachment preview"
      className={cn(
        "block h-auto max-h-[80vh] w-auto max-w-full rounded-md object-contain",
        isLoaded
          ? "aui-attachment-preview-image-loaded"
          : "aui-attachment-preview-image-loading invisible"
      )}
      onLoad={() => setIsLoaded(true)}
    />
  )
}

const AttachmentPreviewDialog: FC<PropsWithChildren> = ({ children }) => {
  const { src, text } = useAttachmentPreview()

  if (!src && !text) return children

  return (
    <Dialog>
      <DialogTrigger className="aui-attachment-preview-trigger flex cursor-pointer rounded-xl transition-colors hover:bg-accent/50">
        {children}
      </DialogTrigger>

      <DialogContent className="aui-attachment-preview-dialog-content p-2 sm:max-w-4xl [&_svg]:text-background [&>button]:rounded-full [&>button]:bg-foreground/60 [&>button]:p-1 [&>button]:opacity-100 [&>button]:ring-0! [&>button]:hover:[&_svg]:text-destructive">
        <DialogTitle className="aui-sr-only sr-only">
          Attachment Preview
        </DialogTitle>
        <div className="aui-attachment-preview relative mx-auto flex max-h-[80dvh] w-full items-center justify-center overflow-hidden bg-background">
          <AttachmentPreview src={src} text={text} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

const AttachmentThumb: FC = () => {
  const { src } = useAttachmentPreview()

  return (
    <Avatar className="aui-attachment-tile-avatar h-full w-full rounded-none">
      <AvatarImage
        src={src}
        alt="Attachment preview"
        className="aui-attachment-tile-image object-cover"
      />
      <AvatarFallback>
        <FileText className="aui-attachment-tile-fallback-icon size-8 text-muted-foreground" />
      </AvatarFallback>
    </Avatar>
  )
}

const AttachmentUI: FC = () => {
  const aui = useAui()
  const isComposer = aui.attachment.source !== "message"

  const isImage = useAuiState((s) => s.attachment.type === "image")
  const typeLabel = useAuiState((s) => {
    const type = s.attachment.type
    switch (type) {
      case "image":
        return "Image"
      case "document":
        return "Document"
      case "file":
        return "File"
      default:
        return type
    }
  })

  return (
    <Tooltip>
      <AttachmentPrimitive.Root
        className={cn(
          "aui-attachment-root relative",
          isImage && "aui-attachment-root-composer"
        )}
      >
        <AttachmentPreviewDialog>
          <TooltipTrigger
            render={
              <div
                className="aui-attachment-tile size-16 cursor-pointer overflow-hidden rounded-[calc(var(--composer-radius)-var(--composer-padding))] border bg-muted transition-opacity hover:opacity-75"
                role="button"
                tabIndex={0}
                aria-label={`${typeLabel} attachment`}
              >
                <AttachmentThumb />
              </div>
            }
          />
        </AttachmentPreviewDialog>
        {isComposer && <AttachmentRemove />}
      </AttachmentPrimitive.Root>
      <TooltipContent side="top">
        <AttachmentPrimitive.Name />
      </TooltipContent>
    </Tooltip>
  )
}

const AttachmentRemove: FC = () => {
  return (
    <AttachmentPrimitive.Remove asChild>
      <TooltipIconButton
        tooltip="Remove file"
        className="aui-attachment-tile-remove inset-e-1.5 absolute top-1.5 size-3.5 rounded-full bg-white text-muted-foreground opacity-100 shadow-sm hover:bg-white! [&_svg]:text-black hover:[&_svg]:text-destructive"
        side="top"
      >
        <XIcon className="aui-attachment-remove-icon size-3 dark:stroke-[2.5px]" />
      </TooltipIconButton>
    </AttachmentPrimitive.Remove>
  )
}

export const UserMessageAttachments: FC = () => {
  return (
    <div className="aui-user-message-attachments-end col-span-full col-start-1 row-start-1 flex w-full flex-row justify-end gap-2">
      <MessagePrimitive.Attachments>
        {() => <AttachmentUI />}
      </MessagePrimitive.Attachments>
    </div>
  )
}

export const ComposerAttachments: FC = () => {
  return (
    <div className="aui-composer-attachments flex w-full flex-row items-center gap-2 overflow-x-auto empty:hidden">
      <ComposerPrimitive.Attachments>
        {() => <AttachmentUI />}
      </ComposerPrimitive.Attachments>
    </div>
  )
}

export const ComposerAddAttachment: FC = () => {
  return (
    <ComposerPrimitive.AddAttachment asChild>
      <TooltipIconButton
        tooltip="Add Attachment"
        side="bottom"
        variant="ghost"
        size="icon"
        className="aui-composer-add-attachment size-8 border border-border p-1 text-xs font-semibold hover:bg-accent dark:hover:bg-accent"
        aria-label="Add Attachment"
      >
        <PlusIcon className="aui-attachment-add-icon size-5 stroke-[1.5px]" />
      </TooltipIconButton>
    </ComposerPrimitive.AddAttachment>
  )
}
