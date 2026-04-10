'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';

interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  featuredImage?: {
    url: string;
    altText?: string;
  };
  priceRangeV2?: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
}

interface Props {
  selectedProductId?: string;
  selectedProductHandle?: string;
  onSelect: (product: ShopifyProduct | null) => void;
  onSelectMultiple?: (products: ShopifyProduct[]) => void;
  multiSelect?: boolean;
  trigger?: React.ReactNode;
  onOpenRef?: React.MutableRefObject<(() => void) | null>;
}

export default function ShopifyProductPicker({ selectedProductId, selectedProductHandle, onSelect, onSelectMultiple, multiSelect = false, trigger, onOpenRef }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [hideLinked, setHideLinked] = useState(true);

  const handleModalOpen = () => {
    setShowModal(true);
    setSelected(new Set());
    loadProducts('*');
    if (multiSelect) fetchLinkedIds();
  };

  const fetchLinkedIds = async () => {
    try {
      const res = await fetch('/api/products/linked-shopify-ids');
      if (!res.ok) return;
      const ids: string[] = await res.json();
      setLinkedIds(new Set(ids));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (onOpenRef) onOpenRef.current = handleModalOpen;
    return () => { if (onOpenRef) onOpenRef.current = null; };
  }, [onOpenRef]);

  const loadProducts = async (query: string = '*') => {
    setLoading(true);
    setError('');
    try {
      const searchQuery = query.trim() || '*';
      const response = await fetch(`/api/shopify/products?q=${encodeURIComponent(searchQuery)}&limit=250`);
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 'MISSING_STORE_DOMAIN' || errorData.code === 'MISSING_CREDENTIALS') {
          throw new Error('Shopify is not configured. Please add Shopify credentials to your environment variables.');
        }
        throw new Error(errorData.error || 'Failed to load products');
      }
      const data = await response.json();
      setProducts(data.products || []);
      if (data.products.length === 0) setError('No products found in your Shopify store');
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    if (!searchTerm.trim()) { setError('Please enter a search term'); return; }
    await loadProducts(searchTerm);
  };

  const handleSingleSelect = (product: ShopifyProduct) => {
    onSelect(product);
    setShowModal(false);
    setSearchTerm('');
    setProducts([]);
  };

  const toggleSelection = (productId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleImportSelected = () => {
    const selectedProducts = products.filter((p) => selected.has(p.id));
    if (onSelectMultiple) onSelectMultiple(selectedProducts);
    setShowModal(false);
    setSearchTerm('');
    setProducts([]);
    setSelected(new Set());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); searchProducts(); }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowModal(false); };
    if (showModal) { document.addEventListener('keydown', handleEsc); return () => document.removeEventListener('keydown', handleEsc); }
  }, [showModal]);

  return (
    <div>
      {trigger ? (
        <div onClickCapture={handleModalOpen} style={{ cursor: 'pointer', display: 'inline-block' }}>{trigger}</div>
      ) : (
        <button type="button" onClick={handleModalOpen}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
          <p className="text-sm text-gray-700 font-medium">Search Shopify Products</p>
          <p className="text-xs text-gray-500 mt-1">Browse and select an existing product from your store</p>
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {multiSelect ? 'Import Shopify Products' : 'Search Shopify Products'}
                </h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-2" onKeyDown={handleKeyDown}>
                <Input type="text" placeholder="Search by product name..." value={searchTerm}
                  onChange={(val) => { setSearchTerm(val); if (val === '') loadProducts('*'); }}
                  autoFocus className="flex-1" />
                <Button type="button" variant="primary" size="md" onClick={searchProducts} isDisabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {loading ? (
                <div className="text-center text-gray-500 py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
                  <p className="text-gray-900">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <p className="text-gray-900 mb-2">{error || 'Search for products or browse all available products'}</p>
                  <button type="button" onClick={() => loadProducts('*')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Load all products
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {multiSelect && products.length > 0 && (() => {
                    const filteredProducts = hideLinked ? products.filter((p) => !linkedIds.has(p.id)) : products;
                    const linkedCount = products.length - filteredProducts.length;
                    return (
                      <>
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-1">
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => {
                              if (selected.size === filteredProducts.length) setSelected(new Set());
                              else setSelected(new Set(filteredProducts.map((p) => p.id)));
                            }} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                              {selected.size === filteredProducts.length && filteredProducts.length > 0 ? 'Deselect all' : `Select all (${filteredProducts.length})`}
                            </button>
                            {linkedCount > 0 && (
                              <button type="button" onClick={() => setHideLinked(!hideLinked)} className="text-xs text-gray-400 hover:text-gray-600">
                                {hideLinked ? `Show ${linkedCount} already imported` : 'Hide imported'}
                              </button>
                            )}
                          </div>
                          {selected.size > 0 && (
                            <span className="text-xs text-gray-500">{selected.size} selected</span>
                          )}
                        </div>
                        {filteredProducts.map((product) => {
                          const isSelected = selected.has(product.id);
                          return (
                            <button key={product.id} type="button"
                              onClick={() => toggleSelection(product.id)}
                              className={`text-left p-3 border rounded-lg transition-colors bg-white flex gap-3 items-center ${
                                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                              }`}>
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              {product.featuredImage && (
                                <div className="w-12 h-12 shrink-0 bg-gray-100 rounded overflow-hidden">
                                  <img src={product.featuredImage.url} alt={product.featuredImage.altText || product.title} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900">{product.title}</h4>
                                <p className="text-xs text-gray-500 font-mono">{product.handle}</p>
                              </div>
                              {product.priceRangeV2 && (
                                <span className="text-xs text-gray-500 shrink-0">${product.priceRangeV2.minVariantPrice.amount}</span>
                              )}
                            </button>
                          );
                        })}
                        {filteredProducts.length === 0 && linkedCount > 0 && (
                          <p className="text-center text-sm text-gray-400 py-8">All products already imported</p>
                        )}
                      </>
                    );
                  })()}
                  {!multiSelect && products.map((product) => {
                    return (
                      <button key={product.id} type="button"
                        onClick={() => handleSingleSelect(product)}
                        className="text-left p-3 border rounded-lg transition-colors bg-white flex gap-3 items-center border-gray-200 hover:border-blue-500 hover:bg-blue-50">
                        {product.featuredImage && (
                          <div className="w-12 h-12 shrink-0 bg-gray-100 rounded overflow-hidden">
                            <img src={product.featuredImage.url} alt={product.featuredImage.altText || product.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900">{product.title}</h4>
                          <p className="text-xs text-gray-500 font-mono">{product.handle}</p>
                        </div>
                        {product.priceRangeV2 && (
                          <span className="text-xs text-gray-500 shrink-0">${product.priceRangeV2.minVariantPrice.amount}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex gap-3">
              {multiSelect && selected.size > 0 ? (
                <>
                  <Button type="button" variant="secondary" size="md" onClick={() => setShowModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="button" variant="primary" size="md" onClick={handleImportSelected} className="flex-1">
                    Import {selected.size} product{selected.size > 1 ? 's' : ''}
                  </Button>
                </>
              ) : (
                <Button type="button" variant="secondary" size="md" onClick={() => { setShowModal(false); setSearchTerm(''); setProducts([]); setError(''); }} className="w-full">
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
