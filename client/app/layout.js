import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import ToastProvider from "@/components/providers/ToastProvider";
import { ChatProvider } from "@/components/chat/ChatContext";
import ChatBot from "@/components/chat/ChatBot";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "UnderwriteAI — Intelligent Risk Assessment",
  description: "AI-powered insurance underwriting platform that automates risk assessment and policy decisions using traditional and alternative data sources.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`} style={{ fontFamily: "var(--font-geist-sans)" }}>
        <SessionProvider>
          <ChatProvider>
            {children}
            <ChatBot />
          </ChatProvider>
          <ToastProvider />
        </SessionProvider>
      </body>
    </html>
  );
}
