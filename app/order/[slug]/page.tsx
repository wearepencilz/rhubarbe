import OrderPageClient from '../OrderPageClient';

// Prevent static generation — slug is dynamic
export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

export default function MenuBySlugPage({ params }: Props) {
  return <OrderPageClient initialSlug={params.slug} />;
}
