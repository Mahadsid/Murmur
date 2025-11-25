// https://orpc.unnoq.com/docs/adapters/next   IMPORT FOR OPTIMIZE SSR (4.th File)
import "@/lib/orpc.server" //THis is used for pre-rendring SSR.

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider } from "@/components/ui/AuthProvider";
import { Providers } from "@/lib/providers";
import { Toaster } from "@/components/ui/sonner";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Murmur📟",
  description: "AI-powered chat app for your business.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Providers of tanstack query using orpc more file in lib folder */}
            <Providers> 
              {children}
            </Providers>
            <Toaster closeButton position="top-center"/>
          </ThemeProvider>
      </body>
    </html>
    </AuthProvider>
  );
}
