'use client';

import { type ReactNode, type HTMLAttributes, type ThHTMLAttributes, type TdHTMLAttributes } from 'react';

// ─── TableCard ────────────────────────────────────────────────────────────────

interface TableCardRootProps { children: ReactNode; className?: string; }

function TableCardRoot({ children, className = '' }: TableCardRootProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

interface TableCardHeaderProps {
  title: string;
  badge?: number | string;
  description?: string;
  contentTrailing?: ReactNode;
}

function TableCardHeader({ title, badge, description, contentTrailing }: TableCardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-200">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
          {badge !== undefined && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {badge}
            </span>
          )}
        </div>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
      {contentTrailing && <div className="shrink-0">{contentTrailing}</div>}
    </div>
  );
}

export const TableCard = { Root: TableCardRoot, Header: TableCardHeader };

// ─── Table ────────────────────────────────────────────────────────────────────

interface TableRootProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

function TableRoot({ children, className = '', ...props }: TableRootProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps { children: ReactNode; }

function TableHeader({ children }: TableHeaderProps) {
  return (
    <thead className="bg-gray-50">
      <tr>{children}</tr>
    </thead>
  );
}

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  label: string;
  isRowHeader?: boolean;
}

function TableHead({ label, isRowHeader, className = '', ...props }: TableHeadProps) {
  return (
    <th
      scope={isRowHeader ? 'row' : 'col'}
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
      {...props}
    >
      {label}
    </th>
  );
}

interface TableBodyProps<T> {
  items: T[];
  children: (item: T) => ReactNode;
}

function TableBody<T>({ items, children }: TableBodyProps<T>) {
  return (
    <tbody className="bg-white divide-y divide-gray-200">
      {items.map((item, i) => <>{children(item)}</>)}
    </tbody>
  );
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  id: string;
  onAction?: () => void;
  children: ReactNode;
}

function TableRow({ id, onAction, children, className = '', ...props }: TableRowProps) {
  return (
    <tr
      className={`hover:bg-gray-50 ${onAction ? 'cursor-pointer' : ''} ${className}`}
      onClick={onAction}
      onKeyDown={(e) => { if (onAction && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onAction(); } }}
      tabIndex={onAction ? 0 : undefined}
      {...props}
    >
      {children}
    </tr>
  );
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
}

function TableCell({ children, className = '', ...props }: TableCellProps) {
  return (
    <td className={`px-6 py-4 text-sm ${className}`} {...props}>
      {children}
    </td>
  );
}

export const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Head: TableHead,
  Body: TableBody,
  Row: TableRow,
  Cell: TableCell,
});
