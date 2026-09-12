import type { Metadata, Viewport } from "next";
import {Plus_Jakarta_Sans, Space_Grotesk} from "next/font/google";
import "./globals.css";
import { html } from "framer-motion/client";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display:"swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  display:"swap",
  weight: ["400", "500","700"],
  variable: "--font-grotesk",
});

export const metadata: Metadata = {
  title: {
    default: "AMBIS",
    template: "%s | AMBIS",
  },
  description: "Miniatur observatorium otomatis off grid di Purwokerto. Posisi benda langit dihitung real-time, antena digerakkan dua servo.",
  applicationName: "AMBIS",
}

export  const viewport: Viewport = {
  themeColor: "#04070d",
  colorScheme: "dark",
}

export default function RootLayout({children,}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="id" className={`${jakarta.variable} ${grotesk.variable}`}>
      <body className="min-h-dvh bg-void font-sans text-ice antialiased">
        {children}
      </body>
    </html>
  )
}