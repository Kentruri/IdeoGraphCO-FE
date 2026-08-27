import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Cinta de medición en carga: 8 segmentos grises de anchos desiguales. */
export function TapeSkeleton({ className }: { className?: string }) {
  const widths = [22, 14, 17, 10, 12, 9, 9, 7];
  return (
    <div aria-hidden className={cn("flex h-1 w-full gap-0.5", className)}>
      {widths.map((width, index) => (
        <Skeleton
          key={index}
          className="h-full rounded-full"
          style={{ width: `${width}%` }}
        />
      ))}
    </div>
  );
}

/** Refleja 1:1 el tile de ArticleCard: cinta, imagen, meta, titular, badge. */
export function ArticleCardSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <TapeSkeleton />
      <Skeleton className="mt-3 aspect-video w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2.5 pt-4">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-11/12" />
        <div className="pt-3">
          <Skeleton className="h-6 w-40 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Espejo del destacado: imagen 7 columnas + bloque editorial 5 columnas. */
export function FeaturedArticleSkeleton() {
  return (
    <div className="grid gap-6 border-b border-border pb-16 md:grid-cols-12 md:gap-8">
      <Skeleton className="aspect-[16/10] w-full rounded-none md:col-span-7" />
      <div className="flex flex-col gap-4 md:col-span-5">
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="mt-auto space-y-3 pt-4">
          <Skeleton className="h-7 w-44 rounded-full" />
          <TapeSkeleton className="h-1.5" />
        </div>
      </div>
    </div>
  );
}

export function ArticleGridSkeleton({
  count = 9,
  featured = false,
}: {
  count?: number;
  featured?: boolean;
}) {
  return (
    <div className="space-y-16">
      {featured && <FeaturedArticleSkeleton />}
      <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: featured ? count - 1 : count }, (_, index) => (
          <ArticleCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
