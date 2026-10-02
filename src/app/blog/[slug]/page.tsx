import {
  QewordlyPost,
  QewordlyJsonLd,
  getPostMetadata,
  getPostJsonLd,
} from "@qewordly/react";
import type { PublicComment } from "@qewordly/react";
import { qw, API_URL } from "@/lib/qw";
import { notFound } from "next/navigation";

const publicKey = process.env.NEXT_PUBLIC_QEWORLDLY_PUBLIC_KEY!;
const engagement = { baseUrl: API_URL, publicKey };

// 0.7.3 exports the PublicComment type but not createQewordlyComments at the
// package root, so fetch the same public endpoint directly (publishable key,
// server-side, fail-soft). Wire contract mirrors the SDK: approved-only list.
async function getApprovedComments(slug: string): Promise<PublicComment[]> {
  try {
    const res = await fetch(
      `${API_URL}/v1/public/comments?slug=${encodeURIComponent(slug)}`,
      {
        headers: { "X-API-Key": publicKey, Accept: "application/json" },
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return [];
    const json: unknown = await res.json().catch(() => null);
    const data =
      typeof json === "object" && json !== null && "data" in json
        ? (json as { data: unknown }).data
        : null;
    return Array.isArray(data) ? (data as PublicComment[]) : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await qw.getPost((await params).slug);
  if (!post) return {};
  const meta = getPostMetadata(post, { imageBaseUrl: API_URL });
  return { title: meta.title, description: meta.description };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const post = await qw.getPost(slug, { revalidate: 60 });
  if (!post) notFound();
  const url = `${process.env.SITE_DOMAIN ?? "https://chuteui.vercel.app"}/blog/${post.slug}`;
  const comments = await getApprovedComments(slug);
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <QewordlyPost
        post={post}
        imageBaseUrl={API_URL}
        shareUrl={url}
        shareTitle={post.title}
        engagement={engagement}
        comments={comments}
        commentEngagement={engagement}
        commentCount={comments.length}
        tracking={{ publicKey, apiOrigin: API_URL }}
      />
      <QewordlyJsonLd data={getPostJsonLd(post, { url, imageBaseUrl: API_URL })} />
    </main>
  );
}
