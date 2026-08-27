import { TapeSkeleton } from "@/components/skeletons/ArticleCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** Espejo del detalle: lectura serif + ficha de medición lateral. */
export function ArticleDetailSkeleton() {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_var(--spacing-aside)]">
      <article className="space-y-6">
        <Skeleton className="h-3.5 w-56" />
        <Skeleton className="h-3.5 w-72" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-4/5" />
        <Skeleton className="h-6 w-96 max-w-full" />
        <Skeleton className="aspect-video w-full rounded-none" />
        <div className="max-w-prose space-y-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton
              key={index}
              className="h-4"
              style={{ width: `${100 - (index % 4) * 8}%` }}
            />
          ))}
        </div>
      </article>

      <aside>
        <div className="rule-double bg-card px-6 pb-6 pt-5 ring-1 ring-border sm:px-7 sm:pb-7">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-6 h-7 w-44 rounded-full" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-6 h-10 w-28" />
          <TapeSkeleton className="my-6 h-2" />
          <div className="space-y-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-1.5 flex-1 rounded-full" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
