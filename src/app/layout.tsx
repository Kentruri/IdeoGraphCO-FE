import type { Metadata } from "next";
import {
  Archivo,
  Schibsted_Grotesk,
  Source_Serif_4,
  Spline_Sans_Mono,
} from "next/font/google";

import "./globals.css";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";
import { StoreProvider } from "@/store/provider";

/* Voces tipográficas de "Prensa instrumental" (docs/design-system.md §2):
   Archivo (display, con eje de ancho) + Schibsted Grotesk (UI) +
   Source Serif 4 (lectura larga) + Spline Sans Mono (datos). */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  axes: ["wdth"],
});
const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
});
const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-spline-mono",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Ideología en noticias políticas colombianas`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
};

/**
 * Aplica la clase `dark` antes de la primera pintura para evitar el
 * parpadeo de tema. El estado vive en Redux (preferences.slice) y se
 * sincroniza con localStorage desde ThemeToggle.
 */
const themeInitScript = `(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (_) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        "font-sans",
        archivo.variable,
        schibsted.variable,
        sourceSerif.variable,
        splineMono.variable
      )}
    >
      <body className="flex min-h-screen flex-col antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <SmoothScroll />
        <a
          href="#contenido"
          className="fixed left-4 top-4 z-100 -translate-y-20 border border-border bg-background px-4 py-2 text-sm font-medium transition-transform duration-150 ease-out-expo focus-visible:translate-y-0"
        >
          Saltar al contenido
        </a>
        <StoreProvider>
          <Navbar />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
