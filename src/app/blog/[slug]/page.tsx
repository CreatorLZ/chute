import { QewordlyPost, QewordlyJsonLd, getPostMetadata, getPostJsonLd } from "@qewordly/react";
import { qw, API_URL } from "@/lib/qw";
import { notFound } from "next/navigation";

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
  const post = await qw.getPost((await params).slug, { revalidate: 60 });
  if (!post) notFound();
  const url = `${process.env.SITE_DOMAIN ?? "https://chuteui.vercel.app"}/blog/${post.slug}`;
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <QewordlyPost
        post={post}
        imageBaseUrl={API_URL}
        shareUrl={url}
        tracking={{ publicKey: process.env.NEXT_PUBLIC_QEWORLDLY_PUBLIC_KEY!, apiOrigin: API_URL }}
      />
      <QewordlyJsonLd data={getPostJsonLd(post, { url, imageBaseUrl: API_URL })} />
    </main>
  );
}
