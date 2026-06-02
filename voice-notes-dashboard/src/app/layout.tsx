import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'voice notes',
  description: 'Apple Watch voice memos dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#111111] text-[#f0f0f0]">
        {children}
      </body>
    </html>
  );
}
