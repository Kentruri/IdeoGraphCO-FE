"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IDEOLOGY_DISPLAY_ORDER, IDEOLOGY_META } from "@/types/ideology";

/**
 * Leyenda de las 8 clases ideológicas: la firma visual del producto.
 * Cada clase es un trigger de tooltip enfocable con su descripción,
 * de modo que la explicación es alcanzable por teclado y táctil
 * (sustituye al patrón inaccesible `title=`).
 */
export function IdeologyLegend() {
  return (
    <TooltipProvider delayDuration={200}>
      <ul
        aria-label="Las ocho clases ideológicas"
        className="flex flex-wrap gap-x-1 gap-y-1.5"
      >
        {IDEOLOGY_DISPLAY_ORDER.map((ideologyClass) => {
          const meta = IDEOLOGY_META[ideologyClass];
          return (
            <li key={ideologyClass}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex cursor-help items-center gap-1.5 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors duration-150 ease-swift outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.cssVar }}
                    />
                    {meta.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}>
                  {meta.description}
                </TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </TooltipProvider>
  );
}
