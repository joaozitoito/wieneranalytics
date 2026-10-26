import { notFound } from 'next/navigation';
import { Shell } from '@/components/layout/shell';
import { ContentDetail } from '@/components/dashboard/sections';
import { loadWorkspace, parseFilters, type Query } from '@/server/repositories/workspace';
export const dynamic = 'force-dynamic';
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Query>;
}) {
  const { id } = await params,
    filters = parseFilters(await searchParams),
    data = await loadWorkspace(filters.mode),
    media = data.media.find((m) => m.id === id);
  if (!media) notFound();
  return (
    <Shell mode={filters.mode} section="conteudos">
      <ContentDetail media={media} mode={filters.mode} />
    </Shell>
  );
}
