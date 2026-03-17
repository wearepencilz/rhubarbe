'use client';

import { parseDate } from '@internationalized/date';
import { DatePicker } from '@/app/admin/components/ui/date-picker/date-picker';

interface AvailabilitySchedulerProps {
  availabilityStart?: string;
  availabilityEnd?: string;
  location?: string;
  onUpdate: (data: {
    availabilityStart?: string;
    availabilityEnd?: string;
    location?: string;
  }) => void;
}

export default function AvailabilityScheduler({
  availabilityStart,
  availabilityEnd,
  location,
  onUpdate,
}: AvailabilitySchedulerProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability Schedule</h3>
      
      <div className="space-y-4">
        {/* Availability Start Date */}
        <div>
          <label className="block text-sm font-medium text-fg-secondary mb-1">
            Available From
          </label>
          <DatePicker
            value={availabilityStart ? parseDate(availabilityStart) : null}
            onChange={(date) => onUpdate({
              availabilityStart: date ? date.toString() : undefined,
              availabilityEnd,
              location,
            })}
          />
          <p className="mt-1 text-xs text-fg-tertiary">
            Leave blank for immediate availability
          </p>
        </div>

        {/* Availability End Date */}
        <div>
          <label className="block text-sm font-medium text-fg-secondary mb-1">
            Available Until
          </label>
          <DatePicker
            value={availabilityEnd ? parseDate(availabilityEnd) : null}
            minValue={availabilityStart ? parseDate(availabilityStart) : undefined}
            onChange={(date) => onUpdate({
              availabilityStart,
              availabilityEnd: date ? date.toString() : undefined,
              location,
            })}
          />
          <p className="mt-1 text-xs text-fg-tertiary">
            Leave blank for ongoing availability
          </p>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Specific Location
          </label>
          <input
            type="text"
            value={location || ''}
            onChange={(e) => onUpdate({
              availabilityStart,
              availabilityEnd,
              location: e.target.value,
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Main Shop, Pop-up Market"
          />
          <p className="mt-1 text-xs text-gray-500">
            Specify if this offering is only available at certain locations
          </p>
        </div>

        {/* Availability Summary */}
        {(availabilityStart || availabilityEnd || location) && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Availability Summary</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {availabilityStart && (
                <li>• Available from: {new Date(availabilityStart).toLocaleDateString()}</li>
              )}
              {availabilityEnd && (
                <li>• Available until: {new Date(availabilityEnd).toLocaleDateString()}</li>
              )}
              {location && (
                <li>• Location: {location}</li>
              )}
              {!availabilityStart && !availabilityEnd && (
                <li>• Available indefinitely</li>
              )}
            </ul>
          </div>
        )}

        {/* Quick Presets */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Quick Presets</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                const start = new Date();
                const end = new Date();
                end.setDate(end.getDate() + 7);
                onUpdate({
                  availabilityStart: start.toISOString().split('T')[0],
                  availabilityEnd: end.toISOString().split('T')[0],
                  location,
                });
              }}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => {
                const start = new Date();
                const end = new Date();
                end.setMonth(end.getMonth() + 1);
                onUpdate({
                  availabilityStart: start.toISOString().split('T')[0],
                  availabilityEnd: end.toISOString().split('T')[0],
                  location,
                });
              }}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => {
                const start = new Date();
                const end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
                onUpdate({
                  availabilityStart: start.toISOString().split('T')[0],
                  availabilityEnd: end.toISOString().split('T')[0],
                  location,
                });
              }}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              This Season
            </button>
            <button
              type="button"
              onClick={() => onUpdate({
                availabilityStart: undefined,
                availabilityEnd: undefined,
                location,
              })}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Dates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
