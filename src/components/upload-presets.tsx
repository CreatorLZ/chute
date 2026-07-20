"use client"

import { forwardRef } from "react"
import { Button } from "@/components/ui/button"
import {
  UploadField,
  type MultiUploadFieldProps,
  type SingleUploadFieldProps,
  type UploadedFileActions,
  type UploadFieldHandle,
} from "@/components/upload-field"
import type { UploadedFile } from "@/hooks/use-upload-field"
import { cn } from "@/lib/utils"

type AvatarUploadProps = Omit<
  SingleUploadFieldProps,
  "endpoint" | "accept" | "multiple" | "maxFiles" | "renderUploadedFile"
> & {
  endpoint?: SingleUploadFieldProps["endpoint"]
  className?: string
}

export const AvatarUpload = forwardRef<UploadFieldHandle, AvatarUploadProps>(
  function AvatarUpload({
    endpoint = "avatarUploader",
    className,
    browseLabel = "Drop an avatar here, or click to choose",
    uploadLabel = "Upload avatar",
    queuedLabel = "Avatar ready",
    classNames,
    ...props
  }, ref) {
    return (
      <UploadField
        ref={ref}
        endpoint={endpoint}
        accept={["image/*"]}
        maxFiles={1}
        browseLabel={browseLabel}
        uploadLabel={uploadLabel}
        queuedLabel={queuedLabel}
        classNames={{
          ...classNames,
          root: cn(className, classNames?.root),
          dropzone: cn("mx-auto max-w-sm", classNames?.dropzone),
        }}
        renderUploadedFile={(file, actions) => (
          <AvatarUploadedFile file={file} actions={actions} />
        )}
        {...props}
      />
    )
  }
)

type AttachmentUploadProps = Omit<
  MultiUploadFieldProps,
  "endpoint" | "multiple" | "uploadMode"
> & {
  endpoint?: MultiUploadFieldProps["endpoint"]
}

export const AttachmentUpload = forwardRef<UploadFieldHandle, AttachmentUploadProps>(
  function AttachmentUpload({
    endpoint = "attachmentUploader",
    maxFiles = 5,
    accept = ["image/*", "application/pdf", "text/plain"],
    uploadLabel = "Upload attachments",
    queuedLabel = "Attachments ready",
    ...props
  }, ref) {
    return (
      <UploadField
        ref={ref}
        endpoint={endpoint}
        multiple
        maxFiles={maxFiles}
        accept={accept}
        uploadMode="manual"
        uploadLabel={uploadLabel}
        queuedLabel={queuedLabel}
        {...props}
      />
    )
  }
)

type InstantUploadProps = Omit<
  MultiUploadFieldProps,
  "endpoint" | "multiple" | "uploadMode"
> & {
  endpoint?: MultiUploadFieldProps["endpoint"]
}

export const InstantUpload = forwardRef<UploadFieldHandle, InstantUploadProps>(
  function InstantUpload({
    endpoint = "attachmentUploader",
    maxFiles = 3,
    accept = ["image/*", "application/pdf"],
    browseLabel = "Attach files",
    queuedLabel = "Uploading",
    ...props
  }, ref) {
    return (
      <UploadField
        ref={ref}
        endpoint={endpoint}
        multiple
        maxFiles={maxFiles}
        accept={accept}
        uploadMode="auto"
        browseLabel={browseLabel}
        queuedLabel={queuedLabel}
        classNames={{
          ...props.classNames,
          dropzone: cn("py-0", props.classNames?.dropzone),
        }}
        {...props}
      />
    )
  }
)

type ImageUploadProps = Omit<
  MultiUploadFieldProps,
  "endpoint" | "multiple" | "accept" | "renderUploadedFile"
> & {
  endpoint?: MultiUploadFieldProps["endpoint"]
}

export const ImageUpload = forwardRef<UploadFieldHandle, ImageUploadProps>(
  function ImageUpload({
    endpoint = "imageUploader",
    maxFiles = 10,
    browseLabel = "Drop images here, or click to choose",
    uploadLabel = "Upload images",
    queuedLabel = "Images ready",
    classNames,
    ...props
  }, ref) {
    return (
      <UploadField
        ref={ref}
        endpoint={endpoint}
        multiple
        maxFiles={maxFiles}
        accept={["image/*"]}
        browseLabel={browseLabel}
        uploadLabel={uploadLabel}
        queuedLabel={queuedLabel}
        classNames={classNames}
        renderUploadedFile={(file, actions) => (
          <ImageUploadedFile file={file} actions={actions} />
        )}
        {...props}
      />
    )
  }
)

function AvatarUploadedFile({
  file,
  actions,
}: {
  file: UploadedFile
  actions: UploadedFileActions
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={file.url}
        alt=""
        className="size-14 rounded-full border object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">Avatar uploaded</p>
      </div>
      <Button type="button" variant="ghost" size="xs" onClick={actions.remove}>
        Replace
      </Button>
    </div>
  )
}

function ImageUploadedFile({
  file,
  actions,
}: {
  file: UploadedFile
  actions: UploadedFileActions
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={file.url}
        alt=""
        className="aspect-square w-full object-cover"
      />
      <div className="flex items-center justify-between gap-2 p-2">
        <p className="truncate text-xs font-medium">{file.name}</p>
        <Button type="button" variant="ghost" size="xs" onClick={actions.remove}>
          Remove
        </Button>
      </div>
    </div>
  )
}
