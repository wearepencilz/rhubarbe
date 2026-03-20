/**
 * Unit Tests for Pickup Location Editor Form
 *
 * Tests the CMS editor form for creating and editing pickup locations.
 * Requirements: 16.6-16.7
 *
 * Tests cover:
 * - Form rendering (create vs edit mode)
 * - Validation (required fields, URL format)
 * - Save/cancel actions
 *
 * @vitest-environment jsdom
 */

import React from 'react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditPickupLocationPage from './page';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockToast = { success: vi.fn(), error: vi.fn() };
vi.mock('@/app/admin/components/ToastContainer', () => ({
  useToast: () => mockToast,
}));

// Mock EditPageLayout to expose save/cancel as simple buttons
vi.mock('@/app/admin/components/EditPageLayout', () => ({
  default: ({ title, children, onSave, onCancel, saving }: any) => (
    <div>
      <h1>{title}</h1>
      <div>{children}</div>
      <button onClick={onCancel}>Cancel</button>
      <button onClick={onSave} disabled={saving}>Save Changes</button>
    </div>
  ),
}));

// Mock Input
vi.mock('@/app/admin/components/ui/input', () => ({
  Input: React.forwardRef(({ label, value, onChange, placeholder, errorMessage, type, helperText, ...rest }: any, ref: any) => (
    <div>
      {label && <label>{label}</label>}
      <input
        ref={ref}
        value={value ?? ''}
        onChange={(e: any) => onChange?.(e.target.value)}
        placeholder={placeholder}
        type={type || 'text'}
        aria-label={label}
      />
      {errorMessage && <span role="alert">{errorMessage}</span>}
    </div>
  )),
}));

