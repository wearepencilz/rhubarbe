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

interface VolumeProduct {
  id: string;
  name: string;
  image: string | null;
  volumeMinOrderQuantity: number | null;
  volumeEnabled: boolean;
  status: string | null;
  tierCount: number;
  cateringType: string | null;
  cateringEndDate: string | null;
}

const STATUS_COLOR: Record<string, 'success' | 'gray' | 'warning' | 'error'> = {
  active: 'success',
  draft: 'gray',
  'sold-out': 'warning',
  archived: 'error',
};

const TYPE_LABELS: Record<string, string> = {
  brunch: 'Brunch',
  lunch: 'Lunch',
  dinatoire: 'Dînatoire',
};

const TYPE_ORDER = ['brunch', 'lunch', 'dinatoire', '__unassigned__'];

function isExpired(endDate: string | null): boolean {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

export default function VolumeProductsPage() {
  const router = useRouter();
  const toast = useToast();
  const [products, setProducts] = useState<VolumeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const shopifyPickerRef = useRef<(() => void) | null>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await fetch('/api/volume-products');
      if (res.ok) setProducts(await res.json());
    } catch (error) {
      console.error('Error fetching catering products:', error);
    } finally {
      setLoading(false);
    }
  }

  const [pendingImports, setPendingImports] = useState<{ id: string; handle: string; title: string }[]>([]);
  const [pendingType, setPendingType] = useState('');

  async function handleImportMultiple(shopifyProducts: { id: string; handle: string; title: string }[]) {
    if (shopifyProducts.length === 0) return;
    // Show type selection step before importing
    setPendingImports(shopifyProducts);
    setPendingType('');
  }

  async function confirmImport() {
    if (pendingImports.length === 0) return;
    setImporting(true);
    let imported = 0;
    for (const sp of pendingImports) {
      try {
        const res = await fetch('/api/volume-products/import-from-shopify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shopifyProductId: sp.id, cateringType: pendingType || null }),
        });
        if (res.ok) imported++;
      } catch { /* skip failures */ }
    }
    setPendingImports([]);
    if (imported > 0) {
      toast.success('Imported', `${imported} product${imported > 1 ? 's' : ''} imported`);
      fetchData();
    } else {
      toast.error('Import failed', 'No products could be imported');
    }
    setImporting(false);
  }

  const grouped = useMemo(() => {
    const groups: Record<string, VolumeProduct[]> = {};
    for (const type of TYPE_ORDER) groups[type] = [];
    for (const p of products) {
      const key = p.cateringType && TYPE_ORDER.includes(p.cateringType) ? p.cateringType : '__unassigned__';
      groups[key].push(p);
    }
    return groups;
  }, [products]);

  function renderGroup(typeKey: string, items: VolumeProduct[]) {
    if (items.length === 0) return null;
    const label = typeKey === '__unassigned__' ? 'Uncategorized' : (TYPE_LABELS[typeKey] ?? typeKey);
    return (
      <TableCard.Root key={typeKey}>
        <TableCard.Header title={label} badge={items.length} />
        <Table aria-label={`${label} Catering Products`}>
          <Table.Header>
            <Table.Head isRowHeader label="Product" />
            <Table.Head label="Min Qty" />
            <Table.Head label="Tiers" />
            <Table.Head label="Status" />
            <Table.Head label="" />
          </Table.Header>
          <Table.Body items={items}>
            {(product) => (
              <Table.Row key={product.id} id={product.id} onAction={() => router.push(`/admin/volume-products/${product.id}`)}>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gray-100" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-primary">{product.name}</p>
                      {isExpired(product.cateringEndDate) && <span className="text-xs text-error-600">Expired</span>}
                      {product.cateringEndDate && !isExpired(product.cateringEndDate) && (
                        <span className="text-xs text-gray-400">Ends {new Date(product.cateringEndDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell><span className="text-sm text-primary">{product.volumeMinOrderQuantity ?? '—'}</span></Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-primary">{Number(product.tierCount) || 0}</span>
                  {Number(product.tierCount) === 0 && <span className="ml-2 text-xs text-warning-600">No tiers</span>}
                </Table.Cell>
                <Table.Cell><Badge color={STATUS_COLOR[product.status ?? ''] ?? 'gray'}>{product.status ?? 'unknown'}</Badge></Table.Cell>
                <Table.Cell>
                  <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/admin/volume-products/${product.id}`}>
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

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Catering Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage products available for catering orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => shopifyPickerRef.current?.()} isDisabled={importing}>
            {importing ? 'Importing…' : 'Import from Shopify'}
          </Button>
          <Link href="/admin/volume-products/create">
            <Button variant="primary" size="sm" iconLeading={Plus}>Create Catering Product</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-tertiary">No catering products found</p>
          <p className="text-xs text-tertiary max-w-sm">Import from Shopify or create a new catering product to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {TYPE_ORDER.map((type) => renderGroup(type, grouped[type] ?? []))}
        </div>
      )}

      {/* Catering type selection step */}
      {pendingImports.length > 0 && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPendingImports([])}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Set Catering Type</h3>
              <p className="text-sm text-gray-500 mt-1">
                {pendingImports.length} product{pendingImports.length > 1 ? 's' : ''} selected. Choose a catering type to apply to all.
              </p>
            </div>
            <div className="p-6 space-y-3">
              {[
                { value: 'brunch', label: 'Brunch' },
                { value: 'lunch', label: 'Lunch' },
                { value: 'dinatoire', label: 'Dînatoire' },
              ].map((opt) => (
                <button key={opt.value} type="button" onClick={() => setPendingType(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    pendingType === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
              <button type="button" onClick={() => setPendingType('')}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  pendingType === '' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-500'
                }`}>
                <span className="text-sm font-medium">Skip — set later</span>
              </button>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex gap-3">
              <Button variant="secondary" size="md" onClick={() => setPendingImports([])} className="flex-1">Cancel</Button>
              <Button variant="primary" size="md" onClick={confirmImport} isLoading={importing} className="flex-1">
                Import {pendingImports.length} product{pendingImports.length > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
