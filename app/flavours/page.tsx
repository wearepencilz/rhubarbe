import { getFlavours, getIngredients } from '@/lib/db';
import FlavoursPageClient from './FlavoursPageClient';

export const metadata = {
  title: 'Saveurs / Flavours – Rhubarbe',
  description: 'Toutes les saveurs et ingrédients de Rhubarbe.',
};

export default async function FlavoursPage() {
  const [flavours, ingredients] = await Promise.all([
    getFlavours().catch(() => []),
    getIngredients().catch(() => []),
  ]);

  return <FlavoursPageClient flavours={flavours as any[]} ingredients={ingredients as any[]} />;
}
