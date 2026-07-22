import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

const f = createUploadthing()

async function getUploadUser(): Promise<{ uploadedBy: string }> {
  throw new UploadThingError(
    "Unauthorized: replace getUploadUser() with your application's auth lookup."
  )
}

const sharedMiddleware = async () => getUploadUser()

// Production example:
//   import { auth } from "@/lib/auth"
//   const session = await auth()
//   if (!session?.user) throw new UploadThingError("Unauthorized")
//   return { uploadedBy: session.user.id }

const handleUploadComplete = async ({
  metadata,
}: {
  metadata: { uploadedBy: string }
}) => ({ uploadedBy: metadata.uploadedBy })

export const ourFileRouter = {
  avatarUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(sharedMiddleware)
    .onUploadComplete(handleUploadComplete),

  imageUploader: f({ image: { maxFileSize: "16MB", maxFileCount: 10 } })
    .middleware(sharedMiddleware)
    .onUploadComplete(handleUploadComplete),

  attachmentUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 5 },
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    text: { maxFileSize: "4MB", maxFileCount: 5 },
  })
    .middleware(sharedMiddleware)
    .onUploadComplete(handleUploadComplete),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
