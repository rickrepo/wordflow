import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WordFlow - Learn to Read",
  description:
    "A fun app where children trace words with their finger to hear them read aloud",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WordFlow",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div style={{ position: 'fixed', top: 4, right: 8, zIndex: 9999, fontSize: 10, color: 'rgba(0,0,0,0.3)' }}>v3.8</div>
        {children}
      </body>
    </html>
  );
}
