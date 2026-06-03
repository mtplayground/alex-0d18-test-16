import type { ReactNode } from "react";

import { PublicLayout } from "@/components/layouts/public-layout";

type PublicRouteLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function PublicRouteLayout({
  children,
}: PublicRouteLayoutProps) {
  return <PublicLayout>{children}</PublicLayout>;
}
