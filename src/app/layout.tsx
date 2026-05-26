import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Two Truths & A Lie | AI Famous Personas",
  description: "Play Two Truths and a Lie against AI. Guess which statement is the lie about sports stars, historical figures, and more!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
