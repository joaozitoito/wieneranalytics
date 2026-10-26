import { Shell } from '@/components/layout/shell';
import { Overview } from '@/components/dashboard/overview';
import { loadWorkspace, parseFilters, type Query } from '@/server/repositories/workspace';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<Query> }) {
  const filters = parseFilters(await searchParams);
  const data = await loadWorkspace(filters.mode);
  return (
    <Shell mode={filters.mode} section="">
      <Overview data={data} filters={filters} />
    </Shell>
  );
}
