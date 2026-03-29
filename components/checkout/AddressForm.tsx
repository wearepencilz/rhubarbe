'use client';

import { DeliveryAddress } from '@/lib/checkout/types';

interface AddressFormProps {
  address: DeliveryAddress;
  onChange: (address: DeliveryAddress) => void;
  errors: Partial<Record<keyof DeliveryAddress, string>>;
  locale: string;
}

const labels: Record<keyof DeliveryAddress, { fr: string; en: string }> = {
  street: { fr: 'Adresse', en: 'Street address' },
  city: { fr: 'Ville', en: 'City' },
  province: { fr: 'Province', en: 'Province' },
  postalCode: { fr: 'Code postal', en: 'Postal code' },
};

const placeholders: Record<keyof DeliveryAddress, { fr: string; en: string }> = {
  street: { fr: '123 rue Principale', en: '123 Main St' },
  city: { fr: 'Montréal', en: 'Montreal' },
  province: { fr: 'Québec', en: 'Quebec' },
  postalCode: { fr: 'H2X 1Y4', en: 'H2X 1Y4' },
};

export default function AddressForm({ address, onChange, errors, locale }: AddressFormProps) {
  const isFr = locale === 'fr';
  const lang = isFr ? 'fr' : 'en';

  const handleChange = (field: keyof DeliveryAddress, value: string) => {
    onChange({ ...address, [field]: value });
  };

  const renderField = (field: keyof DeliveryAddress) => (
    <div key={field}>
      <label htmlFor={`address-${field}`} className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
        {labels[field][lang]}
      </label>
      <input
        id={`address-${field}`}
        type="text"
        value={address[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholders[field][lang]}
        className={`w-full border rounded py-3 px-3 text-sm ${
          errors[field] ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {errors[field] && (
        <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        {renderField('street')}
      </div>
      {renderField('city')}
      {renderField('province')}
      {renderField('postalCode')}
    </div>
  );
}
