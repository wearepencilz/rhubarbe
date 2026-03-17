'use client';

import { ReactNode } from 'react';
import { Input } from '@/app/admin/components/ui/input';
import { Select } from '@/app/admin/components/ui/select';

export interface FilterConfig {
  type: 'search' | 'select';
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options?: { value: string; label: string }[];
}

interface TableFiltersProps {
  filters: FilterConfig[];
  children?: ReactNode;
}

export default function TableFilters({ filters, children }: TableFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filters.map((filter, index) => (
          <div key={index}>
            {filter.type === 'search' ? (
              <Input
                label={filter.label}
                type="text"
                placeholder={filter.placeholder || 'Search...'}
                value={filter.value}
                onChange={filter.onChange}
              />
            ) : (
              <Select
                label={filter.label}
                value={filter.value}
                onChange={filter.onChange}
                options={(filter.options || []).map((o) => ({ id: o.value, label: o.label }))}
              />
            )}
          </div>
        ))}
        {children}
      </div>
    </div>
  );
}
