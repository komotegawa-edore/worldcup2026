import type { Metadata, Viewport } from "next";
import { Oswald, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-d",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-b",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FIFA ワールドカップ 2026 | トーナメント速報",
  description:
    "FIFA ワールドカップ 2026 アメリカ・カナダ・メキシコ大会 決勝トーナメントのリアルタイム速報・トーナメント表・試合結果",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${oswald.variable} ${notoSansJP.variable}`}>
      <body>{children}</body>
    </html>
  );
}
