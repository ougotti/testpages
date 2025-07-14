import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Test Pages - Next.js App",
  description: "A Next.js application deployed to GitHub Pages",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
