import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TurnoPro",
  description: "Encontrá profesionales y reservá turnos fácilmente",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
