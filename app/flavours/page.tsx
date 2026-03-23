import * as ingredientQueries from '@/lib/db/queries/ingredients';
import FlavoursPageClient from './FlavoursPageClient';

export const metadata = {
  title: 'Saveurs / Flavours – Rhubarbe',
  description: 'Toutes les saveurs et ingrédients de Rhubarbe.',
};

export default async function FlavoursPage() {
  const ingredients = await ingredientQueries.list().catch(() => []);
  return <FlavoursPageClient flavours={[]} ingredients={ingredients as any[]} />;
}
