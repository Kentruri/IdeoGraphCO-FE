import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las fotos vienen de los medios del corpus (83 dominios, más sus CDN
    // como i0.wp.com), así que se acepta cualquier host. http incluido:
    // el optimizador las sirve desde el mismo origen, sin contenido mixto.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
