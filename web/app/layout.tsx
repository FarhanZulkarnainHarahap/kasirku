import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";
export const metadata: Metadata = {
  title: "MY-CASHIER - Kendali Bisnis Anda",
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
