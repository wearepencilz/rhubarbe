'use client';

import { ReactNode, memo } from 'react';
import Link from 'next/link';
import { Button } from '@/app/admin/components/ui/button';
import { Edit01, Trash01 } from '@untitledui/icons';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

export interface Action<T> {
  label: string;
  icon?: 'edit' | 'delete';
  onClick?: (item: T) => void;
  href?: (item: T) => string;
  className?: string;
  stopPropagation?: boolean;
}

interface DataTableProps<T> {
  // Header
  title: string;
  description?: string;
  createButton?: {
    label: string;
    href: string;
  };
  secondaryButton?: {
    label: string;
    href: string;
  };
  
  // Filters (optional)
  filters?: ReactNode;
  
  // Data
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  keyExtractor: (item: T) => string;
  
  // Interactions
  onRowClick?: (item: T) => void;
  
  // Empty state
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    href: string;
  };
  
  // Loading
  loading?: boolean;
}

function DataTable<T>({
  title,
  description,
  createButton,
  secondaryButton,
  filters,
  data,
  columns,
  actions,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No items found',
  emptyAction,
  loading = false,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
          {description && (
            <p className="text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {(createButton || secondaryButton) && (
          <div className="flex gap-3">
            {secondaryButton && (
              <Link href={secondaryButton.href}>
                <Button variant="secondary" size="md">{secondaryButton.label}</Button>
              </Link>
            )}
            {createButton && (
              <Link href={createButton.href}>
                <Button variant="primary" size="md">{createButton.label}</Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      {filters && filters}

      {/* Table */}
      {data.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">{emptyMessage}</p>
          {emptyAction && (
            <Link
              href={emptyAction.href}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {emptyAction.label}
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" role="table">
              <thead className="bg-gray-50">
                <tr role="row">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.className || ''
                      }`}
                    >
                      {column.label}
                    </th>
                  ))}
                  {actions && actions.length > 0 && (
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200" role="rowgroup">
                {data.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    role="row"
                    onClick={() => onRowClick?.(item)}
                    onKeyDown={(e) => {
                      if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onRowClick(item);
                      }
                    }}
                    tabIndex={onRowClick ? 0 : undefined}
                    className={onRowClick ? 'hover:bg-gray-50 cursor-pointer focus:outline-none focus:bg-gray-50' : 'hover:bg-gray-50'}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 ${column.className || ''}`}
                      >
                        {column.render
                          ? column.render(item)
                          : String((item as any)[column.key] || '')}
                      </td>
                    ))}
                    {actions && actions.length > 0 && (
                      <td
                        className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {actions.map((action, index) => {
                            const IconComp = action.icon === 'edit' ? Edit01 : action.icon === 'delete' ? Trash01 : undefined;
                            const isDelete = action.icon === 'delete';
                            if (action.href) {
                              return (
                                <Link
                                  key={index}
                                  href={action.href(item)}
                                  onClick={(e) => action.stopPropagation && e.stopPropagation()}
                                >
                                  {IconComp ? (
                                    <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded" title={action.label}>
                                      <IconComp className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <span className={action.className || 'text-blue-600 hover:text-blue-900'}>{action.label}</span>
                                  )}
                                </Link>
                              );
                            }
                            return IconComp ? (
                              <button
                                key={index}
                                className={`p-1.5 transition-colors rounded ${isDelete ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
                                title={action.label}
                                onClick={(e) => {
                                  if (action.stopPropagation) e.stopPropagation();
                                  action.onClick?.(item);
                                }}
                              >
                                <IconComp className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                key={index}
                                onClick={(e) => {
                                  if (action.stopPropagation) e.stopPropagation();
                                  action.onClick?.(item);
                                }}
                                className={action.className || 'text-blue-600 hover:text-blue-900'}
                              >
                                {action.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(DataTable) as typeof DataTable;
