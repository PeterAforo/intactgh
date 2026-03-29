import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Intact Ghana - Buy Electronics, Phones, Home Appliances in Ghana",
    template: "%s | Intact Ghana",
  },
  description:
    "Ghana's #1 destination for electronics, smartphones, laptops, TVs, and home appliances. Racing with technology - free delivery on orders over GH₵3,000.",
  keywords:
    "electronics Ghana, smartphones Ghana, laptops Ghana, Intact Ghana, buy electronics online Ghana",
  metadataBase: new URL("https://intactghana.com"),
  openGraph: {
    type: "website",
    locale: "en_GH",
    siteName: "Intact Ghana",
    title: "Intact Ghana - Buy Electronics, Phones, Home Appliances in Ghana",
    description: "Ghana's #1 destination for electronics, smartphones, laptops, TVs, and home appliances.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Intact Ghana" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Intact Ghana - Buy Electronics Online",
    description: "Ghana's #1 destination for electronics, smartphones, laptops, TVs, and home appliances.",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/logo.png",
    shortcut: "/icon.svg",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  );
}
