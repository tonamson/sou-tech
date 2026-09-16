import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { site } from "@/src/lib/site";
import "../src/scss/style.scss";

const manrope = Manrope({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  alternates: {
    canonical: site.url,
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: site.name,
    url: site.url,
    title: site.title,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
  applicationName: site.name,
  category: "technology",
  icons: {
    icon: "/client/images/favicon.svg",
    apple: "/client/images/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={manrope.className}>
      <head>
        <link
          rel="preconnect"
          href="https://cdnjs.cloudflare.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="/client/css/bootstrap.min.css" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className="landing landing--stage">{children}</body>
    </html>
  );
}
