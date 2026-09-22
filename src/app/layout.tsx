import type { Metadata } from "next";
import {
  Architects_Daughter,
  Caveat,
  Inter,
  JetBrains_Mono,
  Kalam,
} from "next/font/google";
import "./globals.css";

const kalam = Kalam({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-heading",
});

const architects = Architects_Daughter({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hand",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: "YouTube → Handwritten Notes",
  description:
    "Turn YouTube captions into neomorphic handwritten study notes with Gemini 2.5 Flash.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${kalam.variable} ${architects.variable} ${caveat.variable} ${jetbrains.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#e0e5ec] text-slate-700">{children}</body>
    </html>
  );
}
