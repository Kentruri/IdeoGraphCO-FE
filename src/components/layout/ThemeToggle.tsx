"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { themeHydrated, themeToggled } from "@/store/slices/preferences.slice";

/**
 * Interruptor claro/oscuro respaldado por Redux.
 * El script inline del layout aplica la clase `dark` antes de la primera
 * pintura; aquí solo sincronizamos el store con el DOM y persistimos.
 */
export function ThemeToggle() {
  const dispatch = useAppDispatch();
  const { theme, themeHydrated: hydrated } = useAppSelector(
    (state) => state.preferences
  );

  useEffect(() => {
    dispatch(
      themeHydrated(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      )
    );
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem("theme", theme);
    } catch {
      // almacenamiento no disponible (modo privado, etc.)
    }
  }, [theme, hydrated]);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={
        theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
      }
      onClick={() => dispatch(themeToggled())}
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  );
}
