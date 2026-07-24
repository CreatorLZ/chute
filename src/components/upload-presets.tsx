"use client";

import { forwardRef, useRef, useImperativeHandle } from "react";

import {
  UploadField,
  type MultiUploadFieldProps,
  type SingleUploadFieldProps,
  type UploadFieldHandle,
} from "@/components/upload-field";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Trash2,
  Camera,
  Paperclip,
  MonitorUp,
  X,
  Plus,
  FileText,
  ArrowUp,
  Check,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// AvatarUpload
// ─────────────────────────────────────────────────────────────────────────────

type AvatarUploadProps = Omit<
  SingleUploadFieldProps,
  "endpoint" | "accept" | "multiple" | "maxFiles" | "renderUploadedFile"
> & {
  endpoint?: SingleUploadFieldProps["endpoint"];
  className?: string;
};

export const AvatarUpload = forwardRef<UploadFieldHandle, AvatarUploadProps>(
  function AvatarUpload(
    {
      endpoint = "avatarUploader",
      className,
      uploadLabel = "Upload photo",
      queuedLabel = "Photo ready",
      classNames,
      ...props
    },
    ref,
  ) {
    const localRef = useRef<UploadFieldHandle>(null);
    useImperativeHandle(ref, () => ({
      uploadAll: () => localRef.current?.uploadAll() ?? Promise.resolve([]),
      clear: () => localRef.current?.clear(),
      addFiles: (files) => localRef.current?.addFiles(files),
      openFileDialog: () => localRef.current?.openFileDialog(),
    }), []);

    return (
      <UploadField
        ref={localRef}
        endpoint={endpoint}
        accept={["image/*"]}
        maxFiles={1}
        uploadLabel={uploadLabel}
        queuedLabel={queuedLabel}
        hideDropzoneOnPresence
        hideUploadedLabel
        hideQueueLabel
        hideGlobalActions
        renderDropzoneContent={(isDragOver) => (
          <div className="flex flex-col items-center gap-5 py-10 px-6">
            {/* Circle avatar zone */}
            <div
              className={cn(
                "relative flex size-32 items-center justify-center rounded-full border-2 border-dashed transition-all duration-300",
                isDragOver
                  ? "border-primary bg-primary/5 scale-105"
                  : "border-border bg-muted/30 group-hover:border-foreground/30 group-hover:bg-muted/50 group-hover:scale-[1.02]",
              )}
            >
              <Camera
                className={cn(
                  "size-7 transition-colors duration-200",
                  isDragOver ? "text-primary" : "text-muted-foreground/50",
                )}
                strokeWidth={1.5}
              />
            </div>
            {/* Text */}
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium text-foreground/80">
                {isDragOver ? "Drop photo here" : "Upload your photo"}
              </p>
              <p className="text-xs text-muted-foreground/50">
                PNG, JPG or GIF · Click or drag & drop
              </p>
            </div>
          </div>
        )}
        renderFile={(entry, actions) => (
          <AvatarPreview
            file={{
              name: entry.file.name,
              previewUrl: entry.previewUrl,
              status: entry.status,
            }}
            actions={{ ...actions, upload: () => localRef.current?.uploadAll().catch(() => {}) }}
          />
        )}
        renderUploadedFile={(file, actions) => (
          <AvatarPreview file={file} actions={actions} />
        )}
        classNames={{
          ...classNames,
          root: cn(
            "flex flex-col items-center gap-0 w-full max-w-md",
            className,
            classNames?.root,
          ),
          dropzone: cn(
            "group w-full ring-0 bg-transparent border-border/50",
            "hover:border-foreground/30 hover:bg-muted/10",
            classNames?.dropzone,
          ),
          uploaded: cn(
            "w-full flex flex-col items-center",
            classNames?.uploaded,
          ),
          queue: cn("w-full flex flex-col items-center", classNames?.queue),
        }}
        {...props}
      />
    );
  },
);

