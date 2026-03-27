'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableCard } from '@/src/app/admin/components/ui/application/table/table';
import { Badge } from '@/src/app/admin/components/ui/base/badges/badges';
import { Button } from '@/app/admin/components/ui/button';
import { Edit01, Plus, SearchLg, XClose } from '@untitledui/icons';
import Link from 'next/link';

interface CakeProduct {
  id: string;
  name: string;
  image: string | null;
  cakeMinPeople: number | null;
  cakeEnabled: boolean;
  status: string | null;
  tierCount: number;
}

interface CandidateProduct {
  id: string;
  name: string;
  image: string | null;
  status: string | null;
}

const STATUS_COLOR: Record<string, 'success' | 'gray' | 'warning' | 'error'> = {
  active: 'success',
  draft: 'gray',
  'sold-out': 'warning',
  archived: 'error',
};

// ── Add Product Modal ──

function AddProductModal({
  isOpen,
  onClose,
  onAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [candidates, setCandidates] = useState<CandidateProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setSearch('');
    fetch('/api/cake-products?candidates=true')
      .then((r) => r.json())
      .then((data) => setCandidates(data))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return candidates;
    const q = search.toLowerCase();
    return candidates.filter((p) => p.name.toLowerCase().includes(q));
  }, [candidates, search]);

  async function handleAdd(productId: string) {
    setAdding(productId);
    try {
      const res = await fetch('/api/cake-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        setCandidates((prev) => prev.filter((p) => p.id !== productId));
        onAdded();
      }
    } catch {
      // silent
    } finally {
      setAdding(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[70vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Add Cake Product</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <XClose className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
            <SearchLg className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-brand-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">
                {candidates.length === 0
                  ? 'All products are already cake-enabled'
                  : 'No products match your search'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  {product.image ? (
                    <img src={product.image} alt="" className="h-9 w-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-9 w-9 rounded-lg bg-gray-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    {product.status && (
                      <p className="text-xs text-gray-400 capitalize">{product.status}</p>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAdd(product.id)}
                    isLoading={adding === product.id}
                    isDisabled={adding !== null}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function CakeProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<CakeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await fetch('/api/cake-products');
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (error) {
      console.error('Error fetching cake products:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TableCard.Root>
        <TableCard.Header
          title="Cake Products"
          badge={products.length}
          description="Manage products available for cake ordering"
          contentTrailing={
            <Button variant="primary" size="sm" iconLeading={Plus} onClick={() => setShowAddModal(true)}>
              Add Product
            </Button>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-tertiary">No cake products found</p>
            <p className="text-xs text-tertiary max-w-sm">
              Click &quot;Add Product&quot; to enable cake ordering on an existing product.
            </p>
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
                <Table.Row
                  key={product.id}
                  id={product.id}
                  onAction={() => router.push(`/admin/cake-products/${product.id}`)}
                >
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      )}
                      <p className="text-sm font-medium text-primary">{product.name}</p>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-primary">
                      {product.cakeMinPeople ?? '—'}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-primary">
                      {Number(product.tierCount) || 0}
                    </span>
                    {Number(product.tierCount) === 0 && (
                      <span className="ml-2 text-xs text-warning-600">No tiers</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={STATUS_COLOR[product.status ?? ''] ?? 'gray'}>
                      {product.status ?? 'unknown'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/cake-products/${product.id}`}>
                        <button
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded"
                          title="Edit"
                        >
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

      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={() => fetchData()}
      />
    </>
  );
}
