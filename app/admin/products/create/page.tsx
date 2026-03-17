'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Format, Flavour } from '@/types';
import FormatSelector from '../../components/FormatSelector';
import FlavourSelector from '../../components/FlavourSelector';
import { Select } from '@/app/admin/components/ui/select';
import { Checkbox } from '@/app/admin/components/ui/checkbox';

export default function CreateProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formats, setFormats] = useState<Format[]>([]);
  const [flavours, setFlavours] = useState<Flavour[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Form state
  const [selectedFormat, setSelectedFormat] = useState<Format | null>(null);
  const [selectedFlavourIds, setSelectedFlavourIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    internalName: '',
    publicName: '',
    description: '',
    shortCardCopy: '',
    price: '',
    compareAtPrice: '',
    status: 'draft',
    inventoryTracked: false,
    inventoryQuantity: '',
    onlineOrderable: true,
    pickupOnly: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [formatsRes, flavoursRes] = await Promise.all([
        fetch('/api/formats'),
        fetch('/api/flavours'),
      ]);

      if (formatsRes.ok && flavoursRes.ok) {
        const formatsData = await formatsRes.json();
        const flavoursData = await flavoursRes.json();
        
        // Handle paginated response
        setFormats(Array.isArray(formatsData) ? formatsData : formatsData.data || []);
        setFlavours(Array.isArray(flavoursData) ? flavoursData : flavoursData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  function validateStep1() {
    if (!selectedFormat) {
      setErrors(['Please select a format']);
      return false;
    }
    setErrors([]);
    return true;
  }

  function validateStep2() {
    const newErrors: string[] = [];

    if (!selectedFormat) {
      newErrors.push('Format not selected');
      return false;
    }

    if (selectedFormat.requiresFlavours) {
      if (selectedFlavourIds.length < selectedFormat.minFlavours) {
        newErrors.push(`Format requires at least ${selectedFormat.minFlavours} flavour(s)`);
      }
      if (selectedFlavourIds.length > selectedFormat.maxFlavours) {
        newErrors.push(`Format allows maximum ${selectedFormat.maxFlavours} flavour(s)`);
      }
    }

    // Format-specific validation
    const formatName = selectedFormat.name.toLowerCase();
    const selectedFlavours = flavours.filter(f => selectedFlavourIds.includes(f.id));

    if (formatName.includes('twist')) {
      if (selectedFlavourIds.length !== 2) {
        newErrors.push('Twist format requires exactly 2 flavours');
      }
      // Twist eligibility is now handled by format eligibleFlavourTypes rules
    }

    if (formatName.includes('pint')) {
      if (selectedFlavourIds.length !== 1) {
        newErrors.push('Pint format requires exactly 1 flavour');
      }
      // Pint eligibility is now handled by format eligibleFlavourTypes rules
    }

    if (formatName.includes('sandwich')) {
      if (selectedFlavourIds.length !== 1) {
        newErrors.push('Sandwich format requires exactly 1 flavour');
      }
      // Sandwich eligibility is now handled by format eligibleFlavourTypes rules
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }

  function validateStep3() {
    const newErrors: string[] = [];

    if (!formData.internalName.trim()) {
      newErrors.push('Internal name is required');
    }
    if (!formData.publicName.trim()) {
      newErrors.push('Public name is required');
    }
    if (!formData.description.trim()) {
      newErrors.push('Description is required');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }

  function handleNext() {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      // Auto-populate both internal and public names with selected flavour names
      const selectedFlavours = flavours.filter(f => selectedFlavourIds.includes(f.id));
      const autoName = selectedFlavours.map(f => f.name).join(' & ');
      
      // Set default price to $7.00 for ice cream products
      const defaultPrice = '7.00';
      
      setFormData(prev => ({
        ...prev,
        internalName: autoName,
        publicName: autoName,
        price: defaultPrice,
      }));
      
      setStep(3);
    }
  }

  function handleBack() {
    setStep(step - 1);
    setErrors([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateStep3()) {
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      const price = formData.price ? Math.round(parseFloat(formData.price) * 100) : 0;
      const compareAtPrice = formData.compareAtPrice ? Math.round(parseFloat(formData.compareAtPrice) * 100) : undefined;

      const payload = {
        formatId: selectedFormat?.id,
        primaryFlavourIds: selectedFlavourIds,
        internalName: formData.internalName,
        publicName: formData.publicName,
        description: formData.description,
        shortCardCopy: formData.shortCardCopy,
        price,
        compareAtPrice,
        status: formData.status,
        inventoryTracked: formData.inventoryTracked,
        inventoryQuantity: formData.inventoryQuantity ? parseInt(formData.inventoryQuantity) : undefined,
        onlineOrderable: formData.onlineOrderable,
        pickupOnly: formData.pickupOnly,
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/admin/products');
      } else {
        const error = await response.json();
        setErrors([error.error || 'Failed to create product']);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setErrors(['Failed to create product']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Product</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create a new sellable menu item by combining a format with flavours
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                s === step ? 'bg-blue-600 text-white' : s < step ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {s}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${s === step ? 'text-blue-600' : s < step ? 'text-green-600' : 'text-gray-500'}`}>
                  {s === 1 ? 'Select Format' : s === 2 ? 'Select Flavours' : 'Add Details'}
                </p>
              </div>
              {s < 3 && <div className="flex-1 h-0.5 mx-4 bg-gray-200"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Validation Errors</h3>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Step 1: Select Format */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Select Format</h2>
            <FormatSelector
              formats={formats}
              selectedFormat={selectedFormat}
              onSelect={setSelectedFormat}
            />
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedFormat}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Flavours */}
        {step === 2 && selectedFormat && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Select Flavours</h2>
            <FlavourSelector
              format={selectedFormat}
              flavours={flavours}
              selectedFlavourIds={selectedFlavourIds}
              onSelect={setSelectedFlavourIds}
            />
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Add Details */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 3: Add Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Internal Name *
                  </label>
                  <input
                    type="text"
                    value={formData.internalName}
                    onChange={(e) => setFormData({ ...formData, internalName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Admin reference name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Public Name *
                  </label>
                  <input
                    type="text"
                    value={formData.publicName}
                    onChange={(e) => setFormData({ ...formData, publicName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Customer-facing name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Card Copy
                </label>
                <input
                  type="text"
                  value={formData.shortCardCopy}
                  onChange={(e) => setFormData({ ...formData, shortCardCopy: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief card text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compare At Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value })}
                  options={[
                    { id: 'draft', label: 'Draft' },
                    { id: 'scheduled', label: 'Scheduled' },
                    { id: 'active', label: 'Active' },
                    { id: 'sold-out', label: 'Sold Out' },
                    { id: 'archived', label: 'Archived' },
                  ]}
                />
              </div>

              <div className="flex items-center gap-6">
                <Checkbox
                  isSelected={formData.inventoryTracked}
                  onChange={(v) => setFormData({ ...formData, inventoryTracked: v })}
                  label="Track Inventory"
                />
                <Checkbox
                  isSelected={formData.onlineOrderable}
                  onChange={(v) => setFormData({ ...formData, onlineOrderable: v })}
                  label="Online Orderable"
                />
                <Checkbox
                  isSelected={formData.pickupOnly}
                  onChange={(v) => setFormData({ ...formData, pickupOnly: v })}
                  label="Pickup Only"
                />
              </div>

              {formData.inventoryTracked && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inventory Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.inventoryQuantity}
                    onChange={(e) => setFormData({ ...formData, inventoryQuantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
