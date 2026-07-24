import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { FaviconCycler } from "@/components/favicon-cycler";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chute — Upload Field",
  description: "Reusable UploadThing-powered file upload components for Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <FaviconCycler />
      </body>
    </html>
  );
}
