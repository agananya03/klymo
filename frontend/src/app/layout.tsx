import type { Metadata } from "next";
import { Lexend_Mega, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorHandling";
import AnimatedShapes from "@/components/AnimatedShapes";

const lexendMega = Lexend_Mega({
  variable: "--font-lexend",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Klymo - Anonymous Chat",
  description: "Connect with strangers anonymously and securely",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lexendMega.variable} ${spaceGrotesk.variable} antialiased bg-white text-black font-sans selection:bg-purple-500 selection:text-white`}
      >
        <ErrorBoundary>
          <ToastProvider>
            <AnimatedShapes />
            <div className="relative z-10">
              {children}
            </div>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}