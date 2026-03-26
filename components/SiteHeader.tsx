import * as settingsQueries from '@/lib/db/queries/settings';
import SiteHeaderClient from '@/components/SiteHeaderClient';

interface SiteHeaderProps {
  theme?: 'dark' | 'light';
}

export default async function SiteHeader({ theme = 'dark' }: SiteHeaderProps) {
  const settings = await settingsQueries.getAll().catch(() => ({})) as any;
  const logo: string = settings?.logo || '';
  const companyName: string = settings?.companyName || 'Janine';

  return <SiteHeaderClient logo={logo} companyName={companyName} />;
}
