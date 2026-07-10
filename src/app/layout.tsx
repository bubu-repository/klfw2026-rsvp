import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "KLFW 2026 × Cultured by Todak — RSVP",
  description:
    "Kuala Lumpur Fashion Week 2026. Cultured by Todak presents Collection 1.0 “Battlescars”. Friday 07.08.2026, Esplanade, KLCC Park. Invitation only.",
  openGraph: {
    title: "KLFW 2026 × Cultured by Todak",
    description:
      "Collection 1.0 “Battlescars”. Friday 07.08.2026, Esplanade, KLCC Park. Invitation only, RSVP.",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d2bf0",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${anton.variable} ${archivo.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
