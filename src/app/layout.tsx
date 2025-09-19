import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";
import ConditionalHeader from "@/components/ConditionalHeader";
import ConditionalFooter from "@/components/ConditionalFooter";
import { Toaster } from "@/components/ui/toaster";

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ClientProviders>
          <div className="flex flex-col min-h-screen">
            <ConditionalHeader />
            <main className="flex-1 container py-10">
              {children}
            </main>
            <ConditionalFooter />
          </div>
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  );
}
