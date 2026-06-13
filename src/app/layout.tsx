import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { FloatingCTA } from "@/components/layout/FloatingCTA";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trade Metrix AI — Institutional Trading Terminal",
  description:
    "AI-powered institutional-grade trading platform with signals, backtesting, auto-trading, and analytics. Built for professional traders and hedge funds.",
  keywords: [
    "trading platform",
    "AI signals",
    "backtesting",
    "algo trading",
    "hedge fund",
    "fintech",
  ],
};

import { MarketDataProvider } from "@/components/providers/MarketDataContext";
import { DemoProvider } from "@/components/providers/DemoContext";
import { AuthProvider } from "@/components/providers/AuthContext";
import { AuthWrapper } from "@/components/layout/AuthWrapper";
import { DemoControlPanel } from "@/components/ui/DemoControlPanel";
import { DemoToastStack } from "@/components/ui/DemoToastStack";
import { LeadCaptureModal } from "@/components/ui/LeadCaptureModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground relative overflow-x-hidden">
        {/* Ambient background neon blur blobs */}
        <div className="absolute top-[10%] left-[25%] w-[400px] h-[400px] rounded-full bg-neon-blue/3 blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] rounded-full bg-neon-purple/2 blur-[100px] pointer-events-none z-0" />
        <DemoProvider>
          <AuthProvider>
            <MarketDataProvider>
              <AuthWrapper>
                <Sidebar />
                <main className="lg:ml-[260px] min-h-screen bg-grid-pattern transition-all duration-300">
                  {children}
                </main>
                <FloatingCTA />
                <DemoControlPanel />
                <DemoToastStack />
                <LeadCaptureModal />
              </AuthWrapper>
            </MarketDataProvider>
          </AuthProvider>
        </DemoProvider>
      </body>
    </html>
  );
}
