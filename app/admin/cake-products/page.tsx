'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableCard } from '@/src/app/admin/components/ui/application/table/table';
import { Badge } from '@/src/app/admin/components/ui/base/badges/badges';
import { Button } from '@/app/admin/components/ui/button';
import { Edit01, Plus } from '@untitledui/icons';
import Link from 'next/link';
import ShopifyProductPicker from '@/app/admin/components/ShopifyProductPicker';
import { useToast } from '@/app/admin/components/ToastContainer';

interface CakeProduct {
  id: string;
  name: string;
  image: string | null;
  cakeMinPeople: number | null;
  cakeEnabled: boolean;
  cakeProductType: string | null;
  status: string | null;
  tierCount: number;
}

const STATUS_COLOR: Record<string, 'success' | 'gray' | 'warning' | 'error'> = {
  active: 'success',
  draft: 'gray',
  'sold-out': 'warning',
  archived: 'error',
};

const TYPE_LABELS: Record<string, string> = {
  cakes: 'Cakes',
  tasting: 'Tasting',
  addons: 'Add-Ons',
};

const TYPE_ORDER = ['cakes', 'tasting', 'addons', '__unassigned__'];

function getGroup(cakeProductType: string | null): string {
  switch (cakeProductType) {
    case 'cake-xxl':
    case 'sheet-cake':
    case 'wedding-cake-tiered':
    case 'croquembouche':
      return 'cakes';
    case 'wedding-cake-tasting':
      return 'tasting';
    case 'cake-addon':
      return 'addons';
    default:
      return '__unassigned__';
  }
}

export default function CakeProductsPage() {
  const router = useRouter();
  const toast = useToast();
  const [products, setProducts] = useState<CakeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const shopifyPickerRef = useRef<(() => void) | null>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await fetch('/api/cake-products');
      if (res.ok) setProducts(await res.json());
    } catch (error) {
      console.error('Error fetching cake products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleImportMultiple(shopifyProducts: { id: string; handle: string; title: string }[]) {
    if (shopifyProducts.length === 0) return;
    setImporting(true);
    let imported = 0;
    for (const sp of shopifyProducts) {
      try {
        const res = await fetch('/api/cake-products/import-from-shopify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shopifyProductId: sp.id }),
        });
        if (res.ok) imported++;
      } catch { /* skip failures */ }
    }
    if (imported > 0) {
      toast.success('Imported', `${imported} product${imported > 1 ? 's' : ''} imported`);
      fetchData();
    } else {
      toast.error('Import failed', 'No products could be imported');
    }
    setImporting(false);
  }

  const grouped = useMemo(() => {
    const groups: Record<string, CakeProduct[]> = {};
    for (const type of TYPE_ORDER) groups[type] = [];
    for (const p of products) {
      const key = getGroup(p.cakeProductType);
      groups[key].push(p);
    }
    return groups;
  }, [products]);

  function renderGroup(typeKey: string, items: CakeProduct[]) {
    if (items.length === 0) return null;
    const label = typeKey === '__unassigned__' ? 'Uncategorized' : (TYPE_LABELS[typeKey] ?? typeKey);
    return (
      <TableCard.Root key={typeKey}>
        <TableCard.Header title={label} badge={items.length} />
        <Table aria-label={`${label} Cake Products`}>
          <Table.Header>
            <Table.Head isRowHeader label="Product" />
            <Table.Head label="Min People" />
            <Table.Head label="Tiers" />
            <Table.Head label="Status" />
            <Table.Head label="" />
          </Table.Header>
          <Table.Body items={items}>
            {(product) => (
              <Table.Row key={product.id} id={product.id} onAction={() => router.push(`/admin/cake-products/${product.id}`)}>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gray-100" />
                    )}
                    <p className="text-sm font-medium text-primary">{product.name}</p>
                  </div>
                </Table.Cell>
                <Table.Cell><span className="text-sm text-primary">{product.cakeMinPeople ?? '—'}</span></Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-primary">{Number(product.tierCount) || 0}</span>
                  {Number(product.tierCount) === 0 && <span className="ml-2 text-xs text-warning-600">No tiers</span>}
                </Table.Cell>
                <Table.Cell><Badge color={STATUS_COLOR[product.status ?? ''] ?? 'gray'}>{product.status ?? 'unknown'}</Badge></Table.Cell>
                <Table.Cell>
                  <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/admin/cake-products/${product.id}`}>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded" title="Edit"><Edit01 className="w-4 h-4" /></button>
                    </Link>
                  </div>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </TableCard.Root>
    );
  }

  return (
    <>
      <ShopifyProductPicker onSelect={() => {}} onSelectMultiple={handleImportMultiple} multiSelect onOpenRef={shopifyPickerRef} trigger={<span />} />

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Cake Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage products available for cake ordering</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => shopifyPickerRef.current?.()} isDisabled={importing}>
            {importing ? 'Importing…' : 'Import from Shopify'}
          </Button>
          <Link href="/admin/cake-products/create">
            <Button variant="primary" size="sm" iconLeading={Plus}>Create Cake Product</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-tertiary">No cake products found</p>
          <p className="text-xs text-tertiary max-w-sm">Import from Shopify or create a new cake product to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {TYPE_ORDER.map((type) => renderGroup(type, grouped[type] ?? []))}
        </div>
      )}
    </>
  );
}
