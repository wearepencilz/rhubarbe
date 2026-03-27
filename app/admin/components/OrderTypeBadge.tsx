'use client';

import Badge from './ui/badge';

export const ORDER_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  launch: { label: 'Menu', color: 'info' },
  volume: { label: 'Catering', color: 'purple' },
  cake:   { label: 'Cake', color: 'pink' },
};

export default function OrderTypeBadge({ orderType }: { orderType: string }) {
  const config = ORDER_TYPE_CONFIG[orderType];
  if (!config) return null;

  return (
    <Badge variant={config.color} size="sm">
      {config.label}
    </Badge>
  );
}
