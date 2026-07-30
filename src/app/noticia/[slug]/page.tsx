import { ArticleDetailPage } from "@/components/pages/ArticleDetailPage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticleDetailRoute({ params }: PageProps) {
  const { slug } = await params;
  return <ArticleDetailPage slug={slug} />;
}
