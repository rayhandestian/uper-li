import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Analytics } from "@vercel/analytics/next";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://uper.li/#organization",
      "name": "Universitas Pertamina",
      "url": "https://universitaspertamina.ac.id",
      "logo": {
        "@type": "ImageObject",
        "url": "https://uper.li/UPer.li-1000x1000.png",
        "width": 1000,
        "height": 1000
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://uper.li/#website",
      "url": "https://uper.li",
      "name": "UPer.li - Link Shortener",
      "description": "Exclusive URL shortener service for Universitas Pertamina community. Create, manage, and track shortened links with analytics and security features.",
      "publisher": {
        "@id": "https://uper.li/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://uper.li/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ]
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UPer.li - Link Shortener",
  description: "Exclusive URL shortener service for Universitas Pertamina community. Create, manage, and track shortened links with analytics and security features.",
  keywords: ["URL shortener", "link shortener", "Universitas Pertamina", "UPer.li", "link management", "analytics", "QR code"],
  authors: [{ name: "Universitas Pertamina Computer Science" }],
  creator: "Universitas Pertamina",
  publisher: "Universitas Pertamina",
  openGraph: {
    title: "UPer.li - Link Shortener",
    description: "Exclusive URL shortener service for Universitas Pertamina community. Create, manage, and track shortened links with analytics and security features.",
    url: "https://uper.li",
    siteName: "UPer.li",
    images: [
      {
        url: "/UPer.li-1000x1000.png",
        width: 1000,
        height: 1000,
        alt: "UPer.li Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UPer.li - Link Shortener",
    description: "Exclusive URL shortener service for Universitas Pertamina community. Create, manage, and track shortened links with analytics and security features.",
    images: ["/UPer.li-1000x1000.png"],
    creator: "@UniversitasPertamina",
  },
  icons: {
    icon: "/UPer.li-128x128.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
