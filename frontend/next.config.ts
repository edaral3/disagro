import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Evita que Turbopack suba directorios buscando un lockfile raíz y se
  // confunda con un package-lock.json ajeno al proyecto en el home del usuario.
  turbopack: {
    root: path.join(__dirname),
  },
  // Build standalone: copia solo lo necesario para correr en producción
  // (usado por el Dockerfile multi-stage).
  output: "standalone",
};

export default nextConfig;
