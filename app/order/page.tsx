import { getProducts } from '@/lib/db';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata = {
  title: 'Order - Rhubarbe',
  description: 'Order sweet and savory items from Rhubarbe.',
};

interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  serves: string | null;
  price: number | null;
  allergens: string[];
  image: string | null;
  status: string;
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="flex flex-col gap-3">
      {product.image && (
        <div className="aspect-[3/4] overflow-hidden bg-gray-100">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm uppercase tracking-widest" style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}>
            {product.name}
          </h3>
          {product.price && (
            <span className="text-sm shrink-0" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              ${product.price}
            </span>
          )}
        </div>
        {product.description && (
          <p className="text-xs text-gray-500 leading-relaxed">{product.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          {product.serves && (
            <span className="text-xs text-gray-400">{product.serves} pers.</span>
          )}
          {product.allergens && product.allergens.length > 0 && (
            <span className="text-xs text-gray-400">{product.allergens.join(', ')}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function OrderPage() {
  const allProducts: Product[] = await getProducts().catch(() => []);
  const active = allProducts.filter((p) => p.status === 'active');
  const sweet = active.filter((p) => p.category === 'sweet');
  const savory = active.filter((p) => p.category === 'savory');

  return (
    <>
      <SiteHeader />
      <main className="pt-32 pb-24 px-4 md:px-8 max-w-screen-xl mx-auto">
        <div className="mb-16">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
            Pre-orders only
          </p>
          <h1 className="text-2xl md:text-3xl uppercase tracking-widest" style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}>
            Order
          </h1>
          <p className="mt-4 text-sm text-gray-500 max-w-lg leading-relaxed">
            Pickup every Saturday between 9am and 12pm at 1320 rue Charlevoix, Pointe Saint-Charles.
          </p>
        </div>

        {sweet.length > 0 && (
          <section className="mb-20">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-8 pb-3 border-b border-gray-200" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              Sweet
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {sweet.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {savory.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-8 pb-3 border-b border-gray-200" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              Savory
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {savory.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
