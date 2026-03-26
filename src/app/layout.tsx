import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seltifika Yönetim",
  description: "Bağımsız sertifika üretim ve e-posta yönetim paneli.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
