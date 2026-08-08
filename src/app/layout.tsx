import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Col/Labs — Directorio de startups de Latinoamérica",
  description:
    "Directorio del ecosistema startup de LatAm: empresas, industrias, etapas y vacantes abiertas. Empezando por Colombia.",
  authors: [{ name: "Col/Labs" }],
  openGraph: {
    title: "Col/Labs — Directorio de startups de Latinoamérica",
    description:
      "Directorio del ecosistema startup de LatAm: empresas, industrias, etapas y vacantes abiertas.",
    type: "website",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: "Col/Labs — Directorio de startups de Latinoamérica",
    description:
      "Directorio del ecosistema startup de LatAm: empresas, industrias, etapas y vacantes abiertas.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full flex flex-col">
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
