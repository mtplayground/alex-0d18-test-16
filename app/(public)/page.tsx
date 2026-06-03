import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const feedPageSize = 10;

type HomePageProps = Readonly<{
  searchParams: Promise<{
    page?: string | string[];
  }>;
}>;

type FeedPost = Awaited<ReturnType<typeof getFeedPosts>>["posts"][number];

function getRequestedPage(value: string | string[] | undefined) {
  const rawPage = Array.isArray(value) ? value[0] : value;
  const parsedPage = Number(rawPage);

  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    return 1;
  }

  return parsedPage;
}

function getPageHref(page: number) {
  return page <= 1 ? "/" : `/?page=${page}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.ceil(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function getExcerpt(body: string) {
  const normalized = body.replace(/\s+/g, " ").trim();

  if (normalized.length <= 220) {
    return normalized;
  }

  return `${normalized.slice(0, 220).trim()}...`;
}

async function getFeedPosts(requestedPage: number) {
  const totalPosts = await prisma.post.count();
  const totalPages = Math.max(1, Math.ceil(totalPosts / feedPageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const posts =
    totalPosts === 0
      ? []
      : await prisma.post.findMany({
          orderBy: [
            {
              createdAt: "desc",
            },
            {
              id: "desc",
            },
          ],
          skip: (currentPage - 1) * feedPageSize,
          take: feedPageSize,
          select: {
            id: true,
            title: true,
            body: true,
            createdAt: true,
            author: {
              select: {
                displayName: true,
              },
            },
            attachments: {
              orderBy: {
                createdAt: "asc",
              },
              select: {
                id: true,
                fileName: true,
                sizeBytes: true,
              },
            },
          },
        });

  return {
    currentPage,
    posts,
    totalPages,
    totalPosts,
  };
}

function PostCard({ post }: Readonly<{ post: FeedPost }>) {
  return (
    <article className="border-border bg-surface rounded-lg border p-5">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold">{post.author.displayName}</span>
        <time className="text-muted" dateTime={post.createdAt.toISOString()}>
          {formatDate(post.createdAt)}
        </time>
      </div>
      <h2 className="text-xl leading-snug font-bold">
        <Link className="hover:underline" href={`/posts/${post.id}`}>
          {post.title}
        </Link>
      </h2>
      <p className="text-muted mt-3 leading-7">{getExcerpt(post.body)}</p>
      {post.attachments.length > 0 ? (
        <ul className="border-border mt-4 space-y-2 border-t pt-4">
          {post.attachments.map((attachment) => (
            <li
              className="text-muted flex flex-wrap items-center justify-between gap-2 text-sm"
              key={attachment.id}
            >
              <span>{attachment.fileName}</span>
              <span>{formatBytes(attachment.sizeBytes)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function Pagination({
  currentPage,
  totalPages,
}: Readonly<{
  currentPage: number;
  totalPages: number;
}>) {
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <nav
      className="flex items-center justify-between gap-4"
      aria-label="Feed pagination"
    >
      {hasPreviousPage ? (
        <Link
          className="border-border bg-surface rounded-md border px-4 py-2 text-sm font-semibold"
          href={getPageHref(currentPage - 1)}
        >
          Previous
        </Link>
      ) : (
        <span className="border-border text-muted rounded-md border px-4 py-2 text-sm">
          Previous
        </span>
      )}

      <span className="text-muted text-sm">
        Page {currentPage} of {totalPages}
      </span>

      {hasNextPage ? (
        <Link
          className="border-border bg-surface rounded-md border px-4 py-2 text-sm font-semibold"
          href={getPageHref(currentPage + 1)}
        >
          Next
        </Link>
      ) : (
        <span className="border-border text-muted rounded-md border px-4 py-2 text-sm">
          Next
        </span>
      )}
    </nav>
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { page } = await searchParams;
  const requestedPage = getRequestedPage(page);
  const { currentPage, posts, totalPages, totalPosts } =
    await getFeedPosts(requestedPage);

  return (
    <section className="space-y-6" aria-labelledby="feed-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted mb-2 text-sm font-bold uppercase">
            Global feed
          </p>
          <h1 id="feed-title" className="text-3xl leading-tight font-bold">
            Posts
          </h1>
        </div>
        <p className="text-muted text-sm">
          {totalPosts} {totalPosts === 1 ? "post" : "posts"}
        </p>
        <Link
          className="bg-foreground text-surface rounded-md px-4 py-2 text-sm font-semibold"
          href="/posts/new"
        >
          New post
        </Link>
      </div>

      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="border-border bg-surface rounded-lg border p-8">
          <h2 className="text-xl font-bold">No posts yet</h2>
          <p className="text-muted mt-2">
            New posts will appear here in reverse chronological order.
          </p>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </section>
  );
}
