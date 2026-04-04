import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Contract Kit",
  description: "BCT Internal tool to build OpenAPI contracts"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slateBg text-ink">{children}</body>
    </html>
  );
}
