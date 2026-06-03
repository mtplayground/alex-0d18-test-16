import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

const metadataBase = new URL(process.env.AUTH_URL ?? "http://localhost:8080");
const defaultDescription = "A self-hosted social posting application.";

export const metadata: Metadata = {
  metadataBase,
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
