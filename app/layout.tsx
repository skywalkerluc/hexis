import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hexis",
  description: "A multi-user self-cultivation platform for deliberate attribute growth.",
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

export default RootLayout;
