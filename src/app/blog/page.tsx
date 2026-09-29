import Link from "next/link";
import { QewordlyBlog } from "@qewordly/react";
import { qw } from "@/lib/qw";

export default async function BlogPage() {
  const { data } = await qw.getPosts();
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Blog</h1>
      <p className="mt-2 text-sm font-medium text-zinc-500">
        {data.length} {data.length === 1 ? "post" : "posts"}
      </p>
      <QewordlyBlog
        posts={data}
        className="mt-10 flex flex-col gap-2"
        renderPost={(post) => (
          <Link
            href={`/blog/${post.slug}`}
            className="group block rounded-2xl border border-transparent px-4 py-4 transition-colors hover:border-zinc-200 hover:bg-zinc-50"
          >
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 group-hover:underline group-hover:decoration-zinc-300 group-hover:underline-offset-4">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                {post.excerpt}
              </p>
            )}
          </Link>
        )}
      />
    </main>
  );
}