// Mock Textarea
vi.mock('@/app/admin/components/ui/textarea', () => ({
  Textarea: React.forwardRef(({ label, value, onChange, placeholder, errorMessage, ...rest }: any, ref: any) => (
    <div>
      {label && <label>{label}</label>}
      <textarea
        ref={ref}
        value={value ?? ''}
        onChange={(e: any) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
      />
      {errorMessage && <span role="alert">{errorMessage}</span>}
    </div>
  )),
}));

// Mock Checkbox
vi.mock('@/app/admin/components/ui/checkbox', () => ({
  Checkbox: ({ label, isSelected, onChange, hint }: any) => (
    <label>
      <input type="checkbox" checked={isSelected ?? false} onChange={(e: any) => onChange?.(e.target.checked)} />
      {label}
    </label>
  ),
}));

// Mock TranslationFields
vi.mock('@/app/admin/components/TranslationFields', () => ({
  default: ({ fields, base, onBaseChange }: any) => (
    <div data-testid="translation-fields">
      {fields.map((f: any) => (
        <div key={f.key}>
          <label>{f.label}</label>
          <input
            value={base[f.key] ?? ''}
            onChange={(e: any) => onBaseChange?.(f.key, e.target.value)}
            placeholder={f.placeholder}
            aria-label={f.label}
          />
        </div>
      ))}
    </div>
  ),
}));

// Mock fetch
global.fetch = vi.fn();

// ── Test Data ──────────────────────────────────────────────────────────────────

const mockLocationResponse = {
  id: 'loc-123',
  internalName: 'Rhubarbe Shop – Mile End',
  publicLabel: { en: 'Rhubarbe – Mile End', fr: 'Rhubarbe – Mile End' },
  address: '1234 Rue Saint-Laurent, Montréal, QC H2W 1Z4',
  pickupInstructions: { en: 'Enter through the side door', fr: 'Entrez par la porte latérale' },
  contactDetails: '514-555-0123',
  active: true,
  sortOrder: 0,
  mapOrDirectionsLink: 'https://maps.google.com/test',
  operationalNotesForStaff: 'Key under the mat',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

function mockFetchForEdit() {
  (global.fetch as any).mockImplementation((url: string) => {
    if (url.includes('/api/pickup-locations/loc-123')) {
      return Promise.resolve({ ok: true, json: async () => mockLocationResponse });
    }
    return Promise.resolve({ ok: true, json: async () => [] });
  });
}

function mockFetchForCreate() {
  (global.fetch as any).mockImplementation(() =>
    Promise.resolve({ ok: true, json: async () => [] }),
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('EditPickupLocationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render create mode title', () => {
      mockFetchForCreate();
      render(<EditPickupLocationPage params={{ id: 'create' }} />);
      expect(screen.getByText('New Pickup Location')).toBeInTheDocument();
    });

    it('should render edit mode title after loading', async () => {
      mockFetchForEdit();
      render(<EditPickupLocationPage params={{ id: 'loc-123' }} />);
      await waitFor(() => {
        expect(screen.getByText('Edit Pickup Location')).toBeInTheDocument();
      });
    });

    it('should populate form fields from API data', async () => {
      mockFetchForEdit();
      render(<EditPickupLocationPage params={{ id: 'loc-123' }} />);
      await waitFor(() => {
        expect(screen.getByDisplayValue('Rhubarbe Shop – Mile End')).toBeInTheDocument();
        expect(screen.getByDisplayValue('514-555-0123')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://maps.google.com/test')).toBeInTheDocument();
      });
    });

    it('should render all section cards', () => {
      mockFetchForCreate();
      render(<EditPickupLocationPage params={{ id: 'create' }} />);
      expect(screen.getByText('Basic Info')).toBeInTheDocument();
      expect(screen.getByText('Customer-Facing Content')).toBeInTheDocument();
      expect(screen.getByText('Location Details')).toBeInTheDocument();
      expect(screen.getByText('Staff Notes')).toBeInTheDocument();
    });

    it('should render Save and Cancel buttons', () => {
      mockFetchForCreate();
      render(<EditPickupLocationPage params={{ id: 'create' }} />);
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should redirect if location fetch fails', async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/pickup-locations/bad-id')) {
          return Promise.resolve({ ok: false });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });
      render(<EditPickupLocationPage params={{ id: 'bad-id' }} />);
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/pickup-locations');
      });
    });
  });

  describe('Validation', () => {
    it('should show errors for empty required fields on save', async () => {
      mockFetchForCreate();
      render(<EditPickupLocationPage params={{ id: 'create' }} />);
      await userEvent.click(screen.getByText('Save Changes'));
      await waitFor(() => {
        expect(screen.getByText('Internal name is required')).toBeInTheDocument();
        expect(screen.getByText('Address is required')).toBeInTheDocument();
        expect(screen.getByText('Contact details are required')).toBeInTheDocument();
      });
    });

    it('should not call API when validation fails', async () => {
      mockFetchForCreate();
      render(<EditPickupLocationPage params={{ id: 'create' }} />);
      (global.fetch as any).mockClear();
      await userEvent.click(screen.getByText('Save Changes'));
      expect(global.fetch).not.toHaveBeenCalledWith(
        '/api/pickup-locations',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('Save/Cancel Actions', () => {
    it('should navigate back on cancel', async () => {
      mockFetchForCreate();
      render(<EditPickupLocationPage params={{ id: 'create' }} />);
      await userEvent.click(screen.getByText('Cancel'));
      expect(mockPush).toHaveBeenCalledWith('/admin/pickup-locations');
    });

    it('should PATCH on save in edit mode', async () => {
      (global.fetch as any).mockImplementation((url: string, opts?: any) => {
        if (opts?.method === 'PATCH') {
          return Promise.resolve({ ok: true, json: async () => ({ id: 'loc-123' }) });
        }
        if (url.includes('/api/pickup-locations/loc-123') && !opts?.method) {
          return Promise.resolve({ ok: true, json: async () => mockLocationResponse });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });
      render(<EditPickupLocationPage params={{ id: 'loc-123' }} />);
      await waitFor(() => {
        expect(screen.getByDisplayValue('Rhubarbe Shop – Mile End')).toBeInTheDocument();
      });
      await userEvent.click(screen.getByText('Save Changes'));
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/pickup-locations/loc-123',
          expect.objectContaining({ method: 'PATCH' }),
        );
      });
    });

    it('should show success toast after save', async () => {
      (global.fetch as any).mockImplementation((url: string, opts?: any) => {
        if (opts?.method === 'PATCH') {
          return Promise.resolve({ ok: true, json: async () => ({ id: 'loc-123' }) });
        }
        if (url.includes('/api/pickup-locations/loc-123') && !opts?.method) {
          return Promise.resolve({ ok: true, json: async () => mockLocationResponse });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });
      render(<EditPickupLocationPage params={{ id: 'loc-123' }} />);
      await waitFor(() => {
        expect(screen.getByDisplayValue('Rhubarbe Shop – Mile End')).toBeInTheDocument();
      });
      await userEvent.click(screen.getByText('Save Changes'));
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'Location saved',
          expect.stringContaining('Rhubarbe Shop'),
        );
      });
    });

    it('should show error toast on save failure', async () => {
      (global.fetch as any).mockImplementation((url: string, opts?: any) => {
        if (opts?.method === 'PATCH') {
          return Promise.resolve({ ok: false, json: async () => ({ error: 'Duplicate name' }) });
        }
        if (url.includes('/api/pickup-locations/loc-123') && !opts?.method) {
          return Promise.resolve({ ok: true, json: async () => mockLocationResponse });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });
      render(<EditPickupLocationPage params={{ id: 'loc-123' }} />);
      await waitFor(() => {
        expect(screen.getByDisplayValue('Rhubarbe Shop – Mile End')).toBeInTheDocument();
      });
      await userEvent.click(screen.getByText('Save Changes'));
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Save failed', 'Duplicate name');
      });
    });
  });
});
