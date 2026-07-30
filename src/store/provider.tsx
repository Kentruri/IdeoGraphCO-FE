"use client";

import { useRef } from "react";
import { Provider } from "react-redux";

import { makeStore, type AppStore } from "@/store";

/**
 * Proveedor del store de Redux. Se crea una única instancia por árbol de
 * cliente (patrón recomendado para App Router: el store nunca vive en
 * módulos compartidos con el servidor).
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  storeRef.current ??= makeStore();

  return <Provider store={storeRef.current}>{children}</Provider>;
}
