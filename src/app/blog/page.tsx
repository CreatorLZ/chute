import Link from "next/link";
import { QewordlyBlog, resolveImageUrl } from "@qewordly/react";
import { qw, API_URL } from "@/lib/qw";

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function readingMinutes(html: string) {
  const words = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!words) return null;
  return Math.max(1, Math.ceil(words.split(" ").length / 200));
}

export default async function BlogPage() {
  const { data } = await qw.getPosts();
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Blog</h1>
      <p className="mt-2 text-sm font-medium text-zinc-500">
        {data.length} {data.length === 1 ? "post" : "posts"}
      </p>
      {data.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-10 text-center text-sm font-medium text-zinc-500">
          No posts yet — check back soon.
        </p>
      ) : (
        <QewordlyBlog
          posts={data}
          className="mt-10 flex flex-col gap-2"
          renderPost={(post) => {
            const cover = resolveImageUrl(post.coverImage, API_URL);
            const date = formatDate(post.publishedAt ?? post.updatedAt);
            const minutes = readingMinutes(post.content);
            const meta = [date, minutes !== null ? `${minutes} min read` : null]
              .filter(Boolean)
              .join(" · ");
            return (
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl border border-transparent px-4 py-4 transition-colors hover:border-zinc-200 hover:bg-zinc-50"
              >
                {cover && (
                  <img
                    src={cover}
                    alt={post.title}
                    className="mb-4 aspect-[16/9] w-full rounded-xl object-cover"
                  />
                )}
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 group-hover:underline group-hover:decoration-zinc-300 group-hover:underline-offset-4">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                    {post.excerpt}
                  </p>
                )}
                {meta && (
                  <p className="mt-2 text-xs font-medium text-zinc-400">{meta}</p>
                )}
              </Link>
            );
          }}
        />
      )}
    </main>
  );
}
