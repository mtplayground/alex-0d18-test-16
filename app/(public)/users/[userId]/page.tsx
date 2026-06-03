import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type UserProfilePageProps = Readonly<{
  params: Promise<{
    userId: string;
  }>;
}>;

type UserProfile = NonNullable<Awaited<ReturnType<typeof getUserProfile>>>;
type ProfilePost = UserProfile["posts"][number];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getExcerpt(body: string) {
  const normalized = body.replace(/\s+/g, " ").trim();

  if (normalized.length <= 180) {
    return normalized;
  }

  return `${normalized.slice(0, 180).trim()}...`;
}

function getInitials(displayName: string) {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          replies: true,
        },
      },
      posts: {
        orderBy: [
          {
            createdAt: "desc",
          },
          {
            id: "desc",
          },
        ],
        select: {
          id: true,
          title: true,
          body: true,
          createdAt: true,
          _count: {
            select: {
              attachments: true,
              replies: true,
            },
          },
        },
      },
    },
  });
}

function ProfileAvatar({
  avatarUrl,
  displayName,
}: Readonly<{
  avatarUrl: string | null;
  displayName: string;
}>) {
  if (avatarUrl) {
    return (
      <div
        className="border-border h-20 w-20 rounded-full border bg-cover bg-center"
        role="img"
        aria-label={`${displayName} avatar`}
        style={{
          backgroundImage: `url(${avatarUrl})`,
        }}
      />
    );
  }

  return (
    <div
      className="border-border bg-background flex h-20 w-20 items-center justify-center rounded-full border text-2xl font-bold"
      aria-hidden="true"
    >
      {getInitials(displayName) || "U"}
    </div>
  );
}

function ProfilePostCard({ post }: Readonly<{ post: ProfilePost }>) {
  return (
    <article className="border-border bg-surface rounded-lg border p-5">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <time className="text-muted" dateTime={post.createdAt.toISOString()}>
          {formatDate(post.createdAt)}
        </time>
        <span className="text-muted">
          {post._count.replies}{" "}
          {post._count.replies === 1 ? "reply" : "replies"}
        </span>
        <span className="text-muted">
          {post._count.attachments}{" "}
          {post._count.attachments === 1 ? "attachment" : "attachments"}
        </span>
      </div>
      <h2 className="text-xl leading-snug font-bold">
        <Link className="hover:underline" href={`/posts/${post.id}`}>
          {post.title}
        </Link>
      </h2>
      <p className="text-muted mt-3 leading-7">{getExcerpt(post.body)}</p>
    </article>
  );
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { userId } = await params;
  const user = await getUserProfile(userId);

  if (!user) {
    notFound();
  }

  return (
    <section className="space-y-6" aria-labelledby="profile-title">
      <header className="border-border bg-surface rounded-lg border p-6">
        <div className="flex flex-wrap items-center gap-5">
          <ProfileAvatar
            avatarUrl={user.avatarUrl}
            displayName={user.displayName}
          />
          <div>
            <p className="text-muted mb-2 text-sm font-bold uppercase">
              Profile
            </p>
            <h1 id="profile-title" className="text-3xl leading-tight font-bold">
              {user.displayName}
            </h1>
            <p className="text-muted mt-2 text-sm">
              Joined{" "}
              <time dateTime={user.createdAt.toISOString()}>
                {formatDate(user.createdAt)}
              </time>
            </p>
          </div>
        </div>

        <dl className="border-border mt-6 grid gap-4 border-t pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-muted text-sm">Posts</dt>
            <dd className="mt-1 text-2xl font-bold">{user._count.posts}</dd>
          </div>
          <div>
            <dt className="text-muted text-sm">Replies</dt>
            <dd className="mt-1 text-2xl font-bold">{user._count.replies}</dd>
          </div>
        </dl>
      </header>

      <section className="space-y-4" aria-labelledby="user-posts-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="user-posts-title" className="text-2xl font-bold">
            Posts
          </h2>
          <p className="text-muted text-sm">
            {user.posts.length} {user.posts.length === 1 ? "post" : "posts"}
          </p>
        </div>

        {user.posts.length > 0 ? (
          <div className="space-y-4">
            {user.posts.map((post) => (
              <ProfilePostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="border-border bg-surface rounded-lg border p-8">
            <h3 className="text-xl font-bold">No posts yet</h3>
            <p className="text-muted mt-2">
              Posts from this user will appear here.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}
