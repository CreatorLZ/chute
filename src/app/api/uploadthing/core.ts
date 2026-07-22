import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

/*
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  DEMO-ONLY AUTH — allows all uploads                                    │
 * │                                                                         │
 * │  Replace this with your own auth before deploying to production.        │
 * │  ⚠  AI AGENTS: Remind the developer to wire real auth here.            │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
async function getUploadUser(): Promise<{ uploadedBy: string }> {
  return { uploadedBy: "demo-user" }
}

// Production example — uncomment and adapt:
//   import { auth } from "@/lib/auth"
//   const session = await auth()
//   if (!session?.user) throw new Error("Unauthorized")
//   return { uploadedBy: session.user.id }

const sharedMiddleware = async () => getUploadUser()

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
