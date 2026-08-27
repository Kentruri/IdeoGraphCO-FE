import { ArticleCard } from "@/components/articles/ArticleCard";
import type { Article } from "@/types/article";

interface ArticleGridProps {
  articles: Article[];
}

export function ArticleGrid({ articles }: ArticleGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, index) => (
        <div
          key={article.id}
          className="h-full motion-safe:animate-fade-up"
          // Cascada de entrada: 40ms entre tarjetas (decorativa, no bloquea).
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <ArticleCard article={article} />
        </div>
      ))}
    </div>
  );
}