type PreviewFile = {
  name: string;
  url?: string;
  previewUrl?: string;
  status?: string;
};

function AvatarPreview({
  file,
  actions,
}: {
  file: PreviewFile;
  actions: { remove: () => void; retry?: () => void; upload?: () => void };
}) {
  const imageUrl = file.url || file.previewUrl;
  const isUploading = file.status === "uploading";
  const isError = file.status === "failed";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col items-center gap-4 py-4"
    >
      {/* Circular avatar with hover overlay */}
      <div
        className={cn(
          "group relative size-32 overflow-hidden rounded-full border-2 border-border shadow-sm bg-muted/30",
          isError && "border-destructive/50",
        )}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Uploaded avatar"
            className={cn(
              "size-full object-cover transition-all duration-300 group-hover:scale-105",
              isUploading && "opacity-50 blur-[2px] scale-105 grayscale-30",
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Camera className="size-6 text-muted-foreground/30" />
          </div>
        )}

        {/* Uploading Spinner */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="size-6 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
          </div>
        )}

        {/* Hover overlay (only if not uploading) */}
        {!isUploading && (
          <div className="absolute inset-0 flex items-center justify-center gap-2.5 bg-black/50 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
            <button
              type="button"
              onClick={actions.remove}
              title="Remove photo"
              className="flex size-8 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition-colors hover:bg-red-500/80"
            >
              <Trash2 className="size-3.5" strokeWidth={2} />
            </button>
            {actions.upload && file.status === "queued" && (
              <button
                type="button"
                onClick={actions.upload}
                title="Upload photo"
                className="flex size-8 items-center justify-center rounded-full bg-zinc-900 text-white ring-1 ring-white/20 transition-colors hover:bg-zinc-800"
              >
                <ArrowUp className="size-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        )}
      </div>

      {actions.upload && file.status === "queued" && (
        <button
          type="button"
          onClick={actions.upload}
          className="mt-1 flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-95"
        >
          <Check className="size-4" strokeWidth={2.5} />
          Save Photo
        </button>
      )}

    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AttachmentUpload
// ─────────────────────────────────────────────────────────────────────────────

type AttachmentUploadProps = Omit<
  MultiUploadFieldProps,
  "endpoint" | "multiple" | "uploadMode"
> & {
  endpoint?: MultiUploadFieldProps["endpoint"];
};

export const AttachmentUpload = forwardRef<
  UploadFieldHandle,
  AttachmentUploadProps
>(function AttachmentUpload(
  {
    endpoint = "attachmentUploader",
    maxFiles = 5,
    accept = ["image/*", "application/pdf", "text/plain"],
    classNames,
    ...props
  },
  ref,
) {
  const localRef = useRef<UploadFieldHandle>(null);

  useImperativeHandle(ref, () => ({
    uploadAll: () => localRef.current?.uploadAll() ?? Promise.resolve([]),
    clear: () => localRef.current?.clear(),
    addFiles: (files) => localRef.current?.addFiles(files),
    openFileDialog: () => localRef.current?.openFileDialog(),
  }), []);

  const handleScreenshot = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const video = document.createElement("video");
      video.srcObject = stream;
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Video playback timeout")), 5000);
          video.onloadedmetadata = () => {
            video.play().catch(reject);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anyVid = video as any;
            if (typeof anyVid.requestVideoFrameCallback === "function" || navigator.userAgent.includes("Safari")) {
              anyVid.requestVideoFrameCallback(() => {
                clearTimeout(timeout);
                resolve();
              });
            } else {
              anyVid.addEventListener("timeupdate", () => {
                clearTimeout(timeout);
                resolve();
              }, { once: true });
            }
          };
          video.onerror = reject;
        });
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File(
              [blob],
              `Screenshot-${new Date().toISOString()}.png`,
              { type: "image/png" },
            );
            localRef.current?.addFiles([file]);
          }
        }, "image/png");
      } finally {
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (err) {
      console.error("Screenshot failed", err);
    }
  };

  return (
    <div
      className={cn(
        "flex w-full max-w-md flex-col rounded-3xl border border-border/60 bg-muted/10 p-3 shadow-sm",
        classNames?.root,
      )}
    >
      <UploadField
        ref={localRef}
        endpoint={endpoint}
        multiple
        maxFiles={maxFiles}
        accept={accept}
        uploadMode="manual"
        hideDropzone={true}
        hideQueueLabel={true}
        hideUploadedLabel={true}
        hideGlobalActions={true}
        classNames={{
          ...classNames,
          root: cn("space-y-0 min-w-0 w-full overflow-hidden", classNames?.root),
          queue: cn(
            "flex flex-row flex-nowrap items-center gap-2 overflow-x-auto pb-2 scrollbar-none max-w-full",
            classNames?.queue
          ),
          uploaded: cn(
            "flex flex-row flex-nowrap items-center gap-2 overflow-x-auto pb-2 scrollbar-none max-w-full",
            classNames?.uploaded
          ),
        }}
        renderFile={(entry, actions) => (
          <InstantFileCard file={entry} actions={actions} />
        )}
        renderUploadedFile={(file, actions) => (
          <InstantFileCard file={file} actions={actions} />
        )}
        {...props}
      />

      <div className="flex items-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex shrink-0 items-center justify-center rounded-full bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground h-9 w-9 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            onClick={(e) => e.stopPropagation()}
          >
            <Plus className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 mb-2">
            <DropdownMenuItem
              onClick={() => localRef.current?.openFileDialog()}
            >
              <Paperclip className="mr-2 size-4" />
              <span>Add files or photos</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleScreenshot}>
              <MonitorUp className="mr-2 size-4" />
              <span>Take a screenshot</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <textarea
          placeholder="How can I help you today?"
          className="flex min-h-9 w-full resize-none bg-transparent px-2 py-2 text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/50"
          rows={1}
        />
        <button
          type="button"
          onClick={() => localRef.current?.uploadAll().catch(() => {})}
          className="flex shrink-0 items-center justify-center rounded-full bg-zinc-900 text-zinc-50 hover:bg-zinc-800 transition-colors h-8 w-8 mb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowUp className="size-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
});


