import type { ReactNode } from "react";

import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout";

type AuthenticatedRouteLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AuthenticatedRouteLayout({
  children,
}: AuthenticatedRouteLayoutProps) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
