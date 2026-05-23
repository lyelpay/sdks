import type { Metadata } from "next";
import "@/app/globals.css";
import { OasisToastProvider } from "@/src";

export const metadata: Metadata = {
  title: "Oasis React – Design System",
  description: "Lyel Oasis React components (Next 16, CVE-safe)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          fontFamily: "var(--oasis-font-sans)",
          backgroundColor: "var(--oasis-background)",
          color: "var(--oasis-foreground)",
        }}
      >
        <OasisToastProvider>{children}</OasisToastProvider>
      </body>
    </html>
  );
}
