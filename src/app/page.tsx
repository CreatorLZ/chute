"use client"

import { useCallback, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import {
  AttachmentUpload,
  AvatarUpload,
  ImageUpload,
  InstantUpload,
} from "@/components/upload-presets"
import type { UploadFieldHandle } from "@/components/upload-field"
import type { UploadedFile } from "@/hooks/use-upload-field"

type FormValues = {
  avatar: UploadedFile | null
  attachments: UploadedFile[]
  images: UploadedFile[]
  quickSend: UploadedFile[]
}

export default function Home() {
  const avatarUploadRef = useRef<UploadFieldHandle>(null)
  const attachmentsUploadRef = useRef<UploadFieldHandle>(null)
  const imagesUploadRef = useRef<UploadFieldHandle>(null)
  const [submittedData, setSubmittedData] = useState<FormValues | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { control, handleSubmit, getValues, formState } = useForm<FormValues>({
    defaultValues: {
      avatar: null,
      attachments: [],
      images: [],
      quickSend: [],
    },
  })

  const onValidSubmit = useCallback(async () => {
    setSubmitError(null)

    try {
      await Promise.all([
        avatarUploadRef.current?.uploadAll(),
        attachmentsUploadRef.current?.uploadAll(),
        imagesUploadRef.current?.uploadAll(),
      ])
    } catch {
      setSubmitError("Fix or remove the failed uploads before submitting.")
      return
    }

    const nextData = getValues()
    setSubmittedData(nextData)
    console.log("Form submitted:", nextData)
  }, [getValues])

  const handleFormSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      void handleSubmit(onValidSubmit)(event)
    },
    [handleSubmit, onValidSubmit]
  )

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold">Upload Field v0.5</h1>
        <p className="text-sm text-muted-foreground">
          One UploadThing-powered engine, four ready-to-use presets.
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-10">
        <ExampleSection
          title="AvatarUpload"
          description="Single-image upload for profile and account settings."
        >
          <Controller
            name="avatar"
            control={control}
            render={({ field }) => (
              <AvatarUpload
                ref={avatarUploadRef}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </ExampleSection>

        <ExampleSection
          title="AttachmentUpload"
          description="Manual multi-file upload for forms, admin tools, and CMS workflows."
        >
          <Controller
            name="attachments"
            control={control}
            render={({ field }) => (
              <AttachmentUpload
                ref={attachmentsUploadRef}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </ExampleSection>

        <ExampleSection
          title="ImageUpload"
          description="Image-only upload for galleries, product photos, and media collections."
        >
          <Controller
            name="images"
            control={control}
            render={({ field }) => (
              <ImageUpload
                ref={imagesUploadRef}
                value={field.value}
                onChange={field.onChange}
                maxFiles={6}
              />
            )}
          />
        </ExampleSection>

        <ExampleSection
          title="InstantUpload"
          description="Auto-upload for chat composers, support tickets, and quick-send flows."
        >
          <Controller
            name="quickSend"
            control={control}
            render={({ field }) => (
              <InstantUpload
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </ExampleSection>

        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {formState.isSubmitting ? "Uploading..." : "Submit form"}
        </button>
        {submitError && (
          <p className="text-sm text-destructive" role="alert">
            {submitError}
          </p>
        )}
      </form>

      {submittedData && (
        <section className="mt-10 space-y-3">
          <h2 className="text-sm font-medium">Submitted metadata</h2>
          <pre className="overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
            {JSON.stringify(submittedData, null, 2)}
          </pre>
        </section>
      )}
    </main>
  )
}

function ExampleSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}
