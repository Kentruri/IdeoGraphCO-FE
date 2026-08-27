import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "skeleton-sheen rounded-sm bg-muted motion-safe:animate-shimmer motion-reduce:animate-pulse",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
