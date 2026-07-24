import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Attachment({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment"
      className={cn(
        "group/attachment flex min-w-0 items-center gap-3 rounded-lg border bg-background p-2.5 text-sm",
        className
      )}
      {...props}
    />
  )
}

function AttachmentMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-media"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function AttachmentContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-content"
      className={cn("min-w-0 flex-1 space-y-1", className)}
      {...props}
    />
  )
}

function AttachmentTitle({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="attachment-title"
      className={cn("truncate font-medium leading-none", className)}
      {...props}
    />
  )
}

function AttachmentDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="attachment-description"
      className={cn("truncate text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function AttachmentActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-actions"
      className={cn("flex shrink-0 items-center gap-1", className)}
      {...props}
    />
  )
}

function AttachmentAction({
  className,
  variant = "ghost",
  size = "xs",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="attachment-action"
      variant={variant}
      size={size}
      className={cn(className)}
      {...props}
    />
  )
}

function AttachmentGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-group"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

export {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
}