function InstantFileCard({ file, actions }: {
  file: {
    name?: string;
    url?: string;
    previewUrl?: string;
    status?: string;
    file?: { name?: string; type?: string; size?: number };
    size?: number;
  };
  actions: { remove: () => void };
}) {
  const isUploading = file.status === "uploading";
  const isError = file.status === "failed";

  const isUploaded = "url" in file;
  const isImage = isUploaded
    ? file.name ? /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(file.name) : false
    : file.file?.type?.startsWith("image/") ?? false;

  const imageUrl = isImage ? file.url || file.previewUrl : null;

  const sizeBytes = file.file?.size || file.size;
  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileName = file.file?.name || file.name;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "group relative flex shrink-0 w-44 items-center gap-2.5 overflow-hidden rounded-xl bg-muted/40 p-1.5 pr-3 transition-colors hover:bg-muted/60",
        isError && "bg-destructive/10",
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/80 overflow-hidden text-muted-foreground/70">
        {imageUrl ? (
          <img src={imageUrl} className="size-full object-cover" alt="" />
        ) : (
          <FileText className="size-5" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="truncate text-sm font-medium text-foreground/90">
          {fileName}
        </span>
        <span className="text-xs text-muted-foreground/70">
          {isUploading
            ? "Uploading..."
            : isError
              ? "Failed"
              : formatSize(sizeBytes) || "Ready"}
        </span>
      </div>
      <button
        type="button"
        onClick={actions.remove}
        className="absolute right-1.5 top-1.5 rounded-full bg-background/80 p-0.5 text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
      >
        <X className="size-3" />
      </button>
      {isUploading && (
        <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center">
          <span className="size-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
