'use client';

import { useState, useEffect, useRef } from 'react';
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
  status: string | null;
  tierCount: number;
}

const STATUS_COLOR: Record<string, 'success' | 'gray' | 'warning' | 'error'> = {
  active: 'success',
  draft: 'gray',
  'sold-out': 'warning',
  archived: 'error',
};

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

  async function handleImportFromShopify(shopifyProduct: { id: string; handle: string; title: string } | null) {
    if (!shopifyProduct) return;
    setImporting(true);
    try {
      const res = await fetch('/api/cake-products/import-from-shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopifyProductId: shopifyProduct.id }),
      });
      const data = await res.json();
      if (res.status === 409) {
        toast.error('Already imported', 'A product linked to this Shopify product already exists');
        router.push(`/admin/cake-products/${data.existingProductId}`);
        return;
      }
      if (!res.ok) { toast.error('Import failed', data.error || 'Failed to import'); return; }
      toast.success('Imported', `"${shopifyProduct.title}" imported as cake product`);
      router.push(`/admin/cake-products/${data.id}`);
    } catch {
      toast.error('Import failed', 'An unexpected error occurred');
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <ShopifyProductPicker onSelect={handleImportFromShopify} onOpenRef={shopifyPickerRef} />
      <TableCard.Root>
        <TableCard.Header
          title="Cake Products"
          badge={products.length}
          description="Manage products available for cake ordering"
          contentTrailing={
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => shopifyPickerRef.current?.()} isDisabled={importing}>
                {importing ? 'Importing…' : 'Import from Shopify'}
              </Button>
              <Link href="/admin/cake-products/create">
                <Button variant="primary" size="sm" iconLeading={Plus}>Create Cake Product</Button>
              </Link>
            </div>
          }
        />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-tertiary">No cake products found</p>
          <p className="text-xs text-tertiary max-w-sm">Click &quot;Create Cake Product&quot; to get started.</p>
        </div>
      ) : (
        <Table aria-label="Cake Products">
          <Table.Header>
            <Table.Head isRowHeader label="Product" />
            <Table.Head label="Min People" />
            <Table.Head label="Lead Time Tiers" />
            <Table.Head label="Status" />
            <Table.Head label="" />
          </Table.Header>
          <Table.Body items={products}>
            {(product) => (
              <Table.Row key={product.id} id={product.id} onAction={() => router.push(`/admin/cake-products/${product.id}`)}>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    {product.image && <img src={product.image} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />}
                    <p className="text-sm font-medium text-primary">{product.name}</p>
                  </div>
                </Table.Cell>
                <Table.Cell><span className="text-sm text-primary">{product.cakeMinPeople ?? '—'}</span></Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-primary">{Number(product.tierCount) || 0}</span>
                  {Number(product.tierCount) === 0 && <span className="ml-2 text-xs text-warning-600">No tiers</span>}
                </Table.Cell>
                <Table.Cell>
                  <Badge color={STATUS_COLOR[product.status ?? ''] ?? 'gray'}>{product.status ?? 'unknown'}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/admin/cake-products/${product.id}`}>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded" title="Edit">
                        <Edit01 className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      )}
      </TableCard.Root>
    </>
  );
}
