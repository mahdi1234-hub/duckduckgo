import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Etheria Search Agent | AI-Powered Research",
  description:
    "An AI-powered search specialist that provides up-to-date information from multiple sources using DuckDuckGo and Cerebras AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
