"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { SearchBar } from "@/components/search/SearchBar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SITE_NAME, SOURCE_CATEGORY_META } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Masthead de prensa: cabecera con marca display expandida y una fila de
 * secciones estilo pestañas de periódico (activo = subrayado de 2px).
 */
export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Menú móvil */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" aria-label="Abrir menú">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          {/* Curva de drawer (iOS) en lugar del ease-in-out genérico. */}
          <SheetContent side="left" className="w-80 duration-300 ease-drawer">
            <SheetHeader>
              <SheetTitle className="font-display text-xl font-extrabold uppercase tracking-tight">
                {SITE_NAME}
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4 pb-6">
              <SearchBar
                className="mb-3"
                onNavigate={() => setMobileMenuOpen(false)}
              />
              <MobileNavLink
                href="/"
                active={pathname === "/"}
                onNavigate={() => setMobileMenuOpen(false)}
              >
                Portada
              </MobileNavLink>
              {SOURCE_CATEGORY_META.map((category) => (
                <MobileNavLink
                  key={category.slug}
                  href={`/fuentes/${category.slug}`}
                  active={pathname === `/fuentes/${category.slug}`}
                  onNavigate={() => setMobileMenuOpen(false)}
                >
                  {category.label}
                </MobileNavLink>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <Link
          href="/"
          className="flex min-w-0 items-baseline gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <span className="font-display text-2xl font-extrabold uppercase tracking-tight md:font-stretch-expanded">
            {SITE_NAME}
          </span>
          <span className="hidden truncate font-mono text-[11px] text-muted-foreground xl:inline">
            ideología medida en noticias políticas colombianas
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <SearchBar className="hidden w-64 md:block" />
          <ThemeToggle />
        </div>
      </div>

      {/* Secciones (escritorio): pestañas de periódico. */}
      <nav
        aria-label="Categorías de fuente"
        className="hidden border-t lg:block"
      >
        <div className="mx-auto flex h-10 w-full max-w-7xl items-stretch gap-5 px-4 sm:px-6">
          <DesktopNavLink href="/" active={pathname === "/"}>
            Portada
          </DesktopNavLink>
          {SOURCE_CATEGORY_META.map((category) => (
            <DesktopNavLink
              key={category.slug}
              href={`/fuentes/${category.slug}`}
              active={pathname === `/fuentes/${category.slug}`}
            >
              {category.label}
            </DesktopNavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}

function DesktopNavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center border-b-2 text-sm outline-none transition-colors duration-150 ease-out-expo focus-visible:ring-2 focus-visible:ring-ring/60",
        active
          ? "border-foreground font-medium text-foreground"
          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  active,
  onNavigate,
  children,
}: {
  href: string;
  active: boolean;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "border-l-2 px-3 py-2 text-sm outline-none transition-colors duration-150 ease-out-expo focus-visible:ring-2 focus-visible:ring-ring/60",
        active
          ? "border-foreground font-medium text-foreground"
          : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
