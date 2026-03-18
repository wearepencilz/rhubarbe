'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Table, TableCard } from '@/src/app/admin/components/ui/application/table/table';
import { Badge } from '@/src/app/admin/components/ui/base/badges/badges';
import { BadgeWithDot } from '@/app/admin/components/ui/nav/badges';
import { Select } from '@/src/app/admin/components/ui/base/select/select';
import { Button } from '@/app/admin/components/ui/buttons/button';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Edit01, Trash01 } from '@untitledui/icons';

interface Product {
  id: string;
  title: string;
  slug: string;
  status: string;
  shortCardCopy?: string;
  image?: string;
  price: number;
  onlineOrderable: boolean;
  shopifyProductId?: string;
  shopifyProductHandle?: string;
}

const STATUS_COLOR: Record<string, 'success' | 'gray' | 'blue' | 'warning' | 'error'> = {
  active: 'success',
  draft: 'gray',
  scheduled: 'blue',
  'sold-out': 'warning',
  archived: 'error',
};

export default function ProductsPage() {
  const router = useRouter();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: '', name: '' });

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  async function fetchData() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const productsRes = await fetch(`/api/products?${params}`);
      if (productsRes.ok) setProducts(await productsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    const response = await fetch(`/api/products/${deleteConfirm.id}`, { method: 'DELETE' });
    if (response.ok) {
      setProducts(products.filter((p) => p.id !== deleteConfirm.id));
      toast.success('Product deleted', `"${deleteConfirm.name}" has been removed`);
      setDeleteConfirm({ show: false, id: '', name: '' });
    } else {
      const error = await response.json();
      toast.error('Delete failed', error.error || 'Failed to delete product');
      setDeleteConfirm({ show: false, id: '', name: '' });
    }
  };

  const getFormatName = (formatId: string) => formatId || '—';

  return (
    <>
      <TableCard.Root>
        <TableCard.Header
          title="Products"
          badge={products.length}
          description="Manage sellable menu items"
          contentTrailing={
            <div className="flex items-center gap-3">
              <Select
                placeholder="All statuses"
                selectedKey={statusFilter}
                onSelectionChange={(key) => setStatusFilter(key as string)}
                items={[
                  { id: 'all', label: 'All statuses' },
                  { id: 'active', label: 'Active' },
                  { id: 'draft', label: 'Draft' },
                  { id: 'scheduled', label: 'Scheduled' },
                  { id: 'sold-out', label: 'Sold out' },
                  { id: 'archived', label: 'Archived' },
                ]}
              >
                {(item) => <Select.Item id={item.id} label={item.label} />}
              </Select>
              <Link href="/admin/products/create">
                <Button color="primary" size="sm">Create product</Button>
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
            <p className="text-sm text-tertiary">No products found</p>
            <Link href="/admin/products/create">
              <Button color="secondary" size="sm">Create your first product</Button>
            </Link>
          </div>
        ) : (
          <Table aria-label="Products">
            <Table.Header>
              <Table.Head isRowHeader label="Product" />
              <Table.Head label="Price" />
              <Table.Head label="Status" />
              <Table.Head label="Shopify" />
              <Table.Head label="" />
            </Table.Header>
            <Table.Body items={products}>
              {(product) => (
                <Table.Row
                  key={product.id}
                  id={product.id}
                  onAction={() => router.push(`/admin/products/${product.id}`)}
                >
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {product.image && (
                        <img src={product.image} alt={product.publicName} className="h-10 w-10 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-primary">{product.title || (product as any).name}</p>
                        {product.shortCardCopy && (
                          <p className="text-xs text-tertiary truncate max-w-xs">{product.shortCardCopy}</p>
                        )}
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm font-medium text-primary">
                      {product.price > 0 ? `${(product.price / 100).toFixed(2)}` : '—'}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={STATUS_COLOR[product.status] ?? 'gray'}>
                      {product.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {product.shopifyProductId ? (
                      <div className="flex flex-col gap-1">
                        <BadgeWithDot color="success">Linked</BadgeWithDot>
                        {product.shopifyProductHandle && (
                          <a
                            href={`https://admin.shopify.com/store/products/${product.shopifyProductHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-brand-600 hover:underline"
                          >
                            View →
                          </a>
                        )}
                      </div>
                    ) : (
                      <Badge color="gray">Not linked</Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/products/${product.id}`}>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded" title="Edit">
                          <Edit01 className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                        title="Delete"
                        onClick={() => setDeleteConfirm({ show: true, id: product.id, name: product.title || (product as any).name })}
                      >
                        <Trash01 className="w-4 h-4" />
                      </button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        )}
      </TableCard.Root>

      <ConfirmModal
        isOpen={deleteConfirm.show}
        variant="danger"
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: '', name: '' })}
      />
    </>
  );
}
