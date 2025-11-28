import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { TemperatureUnitProvider } from "@/context/TemperatureUnitContext";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wise Weather",
  description: "Collaborative and intelligent weather app",
};

import { UIProvider } from '../context/UIContext';
import Footer from '../components/Footer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <UIProvider>
          <LanguageProvider>
            <TemperatureUnitProvider>
              <div className="app-container">
                <Header />
                <main className="main-content">
                  {children}
                </main>
                <Footer />
              </div>
            </TemperatureUnitProvider>
          </LanguageProvider>
        </UIProvider>
      </body>
    </html>
  );
}
