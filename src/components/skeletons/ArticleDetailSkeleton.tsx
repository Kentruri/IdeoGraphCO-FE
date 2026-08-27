import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Refleja el layout real del detalle: artículo + panel de análisis con encabezado. */
export function ArticleDetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_var(--spacing-aside)]">
      <article className="space-y-6">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-5 w-96 max-w-full" />
        <Skeleton className="aspect-video w-full rounded-xl" />
        <div className="space-y-3">
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
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-44" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-48 rounded-full" />
            <Skeleton className="h-4 w-full" />
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-1.5 flex-1 rounded-full" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
