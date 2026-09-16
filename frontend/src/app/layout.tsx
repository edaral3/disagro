import type { Metadata } from "next";
import { AppProviders } from "@/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Disagro — Feria de Promociones",
  description: "Confirmación de asistencia y selección de servicios y productos",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
