import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quality Report | Belden Brick and Supply",
  description: "Internal tracker for defective/damaged goods delivered to customers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
