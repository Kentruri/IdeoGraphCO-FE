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

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Menú móvil */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" aria-label="Abrir menú">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="font-serif text-xl">
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

        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-xl font-bold tracking-tight">
            {SITE_NAME}
          </span>
          <span className="hidden text-xs text-muted-foreground md:inline">
            Ideología en noticias políticas colombianas
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <SearchBar className="hidden w-56 md:block" />
          <ThemeToggle />
        </div>
      </div>

      {/* Categorías de fuente (escritorio) */}
      <nav
        aria-label="Categorías de fuente"
        className="hidden border-t lg:block"
      >
        <div className="mx-auto flex h-10 w-full max-w-7xl items-center gap-1 px-4 sm:px-6">
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
        "rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-secondary font-medium text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
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
        "rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-secondary font-medium text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
