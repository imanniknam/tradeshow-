import "@fontsource-variable/inter";
import type { Metadata, Viewport } from "next";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SplitLite · Shared expenses",
  description: "Record who paid for whom and see the netted balance between every pair of people.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="antialiased">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
