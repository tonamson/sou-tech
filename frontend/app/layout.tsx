import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "../src/scss/style.scss";

const manrope = Manrope({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoU Technology Solutions | Phần mềm, SaaS & Web3",
  description:
    "SoU phát triển phần mềm theo yêu cầu, nền tảng SaaS và giải pháp Blockchain & Web3. Liên hệ contact@soutechnology.vn để trao đổi dự án.",
  icons: {
    icon: "/client/images/favicon.svg",
    apple: "/client/images/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={manrope.className}>
      <head>
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
