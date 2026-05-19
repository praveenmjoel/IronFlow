import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import FirebaseProvider from "@/components/FirebaseProvider";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "IronFlow – Personal Workout OS",
  description: "Precision workout planning, guided execution, and progressive overload tracking.",
};

export const viewport: Viewport = {
  themeColor: "#080b14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen">
        <FirebaseProvider>
          <main className="max-w-lg mx-auto pb-24 min-h-screen">
            {children}
          </main>
          <NavBar />
        </FirebaseProvider>
      </body>
    </html>
  );
}
