import type { Metadata, Viewport } from "next";
import { Inter, Caveat, Kalam, Patrick_Hand, Dancing_Script, Shadows_Into_Light, Indie_Flower } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "700"],
});

const patrickHand = Patrick_Hand({
  variable: "--font-patrick-hand",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const shadowsIntoLight = Shadows_Into_Light({
  variable: "--font-shadows-into-light",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

const indieFlower = Indie_Flower({
  variable: "--font-indie-flower",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "TulisTangan.id — Konversi PDF ke Tulisan Tangan",
  description:
    "Ubah dokumen PDF menjadi gambar tulisan tangan realistis. Cepat, privat, dan berjalan langsung di browser.",
  keywords: [
    "tulisan tangan",
    "handwriting generator",
    "PDF to handwriting",
    "tulis tangan",
    "konversi PDF",
  ],
  authors: [{ name: "TulisTangan.id" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TulisTangan",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${caveat.variable} ${kalam.variable} ${patrickHand.variable} ${dancingScript.variable} ${shadowsIntoLight.variable} ${indieFlower.variable} h-full`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="min-h-full flex flex-col font-[var(--font-inter)] antialiased">
        {children}
      </body>
    </html>
  );
}
