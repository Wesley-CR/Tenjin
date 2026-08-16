import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NavBar } from "@/components/NavBar";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Tenjin てんじん — learn Japanese, one drill at a time",
  description:
    "Minimal, distraction-free Japanese drills. Start with hiragana & katakana; kanji and vocabulary sections are on the way. Works offline.",
  applicationName: "Tenjin",
  manifest: "/manifest.webmanifest",
  icons: [
    { rel: "icon", url: "/icon.svg", type: "image/svg+xml" },
    { rel: "icon", url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    {
      rel: "apple-touch-icon",
      url: "/apple-touch-icon.png",
      sizes: "180x180",
    },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#141313" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <ThemeProvider>
          <div className="app-shell">
            <NavBar />
            <main className="main">{children}</main>
            <footer className="footer">
              <span>Only your device knows your progress.</span>
            </footer>
          </div>
        </ThemeProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
