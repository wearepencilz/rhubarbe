'use client';

import Link from 'next/link';
import { Badge } from '@/app/admin/components/ui/nav/badges';

interface RelatedItem {
  id: string;
  name: string;
  href?: string;
}

interface RelatedItemsProps {
  title: string;
  description?: string;
  items: RelatedItem[];
  emptyMessage?: string;
  badgeColor?: 'blue' | 'gray' | 'success' | 'error' | 'purple' | 'orange';
}

export default function RelatedItems({
  title,
  description,
  items,
  emptyMessage = 'Not used anywhere yet.',
  badgeColor = 'blue',
}: RelatedItemsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">{emptyMessage}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item) =>
              item.href ? (
                <Link key={item.id} href={item.href}>
                  <Badge color={badgeColor}>{item.name}</Badge>
                </Link>
              ) : (
                <Badge key={item.id} color={badgeColor}>{item.name}</Badge>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
