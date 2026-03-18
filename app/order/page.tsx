import { getProducts } from '@/lib/db';
import OrderPageClient from './OrderPageClient';

export const metadata = {
  title: 'Commander / Order - Rhubarbe',
  description: 'Commandez des articles sucrés et salés de Rhubarbe.',
};

export default async function OrderPage() {
  const products = await getProducts().catch(() => []);
  return <OrderPageClient products={products} />;
}
