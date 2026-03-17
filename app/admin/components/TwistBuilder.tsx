'use client';

import { Flavour } from '@/types';
import { Select } from '@/app/admin/components/ui/select';

interface TwistBuilderProps {
  flavours: Flavour[];
  selectedFlavourIds: string[];
  onSelect: (flavourIds: string[]) => void;
  customDisplayName?: string;
  onDisplayNameChange?: (name: string) => void;
}

export default function TwistBuilder({
  flavours,
  selectedFlavourIds,
  onSelect,
  customDisplayName,
  onDisplayNameChange,
}: TwistBuilderProps) {
  // Filter to only active flavours (twist eligibility is now handled by format rules)
  const twistEligibleFlavours = flavours.filter(f => f.status === 'active');

  const handleFlavourAChange = (flavourId: string) => {
    const newSelection = [flavourId, selectedFlavourIds[1] || ''].filter(Boolean);
    onSelect(newSelection);
  };

  const handleFlavourBChange = (flavourId: string) => {
    const newSelection = [selectedFlavourIds[0] || '', flavourId].filter(Boolean);
    onSelect(newSelection);
  };

  const flavourA = flavours.find(f => f.id === selectedFlavourIds[0]);
  const flavourB = flavours.find(f => f.id === selectedFlavourIds[1]);

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Build Your Twist</h3>
      
      <p className="text-sm text-gray-600 mb-4">
        Select two twist-eligible flavours to create a twist combination
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Flavour A */}
        <div>
          <Select
            label="Flavour A *"
            isRequired
            placeholder="Select flavour..."
            value={selectedFlavourIds[0] || ''}
            onChange={handleFlavourAChange}
            options={twistEligibleFlavours.map((f) => ({
              id: f.id,
              label: `${f.name} (${f.type})`,
              isDisabled: f.id === selectedFlavourIds[1],
            }))}
          />
          
          {flavourA && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                {flavourA.colour && (
                  <div
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: flavourA.colour }}
                  />
                )}
                <span className="text-sm font-medium text-gray-900">{flavourA.name}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2 py-0.5 bg-white border border-gray-300 rounded">
                  {flavourA.type}
                </span>
                <span className="px-2 py-0.5 bg-white border border-gray-300 rounded">
                  {flavourA.baseStyle}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Flavour B */}
        <div>
          <Select
            label="Flavour B *"
            isRequired
            placeholder="Select flavour..."
            value={selectedFlavourIds[1] || ''}
            onChange={handleFlavourBChange}
            options={twistEligibleFlavours.map((f) => ({
              id: f.id,
              label: `${f.name} (${f.type})`,
              isDisabled: f.id === selectedFlavourIds[0],
            }))}
          />
          
          {flavourB && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                {flavourB.colour && (
                  <div
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: flavourB.colour }}
                  />
                )}
                <span className="text-sm font-medium text-gray-900">{flavourB.name}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2 py-0.5 bg-white border border-gray-300 rounded">
                  {flavourB.type}
                </span>
                <span className="px-2 py-0.5 bg-white border border-gray-300 rounded">
                  {flavourB.baseStyle}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Preview */}
      {flavourA && flavourB && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Twist Preview</h4>
          <div className="flex items-center justify-center space-x-3">
            <div className="text-center">
              {flavourA.colour && (
                <div
                  className="w-16 h-16 rounded-full border-2 border-white shadow-md mx-auto mb-2"
                  style={{ backgroundColor: flavourA.colour }}
                />
              )}
              <p className="text-sm font-medium text-gray-900">{flavourA.name}</p>
            </div>
            
            <div className="text-2xl text-gray-400">+</div>
            
            <div className="text-center">
              {flavourB.colour && (
                <div
                  className="w-16 h-16 rounded-full border-2 border-white shadow-md mx-auto mb-2"
                  style={{ backgroundColor: flavourB.colour }}
                />
              )}
              <p className="text-sm font-medium text-gray-900">{flavourB.name}</p>
            </div>
          </div>
          
          <div className="mt-3 text-center">
            <p className="text-sm text-gray-600">
              Default name: <span className="font-medium">{flavourA.name} + {flavourB.name} Twist</span>
            </p>
          </div>
        </div>
      )}

      {/* Custom Display Name (Optional) */}
      {onDisplayNameChange && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Display Name (Optional)
          </label>
          <input
            type="text"
            value={customDisplayName || ''}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder="e.g., Sicilian Twist, Summer Swirl"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave blank to use default naming: "{flavourA?.name || 'Flavour A'} + {flavourB?.name || 'Flavour B'} Twist"
          </p>
        </div>
      )}

      {/* Validation Message */}
      {selectedFlavourIds.length < 2 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            Please select both flavours to create a twist combination
          </p>
        </div>
      )}
    </div>
  );
}
