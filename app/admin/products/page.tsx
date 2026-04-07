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
import ShopifyProductPicker from '@/app/admin/components/ShopifyProductPicker';
import { useRef } from 'react';

interface Product {
  id: string;
  title: string;
  slug: string;
  status: string;
  category?: string;
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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: '', name: '' });
  const [brokenLinks, setBrokenLinks] = useState<Set<string>>(new Set());
  const [shopifyPrices, setShopifyPrices] = useState<Record<string, { price: number | null; range: [number, number] | null }>>({});
  const [importing, setImporting] = useState(false);
  const shopifyPickerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  async function fetchData() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const productsRes = await fetch(`/api/products?${params}`);
      if (productsRes.ok) {
        const data: Product[] = await productsRes.json();
        setProducts(data);
        verifyShopifyLinks(data);
        fetchShopifyPrices(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function verifyShopifyLinks(items: Product[]) {
    const linked = items.filter((p) => p.shopifyProductId);
    if (linked.length === 0) return;

    try {
      const ids = linked.map((p) => p.shopifyProductId!).join(',');
      const res = await fetch(`/api/shopify/products/verify?ids=${encodeURIComponent(ids)}`);
      if (!res.ok) return;

      const { results } = await res.json() as { results: Record<string, boolean> };
      const broken = new Set<string>();
      for (const p of linked) {
        if (results[p.shopifyProductId!] === false) {
          broken.add(p.id);
        }
      }
      setBrokenLinks(broken);
    } catch {
      // network error — don't flag anything
    }
  }

  async function fetchShopifyPrices(items: Product[]) {
    const linked = items.filter((p) => p.shopifyProductId);
    if (linked.length === 0) return;

    try {
      const ids = linked.map((p) => p.shopifyProductId!).join(',');
      const res = await fetch(`/api/shopify/products/prices?ids=${encodeURIComponent(ids)}`);
      if (!res.ok) return;
      const data = await res.json();
      setShopifyPrices(data);
    } catch {
      // fall back to CMS prices
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

  // Client-side filtering
  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'all' && (p.category || '') !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (p.title || (p as any).name || '').toLowerCase();
      const slug = (p.slug || '').toLowerCase();
      if (!name.includes(q) && !slug.includes(q)) return false;
    }
    return true;
  });

  // Extract unique categories from products
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];

  async function handleImportFromShopify(shopifyProduct: { id: string; handle: string; title: string; featuredImage?: { url: string } } | null) {
    if (!shopifyProduct) return;
    setImporting(true);
    try {
      const res = await fetch('/api/products/import-from-shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopifyProductId: shopifyProduct.id }),
      });
      const data = await res.json();
      if (res.status === 409) {
        toast.error('Already imported', 'A product linked to this Shopify product already exists');
        router.push(`/admin/products/${data.existingProductId}`);
        return;
      }
      if (!res.ok) {
        toast.error('Import failed', data.error || 'Failed to import product');
        return;
      }
      toast.success('Product imported', `"${shopifyProduct.title}" has been imported from Shopify`);
      router.push(`/admin/products/${data.id}`);
    } catch {
      toast.error('Import failed', 'An unexpected error occurred');
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <TableCard.Root>
        <TableCard.Header
          title="Products"
          badge={filteredProducts.length}
          description="Manage sellable menu items"
          contentTrailing={
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 w-48"
                />
              </div>
              {categories.length > 0 && (
                <Select
                  placeholder="All categories"
                  selectedKey={categoryFilter}
                  onSelectionChange={(key) => setCategoryFilter(key as string)}
                  items={[
                    { id: 'all', label: 'All categories' },
                    ...categories.map((c) => ({ id: c, label: c })),
                  ]}
                >
                  {(item) => <Select.Item id={item.id} label={item.label} />}
                </Select>
              )}
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
              <Button color="secondary" size="sm" onClick={() => shopifyPickerRef.current?.()} isDisabled={importing}>
                {importing ? 'Importing…' : 'Import from Shopify'}
              </Button>
              <Link href="/admin/products/create">
                <Button color="primary" size="sm">Create product</Button>
              </Link>
            </div>
          }
        />

        {/* Hidden Shopify picker for import */}
        <div className="hidden">
          <ShopifyProductPicker
            onSelect={handleImportFromShopify}
            onOpenRef={shopifyPickerRef}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-tertiary">{search || categoryFilter !== 'all' ? 'No matching products' : 'No products found'}</p>
            {!search && categoryFilter === 'all' && (
              <Link href="/admin/products/create">
                <Button color="secondary" size="sm">Create your first product</Button>
              </Link>
            )}
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
            <Table.Body items={filteredProducts}>
              {(product) => (
                <Table.Row
                  key={product.id}
                  id={product.id}
                  onAction={() => router.push(`/admin/products/${product.id}`)}
                >
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {product.image && (
                        <img src={product.image} alt={product.title} className="h-10 w-10 rounded-lg object-cover" />
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
                      {(() => {
                        const sp = product.shopifyProductId ? shopifyPrices[product.shopifyProductId] : null;
                        if (sp?.range) {
                          return `$${(sp.range[0] / 100).toFixed(2)} – $${(sp.range[1] / 100).toFixed(2)}`;
                        }
                        if (sp?.price) {
                          return `$${(sp.price / 100).toFixed(2)}`;
                        }
                        return product.price > 0 ? `$${(product.price / 100).toFixed(2)}` : '—';
                      })()}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={STATUS_COLOR[product.status] ?? 'gray'}>
                      {product.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {product.shopifyProductId ? (
                      brokenLinks.has(product.id) ? (
                        <div className="flex flex-col gap-1">
                          <BadgeWithDot color="error">Broken link</BadgeWithDot>
                          <span className="text-xs text-tertiary">Deleted from Shopify</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <BadgeWithDot color="success">Linked</BadgeWithDot>
                          {product.shopifyProductId && (
                            <a
                              href={`https://admin.shopify.com/store/${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.replace('.myshopify.com', '')}/products/${product.shopifyProductId.replace('gid://shopify/Product/', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-brand-600 hover:underline"
                            >
                              View →
                            </a>
                          )}
                        </div>
                      )
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
