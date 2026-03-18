import Link from 'next/link';
import { getProducts } from '@/lib/db';
import { getT, t } from '@/lib/i18n';

const T = getT('fr');

export const metadata = {
  title: 'Commander - Rhubarbe',
  description: 'Commandez des articles sucrés et salés de Rhubarbe.',
};

interface Product {
  id: string;
  slug?: string;
  shopifyProductHandle?: string | null;
  title?: string;
  name?: string; // legacy field
  category: string;
  description: string | null;
  serves: string | null;
  price: number | null;
  allergens: string[];
  image: string | null;
  status: string;
}

function ProductCard({ product }: { product: Product }) {
  const displayName = t(product, 'title', 'fr') || product.name || '';
  const description = t(product, 'description', 'fr');
  const handle = product.shopifyProductHandle || product.slug || product.id;

  const inner = (
    <div className="flex flex-col gap-3">
      {product.image && (
        <div className="aspect-[3/4] overflow-hidden bg-gray-100">
          <img src={product.image} alt={displayName} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm uppercase tracking-widest" style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}>
            {displayName}
          </h3>
          {product.price != null && product.price > 0 && (
            <span className="text-sm shrink-0" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              ${(product.price / 100).toFixed(2)}
            </span>
          )}
        </div>
        {product.description && (
          <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          {product.serves && (
            <span className="text-xs text-gray-400">{T.product.serves(product.serves)}</span>
          )}
          {product.allergens && product.allergens.length > 0 && (
            <span className="text-xs text-gray-400">{product.allergens.join(', ')}</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Link href={`/products/${handle}`} className="group block">
      {inner}
    </Link>
  );
}

export default async function OrderPage() {
  const allProducts: Product[] = await getProducts().catch(() => []);
  const active = allProducts.filter((p) => p.status === 'active');
  const sweet = active.filter((p) => p.category === 'sweet');
  const savory = active.filter((p) => p.category === 'savory');
  const other = active.filter((p) => p.category !== 'sweet' && p.category !== 'savory');

  return (
    <>
      <main className="pt-32 pb-24 px-4 md:px-8 max-w-screen-xl mx-auto">
        <div className="mb-16">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
            {T.order.preordersOnly}
          </p>
          <h1 className="text-2xl md:text-3xl uppercase tracking-widest" style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}>
            {T.order.title}
          </h1>
          <p className="mt-4 text-sm text-gray-500 max-w-lg leading-relaxed">
            {T.order.pickup}
          </p>
        </div>

        {sweet.length > 0 && (
          <section className="mb-20">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-8 pb-3 border-b border-gray-200" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {T.order.sweet}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {sweet.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {savory.length > 0 && (
          <section className="mb-20">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-8 pb-3 border-b border-gray-200" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {T.order.savory}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {savory.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {other.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-8 pb-3 border-b border-gray-200" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {T.order.other}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {other.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
