"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ArrowRight, Camera, X, Plus, FileText, Info } from "lucide-react";
import {
  AttachmentUpload,
  AvatarUpload,
} from "@/components/upload-presets";
import type { UploadFieldHandle } from "@/components/upload-field";
import type { UploadedFile } from "@/hooks/use-upload-field";
import { cn } from "@/lib/utils";

const AGENT_PROMPT =
  "Read https://chuteui.vercel.app/agents.md and follow it to install chute and add file uploads to this project.";

const TRANSITION = { duration: 0.45, ease: "easeOut" } as const;

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleCopyAgentPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(AGENT_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboards fail silently */
    }
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeModal]);

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-24 min-h-screen">
      {/* Hero */}
      <div className="mb-24 flex flex-col items-center text-center gap-6">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TRANSITION, delay: 0 }}
          className="text-6xl md:text-[5rem] font-bold tracking-tight text-zinc-900"
        >
          chute
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TRANSITION, delay: 0.1 }}
          className="max-w-[500px] text-lg text-muted-foreground leading-relaxed font-medium"
        >
          File upload components for Next.js — powered by UploadThing. Two
          presets, one engine, drop in and ship.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TRANSITION, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-2"
        >
          <button
            type="button"
            onClick={handleCopyAgentPrompt}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300",
              "bg-zinc-900 text-zinc-50 shadow-[0_4px_14px_0_rgb(0,0,0,15%)] hover:bg-zinc-800 hover:shadow-[0_6px_20px_rgba(0,0,0,23%)] active:scale-[0.97]",
              copied && "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700",
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Check className="size-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Copy className="size-4" />
                </motion.span>
              )}
            </AnimatePresence>
            {copied ? "Copied!" : "Copy Agent Prompt"}
          </button>

          <a
            href="https://github.com/CreatorLZ/chute"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 backdrop-blur-md px-6 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-300 hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.97]"
          >
            View on GitHub
            <ArrowRight className="size-3.5 -rotate-45" />
          </a>
        </motion.div>

        {/* Stat pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TRANSITION, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-2 mt-4"
        >
          {[
            "2 Presets",
            "UploadThing Powered",
            "TypeScript",
            "React Hook Form",
          ].map((stat) => (
            <span
              key={stat}
              className="rounded-full border border-zinc-200/60 bg-zinc-50/80 px-3.5 py-1 text-xs font-medium text-zinc-500 backdrop-blur"
            >
              {stat}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Grid of Presets */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-3xl mx-auto auto-rows-fr">
        {/* Avatar Upload Card */}
        <PresetCard
          title="Avatar Upload"
          tag="Single file"
          onClick={() => setActiveModal("avatar")}
          delay={0.4}
        >
          <div className="flex flex-col items-center justify-center w-full h-full gap-4">
            <div className="relative flex size-24 items-center justify-center rounded-full border-2 border-dashed border-zinc-300 bg-white shadow-sm">
              <Camera className="size-6 text-zinc-400" />
              <div className="absolute -right-1 -top-1 size-4 rounded-full bg-emerald-500 ring-2 ring-zinc-50" />
            </div>
            <div className="h-2 w-24 rounded-full bg-zinc-200" />
            <div className="h-1.5 w-32 rounded-full bg-zinc-100" />
          </div>
        </PresetCard>


        {/* Documents & Attachments Card */}
        <PresetCard
          title="Documents & Attachments"
          tag="Manual upload"
          onClick={() => setActiveModal("documents")}
          delay={0.6}
        >
          <div className="flex w-full max-w-[240px] flex-col gap-2 rounded-[20px] border border-zinc-200 bg-white p-2 shadow-sm">
            <div className="flex items-center gap-2 bg-zinc-50 p-2 rounded-[14px] border border-zinc-100">
              <div className="size-8 rounded-[8px] bg-zinc-200/50 flex items-center justify-center"><FileText className="size-4 text-zinc-400" /></div>
              <div className="flex flex-col gap-1.5">
                <div className="h-1.5 w-16 rounded-full bg-zinc-200" />
                <div className="h-1 w-10 rounded-full bg-zinc-100" />
              </div>
            </div>
            <div className="flex items-center gap-2 px-2 py-0.5 mt-0.5">
              <div className="flex size-7 items-center justify-center rounded-full bg-zinc-100">
                <Plus className="size-4 text-zinc-500" />
              </div>
              <div className="h-2 w-20 rounded-full bg-zinc-100" />
            </div>
          </div>
        </PresetCard>
      </div>

      <AnimatePresence>
        {activeModal === "avatar" && (
          <PresetModal
            title="Avatar Upload"
            description="A sleek, single-file uploader perfect for user profiles and avatars."
            onClose={() => setActiveModal(null)}
          >
            <AvatarUploadDemo />
          </PresetModal>
        )}

        {activeModal === "documents" && (
          <PresetModal
            title="Documents & Attachments"
            description="Queue files and review them before initiating the manual upload process."
            onClose={() => setActiveModal(null)}
          >
            <DocumentUploadDemo />
          </PresetModal>
        )}
      </AnimatePresence>
    </main>
  );
}

