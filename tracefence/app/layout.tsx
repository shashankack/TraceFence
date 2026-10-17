import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TraceFence",
  description: "A source-aware security gateway for AI agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
