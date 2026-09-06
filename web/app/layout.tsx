import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";
import "./workspace.css";
export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  title: "Kasirku - Ruang Kerja Toko",
  description:
    "Point of Sale profesional untuk bisnis modern dan multi-cabang.",
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
