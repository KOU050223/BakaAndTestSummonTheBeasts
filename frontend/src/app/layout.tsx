import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { QueryProvider } from "@/lib/api/QueryProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteName = "試験召喚システム";
const siteDescription =
  "試験の成績から召喚獣を育て、クラス対抗の試召戦争を楽しみながら学べる教育支援プラットフォーム。";
const siteUrl = new URL("https://bakatest.uomi.site");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/site-icon.png", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  keywords: ["試験", "召喚獣", "学習", "教育", "試召戦争"],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: "/baka_kirei.png",
        width: 130,
        height: 165,
        alt: `${siteName}の召喚獣`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: siteName,
    description: siteDescription,
    images: ["/baka_kirei.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script id="adobe-fonts" strategy="beforeInteractive" async>
          {`(function(d) {
  var config = {
    kitId: "qav4qsc",
    scriptTimeout: 3000,
    async: true
  },
  h = d.documentElement,
  t = setTimeout(function() {
    h.className = h.className.replace(/\\bwf-loading\\b/g, "") + " wf-inactive";
  }, config.scriptTimeout),
  tk = d.createElement("script"),
  f = false,
  s = d.getElementsByTagName("script")[0],
  a;

  h.className += " wf-loading";
  tk.src = "https://use.typekit.net/" + config.kitId + ".js";
  tk.async = true;
  tk.onload = tk.onreadystatechange = function() {
    a = this.readyState;
    if (f || (a && a !== "complete" && a !== "loaded")) return;
    f = true;
    clearTimeout(t);
    try { window["Typekit"]?.load(config); } catch (e) {}
  };
  s.parentNode.insertBefore(tk, s);
})(document);`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
