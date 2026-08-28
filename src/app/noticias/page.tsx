import type { Metadata } from "next";

import { NewsFeed } from "@/components/landing/NewsFeed";

export const metadata: Metadata = {
  title: "Noticias",
  description:
    "Noticias políticas analizadas por el clasificador, con filtros por ideología, fuente y fecha.",
};

export default function NewsRoute() {
  return <NewsFeed standalone />;
}
