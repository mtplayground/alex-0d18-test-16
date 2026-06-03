import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getSiteUrl } from "@/lib/site-url";

import "./globals.css";

const defaultDescription = "A self-hosted social posting application.";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Home",
    template: "%s",
  },
  description: defaultDescription,
  openGraph: {
    title: "Home",
    description: defaultDescription,
    type: "website",
    url: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    card: "summary",
    title: "Home",
    description: defaultDescription,
  },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
