import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AGSgpt | Understand it step by step",
  description: "AGSgpt helps Year 8-10 students understand Mathematics, Science, and English through clear, detailed steps.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}