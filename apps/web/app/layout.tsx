import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono } from "next/font/google";

const cardMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-card-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Era Card",
  description:
    "Your AI usage, on one shareable card. Local parsing, aggregate numbers only.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cardMono.variable}>
      <body
        style={{
          margin: 0,
          background: "#0b0e11",
          color: "#e6edf3",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
