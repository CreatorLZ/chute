import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

const f = createUploadthing()

// Chute intentionally fails closed until this is wired to the host app's auth.
// An UploadThing token identifies this application to UploadThing; it does not
// identify or authorize the person making an upload.
async function getUploadUser(): Promise<{ uploadedBy: string }> {
  throw new UploadThingError(
    "Unauthorized: replace getUploadUser() with your application's auth lookup."
  )
}

// Production example:
//   import { auth } from "@/lib/auth"
//   const session = await auth()
//   if (!session?.user) throw new UploadThingError("Unauthorized")
//   return { uploadedBy: session.user.id }

export const ourFileRouter = {
  avatarUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      return getUploadUser()
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.uploadedBy }
    }),

  imageUploader: f({ image: { maxFileSize: "16MB", maxFileCount: 10 } })
    .middleware(async () => {
      return getUploadUser()
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.uploadedBy }
    }),

  attachmentUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 5 },
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    text: { maxFileSize: "4MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      return getUploadUser()
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.uploadedBy }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
