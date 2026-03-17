'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Badge, BadgeWithDot } from '@/app/admin/components/ui/nav/badges';
import type { OfferingStatus } from '@/types';

interface UsageOffering {
  id: string;
  name: string;
  formatName: string;
  status: OfferingStatus;
}

interface FlavourUsagePanelProps {
  flavourId: string;
}

const STATUS_COLOR: Record<string, 'success' | 'blue' | 'gray' | 'orange' | 'error'> = {
  active: 'success',
  scheduled: 'blue',
  draft: 'gray',
  'sold-out': 'orange',
  archived: 'error',
};

export default function FlavourUsagePanel({ flavourId }: FlavourUsagePanelProps) {
  const [loading, setLoading] = useState(true);
  const [offerings, setOfferings] = useState<UsageOffering[]>([]);

  useEffect(() => { fetchUsage(); }, [flavourId]);

  const fetchUsage = async () => {
    try {
      const response = await fetch(`/api/flavours/${flavourId}/usage`);
      if (response.ok) {
        const data = await response.json();
        setOfferings(data.offerings);
      }
    } catch (error) {
      console.error('Error fetching flavour usage:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Used in products</h2>
          {!loading && (
            <p className="text-sm text-gray-500 mt-0.5">
              {offerings.length === 0 ? 'Not used in any products' : `${offerings.length} product${offerings.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>
        {!loading && offerings.length > 0 && (
          <Badge color="gray" size="sm">{offerings.length}</Badge>
        )}
      </div>

      {loading ? (
        <div className="px-6 py-4">
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
        </div>
      ) : offerings.length === 0 ? (
        <div className="px-6 py-4 text-sm text-gray-500">
          This flavour hasn't been added to any products yet.
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {offerings.map((offering) => (
            <Link
              key={offering.id}
              href={`/admin/products/${offering.id}`}
              className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{offering.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{offering.formatName}</p>
              </div>
              <BadgeWithDot color={STATUS_COLOR[offering.status] ?? 'gray'} size="sm">
                {offering.status}
              </BadgeWithDot>
            </Link>
          ))}
        </div>
      )}

      {!loading && offerings.length > 0 && (
        <div className="px-6 py-3 bg-warning-50 border-t border-warning-200">
          <p className="text-xs text-warning-700">
            Archiving this flavour may affect active products.
          </p>
        </div>
      )}
    </div>
  );
}