function PresetCard({
  title,
  tag,
  onClick,
  children,
  delay = 0,
}: {
  title: string;
  tag: string;
  onClick: () => void;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className="group flex flex-col text-left overflow-hidden rounded-[24px] border border-zinc-200 bg-white p-2.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200/50 hover:border-zinc-300"
    >
      <div className="relative flex min-h-[260px] w-full items-center justify-center rounded-[18px] bg-zinc-50/80 overflow-hidden transition-colors group-hover:bg-zinc-100/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.02)_0%,transparent_70%)]" />
        <div className="relative z-10 transition-transform duration-500 group-hover:scale-105">
          {children}
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-4">
        <h2 className="text-[15px] font-bold text-zinc-900 tracking-tight">{title}</h2>
        <span className="text-[13px] font-medium text-zinc-500">{tag}</span>
      </div>
    </motion.button>
  );
}

function PresetModal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 px-6 py-5 gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">{title}</h2>
            <p className="text-sm text-zinc-500 font-medium">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 sm:self-start"
          >
            <X className="size-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-6 sm:p-10">
          <div className="flex items-center justify-center w-full">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo Wrappers (Handling local state and upload)
// ─────────────────────────────────────────────────────────────────────────────

function AvatarUploadDemo() {
  const ref = useRef<UploadFieldHandle>(null);
  const [value, setValue] = useState<UploadedFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await ref.current?.uploadAll();
    } catch (e) {
      console.error(e);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <AvatarUpload
        ref={ref}
        value={value}
        onChange={setValue}
      />
      
      {value && (
         <div className="w-full max-w-md rounded-2xl border border-zinc-200/60 bg-white overflow-hidden shadow-sm">
           <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3">
             <div className="flex items-center gap-2">
               <div className="size-2 rounded-full bg-zinc-300" />
               <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Output State</span>
             </div>
             <div className="group relative flex items-center justify-center">
               <Info className="size-4 text-zinc-400 hover:text-zinc-600 transition-colors" />
               <div className="absolute right-0 top-full mt-2 hidden w-48 rounded-lg bg-zinc-800 p-2 text-xs text-zinc-50 shadow-lg group-hover:block z-50">
                 This JSON output is only for the demo page to show what data your app receives.
               </div>
             </div>
           </div>
           <div className="p-4 overflow-auto max-h-[200px]">
             <pre className="text-xs text-zinc-600 font-mono">
               {JSON.stringify(value, null, 2)}
             </pre>
           </div>
         </div>
      )}

    </div>
  );
}


function DocumentUploadDemo() {
  const ref = useRef<UploadFieldHandle>(null);
  const [value, setValue] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await ref.current?.uploadAll();
    } catch (e) {
      console.error(e);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="w-full max-w-md">
        <AttachmentUpload
          ref={ref}
          value={value}
          onChange={setValue}
        />
      </div>

      {value && value.length > 0 && (
         <div className="w-full max-w-md rounded-2xl border border-zinc-200/60 bg-white overflow-hidden shadow-sm">
           <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3">
             <div className="flex items-center gap-2">
               <div className="size-2 rounded-full bg-zinc-300" />
               <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Output State</span>
             </div>
             <div className="group relative flex items-center justify-center">
               <Info className="size-4 text-zinc-400 hover:text-zinc-600 transition-colors" />
               <div className="absolute right-0 top-full mt-2 hidden w-48 rounded-lg bg-zinc-800 p-2 text-xs text-zinc-50 shadow-lg group-hover:block z-50">
                 This JSON output is only for the demo page to show what data your app receives.
               </div>
             </div>
           </div>
           <div className="p-4 overflow-auto max-h-[200px]">
             <pre className="text-xs text-zinc-600 font-mono">
               {JSON.stringify(value, null, 2)}
             </pre>
           </div>
         </div>
      )}

    </div>
  );
}
