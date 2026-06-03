import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await prisma.post.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      updatedAt: true,
    },
  });

  return [
    {
      url: getAbsoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    ...posts.map((post) => ({
      url: getAbsoluteUrl(`/posts/${post.id}`),
      lastModified: post.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
