import { notFound } from 'next/navigation';
import { Shell } from '@/components/layout/shell';
import {
  CampaignSection,
  ContentSection,
  ConversionSection,
  InstagramSection,
  IntegrationSection,
  ReportSection,
  SettingsSection,
} from '@/components/dashboard/sections';
import { loadWorkspace, parseFilters, type Query } from '@/server/repositories/workspace';
export const dynamic = 'force-dynamic';
const sections = {
  instagram: InstagramSection,
  conteudos: ContentSection,
  campanhas: CampaignSection,
  conversoes: ConversionSection,
  relatorios: ReportSection,
  integracoes: IntegrationSection,
  configuracoes: SettingsSection,
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Query>;
}) {
  const { section } = await params;
  if (!(section in sections)) notFound();
  const query = await searchParams,
    filters = parseFilters(query),
    data = await loadWorkspace(filters.mode),
    Section = sections[section as keyof typeof sections];
  return (
    <Shell mode={filters.mode} section={section}>
      <Section data={data} filters={filters} query={query} />
    </Shell>
  );
}
