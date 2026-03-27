'use client';

const ORDER_TYPE_OPTIONS = [
  { value: 'launch', label: 'Menu' },
  { value: 'volume', label: 'Catering' },
  { value: 'cake', label: 'Cake' },
] as const;

type OrderType = 'launch' | 'volume' | 'cake';

interface OrderTypeSelectorProps {
  value: OrderType;
  onChange: (type: OrderType) => void;
}

export default function OrderTypeSelector({ value, onChange }: OrderTypeSelectorProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5" role="tablist">
      {ORDER_TYPE_OPTIONS.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
