import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createPresignedGetUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

type PostDetailPageProps = Readonly<{
  params: Promise<{
    postId: string;
  }>;
}>;

type PostDetail = NonNullable<Awaited<ReturnType<typeof getPost>>>;
type PostAttachment = PostDetail["attachments"][number];

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

async function getPost(postId: string) {
  return prisma.post.findUnique({
    where: {
      id: postId,
    },
    select: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
      updatedAt: true,
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
          contentType: true,
          sizeBytes: true,
          storageKey: true,
        },
      },
    },
  });
}

async function getAttachmentDownloadUrl(attachment: PostAttachment) {
  try {
    return await createPresignedGetUrl(attachment.storageKey);
  } catch (error) {
    console.error(
      `Unable to create download URL for attachment ${attachment.id}`,
      error
    );
    return undefined;
  }
}

async function getDownloadableAttachments(attachments: PostAttachment[]) {
  return Promise.all(
    attachments.map(async (attachment) => ({
      ...attachment,
      downloadUrl: await getAttachmentDownloadUrl(attachment),
    }))
  );
}

function BodyContent({ body }: Readonly<{ body: string }>) {
  return (
    <div className="text-foreground space-y-4 leading-8">
      {body.split(/\n{2,}/).map((paragraph, index) => {
        const content = paragraph.trim();

        if (!content) {
          return null;
        }

        return (
          <p className="whitespace-pre-wrap" key={`${index}-${content.length}`}>
            {content}
          </p>
        );
      })}
    </div>
  );
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;
  const post = await getPost(postId);

  if (!post) {
    notFound();
  }

  const attachments = await getDownloadableAttachments(post.attachments);

  return (
    <article className="space-y-6" aria-labelledby="post-title">
      <Link
        className="text-muted inline-flex text-sm font-semibold hover:underline"
        href="/"
      >
        Back to feed
      </Link>

      <header className="border-border bg-surface rounded-lg border p-6">
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold">{post.author.displayName}</span>
          <time className="text-muted" dateTime={post.createdAt.toISOString()}>
            {formatDate(post.createdAt)}
          </time>
        </div>
        <h1 id="post-title" className="text-3xl leading-tight font-bold">
          {post.title}
        </h1>
      </header>

      <section
        className="border-border bg-surface rounded-lg border p-6"
        aria-label="Post body"
      >
        <BodyContent body={post.body} />
      </section>

      {attachments.length > 0 ? (
        <section
          className="border-border bg-surface rounded-lg border p-6"
          aria-labelledby="attachments-title"
        >
          <h2 id="attachments-title" className="text-xl font-bold">
            Attachments
          </h2>
          <ul className="mt-4 space-y-3">
            {attachments.map((attachment) => (
              <li
                className="border-border flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3"
                key={attachment.id}
              >
                <div>
                  <p className="font-semibold">{attachment.fileName}</p>
                  <p className="text-muted mt-1 text-sm">
                    {attachment.contentType} ·{" "}
                    {formatBytes(attachment.sizeBytes)}
                  </p>
                </div>
                {attachment.downloadUrl ? (
                  <a
                    className="bg-foreground text-surface rounded-md px-4 py-2 text-sm font-semibold"
                    href={attachment.downloadUrl}
                    download={attachment.fileName}
                  >
                    Download
                  </a>
                ) : (
                  <span className="text-muted text-sm">
                    Download unavailable
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
