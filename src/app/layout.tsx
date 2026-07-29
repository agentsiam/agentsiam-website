import type { Metadata } from "next";
import {
  Poppins,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  Unbounded,
  Noto_Sans_Thai,
} from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["700", "800"],
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["500"],
  subsets: ["latin"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  weight: ["800", "900"],
  subsets: ["latin"],
});

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  weight: ["400", "500", "600"],
  subsets: ["thai"],
});

export const metadata: Metadata = {
  title: "AgentSiam",
  description:
    "Feasibility, permission and management for short-term rentals in Chiang Mai.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} ${plexSans.variable} ${plexMono.variable} ${unbounded.variable} ${notoThai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
