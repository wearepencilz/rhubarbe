'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableCard } from '@/src/app/admin/components/ui/application/table/table';
import { Badge } from '@/src/app/admin/components/ui/base/badges/badges';
import { Button } from '@/app/admin/components/ui/button';
import { Edit01, Plus } from '@untitledui/icons';
import Link from 'next/link';

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

const TYPE_ORDER = ['brunch', 'lunch', 'dinatoire', '__unassigned__'] as const;

function isExpired(endDate: string | null): boolean {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

export default function VolumeProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<VolumeProduct[]>([]);
  const [loading, setLoading] = useState(true);

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

  const grouped = useMemo(() => {
    const groups: Record<string, VolumeProduct[]> = {};
    for (const type of TYPE_ORDER) groups[type] = [];
    for (const p of products) {
      const key = p.cateringType ?? '__unassigned__';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    return groups;
  }, [products]);

  function renderGroup(typeKey: string, items: VolumeProduct[]) {
    if (items.length === 0) return null;
    const label = typeKey === '__unassigned__' ? 'Unassigned Type' : (TYPE_LABELS[typeKey] ?? typeKey);

    return (
      <div key={typeKey} className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">{label}</h3>
        <Table aria-label={`${label} Products`}>
          <Table.Header>
            <Table.Head isRowHeader label="Product" />
            <Table.Head label="Type" />
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
                    {product.image && <img src={product.image} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />}
                    <div>
                      <p className="text-sm font-medium text-primary">{product.name}</p>
                      {isExpired(product.cateringEndDate) && (
                        <span className="text-xs text-error-600">Expired</span>
                      )}
                      {product.cateringEndDate && !isExpired(product.cateringEndDate) && (
                        <span className="text-xs text-gray-400">Ends {new Date(product.cateringEndDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  {product.cateringType ? (
                    <Badge color="gray">{TYPE_LABELS[product.cateringType] ?? product.cateringType}</Badge>
                  ) : (
                    <Badge color="warning">Type required</Badge>
                  )}
                </Table.Cell>
                <Table.Cell><span className="text-sm text-primary">{product.volumeMinOrderQuantity ?? '—'}</span></Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-primary">{Number(product.tierCount) || 0}</span>
                  {Number(product.tierCount) === 0 && <span className="ml-2 text-xs text-warning-600">No tiers</span>}
                </Table.Cell>
                <Table.Cell>
                  <Badge color={STATUS_COLOR[product.status ?? ''] ?? 'gray'}>{product.status ?? 'unknown'}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/admin/volume-products/${product.id}`}>
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
      </div>
    );
  }

  return (
    <TableCard.Root>
      <TableCard.Header
        title="Catering Products"
        badge={products.length}
        description="Manage products available for catering orders"
        contentTrailing={
          <Link href="/admin/volume-products/create">
            <Button variant="primary" size="sm" iconLeading={Plus}>Create Catering Product</Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-tertiary">No catering products found</p>
          <p className="text-xs text-tertiary max-w-sm">Click "Create Catering Product" to get started.</p>
        </div>
      ) : (
        <div className="p-4">
          {TYPE_ORDER.map((type) => renderGroup(type, grouped[type] ?? []))}
        </div>
      )}
    </TableCard.Root>
  );
}
