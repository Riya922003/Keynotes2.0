import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keynotes",
  description: "Your note-taking and journaling application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
