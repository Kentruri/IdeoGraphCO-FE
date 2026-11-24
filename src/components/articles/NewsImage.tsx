"use client";

import Image, { type ImageProps } from "next/image";
import { useState, type ReactNode } from "react";

interface NewsImageProps extends Omit<ImageProps, "onError" | "unoptimized"> {
  /** Lo que se muestra si la foto no carga por ninguna de las dos vías. */
  fallback?: ReactNode;
  /** Aviso al padre cuando la foto no carga, para que oculte su marco. */
  onFail?: () => void;
}

/**
 * Foto de un medio. Primero se pide al optimizador de Next, que la redimensiona
 * y la sirve desde el mismo origen. Algunos medios rechazan las descargas que no
 * vienen de un navegador (Las2orillas responde 403 al servidor), así que, si ese
 * pedido falla, la foto se pide directamente desde el navegador y sin Referer.
 * Si tampoco carga, se muestra `fallback` en lugar del ícono de imagen rota.
 */
export function NewsImage({ src, alt, fallback = null, onFail, ...props }: NewsImageProps) {
  const srcKey = typeof src === "string" ? src : "";
  const [failures, setFailures] = useState({ srcKey, count: 0 });
  // Los fallos se cuentan por URL: si el padre cambia de foto, se empieza de nuevo.
  const count = failures.srcKey === srcKey ? failures.count : 0;

  if (count >= 2) return <>{fallback}</>;

  const direct = count === 1;
  return (
    <Image
      key={direct ? "direct" : "optimized"}
      {...props}
      src={src}
      alt={alt}
      unoptimized={direct}
      referrerPolicy={direct ? "no-referrer" : props.referrerPolicy}
      onError={() => {
        setFailures({ srcKey, count: count + 1 });
        if (count + 1 >= 2) onFail?.();
      }}
    />
  );
}
