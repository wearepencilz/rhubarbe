import { getIngredients } from '@/lib/db';
import FlavoursPageClient from './FlavoursPageClient';

export const metadata = {
  title: 'Saveurs / Flavours – Rhubarbe',
  description: 'Toutes les saveurs et ingrédients de Rhubarbe.',
};

export default async function FlavoursPage() {
  const ingredients = await getIngredients().catch(() => []);
  return <FlavoursPageClient flavours={[]} ingredients={ingredients as any[]} />;
}
