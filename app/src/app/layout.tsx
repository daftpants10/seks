import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Be Hear Now",
  description: "A place to record what you're hearing. Not to perform it.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
