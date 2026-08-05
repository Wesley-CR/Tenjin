import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Kana Trainer — learn hiragana & katakana",
  description:
    "A minimal, distraction-free drill for Japanese kana. Read, type, pick or draw your way to mastery. Works offline.",
  applicationName: "Kana Trainer",
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

/**
 * Paint the correct theme before React hydrates to avoid a flash of the wrong
 * color scheme. Matches ThemeProvider's storage key.
 */
const THEME_INIT = `(function(){try{var k='kana-trainer:theme';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT}
        </Script>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <ThemeProvider>
          <div className="shell">
            <Header />
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
