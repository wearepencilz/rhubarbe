/**
 * Unit Tests for Pickup Locations List View
 *
 * Tests the CMS list view component for pickup locations.
 * Requirements: 15.5-15.8
 *
 * Tests cover:
 * - Component rendering
 * - Filtering by active status
 * - Search functionality
 * - Reordering (up/down buttons)
 * - Delete confirmation
 *
 * @vitest-environment jsdom
 */

import React from 'react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PickupLocationsPage from './page';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock toast
const mockToast = { success: vi.fn(), error: vi.fn() };
vi.mock('@/app/admin/components/ToastContainer', () => ({
  useToast: () => mockToast,
}));

// Mock fetch
global.fetch = vi.fn();

const mockLocations = [
  {
    id: 'loc-1',
    internalName: 'Rhubarbe Shop – Mile End',
    publicLabel: { en: 'Rhubarbe – Mile End', fr: 'Rhubarbe – Mile End' },
    address: '1234 Rue Saint-Laurent, Montréal',
    active: true,
    sortOrder: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'loc-2',
    internalName: 'Marché Jean-Talon Kiosk',
    publicLabel: { en: 'Jean-Talon Market', fr: 'Marché Jean-Talon' },
    address: '7070 Avenue Henri-Julien, Montréal',
    active: true,
    sortOrder: 1,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'loc-3',
    internalName: 'Old Port Pop-Up',
    publicLabel: { en: 'Old Port', fr: 'Vieux-Port' },
    address: '333 Rue de la Commune, Montréal',
    active: false,
    sortOrder: 2,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

describe('PickupLocationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockLocations,
    });
  });

  describe('Rendering', () => {
    it('should render the page title and description', async () => {
      render(<PickupLocationsPage />);
      await waitFor(() => {
        expect(screen.getByText('Pickup Locations')).toBeInTheDocument();
        expect(screen.getByText('Manage pickup locations for preorder fulfillment')).toBeInTheDocument();
      });
    });

    it('should render all locations after loading', async () => {
      render(<PickupLocationsPage />);
      await waitFor(() => {
        expect(screen.getByText('Rhubarbe Shop – Mile End')).toBeInTheDocument();
        expect(screen.getByText('Marché Jean-Talon Kiosk')).toBeInTheDocument();
        expect(screen.getByText('Old Port Pop-Up')).toBeInTheDocument();
      });
    });

    it('should display active status badges', async () => {
      render(<PickupLocationsPage />);
      await waitFor(() => {
        // "Active" appears in badges + filter option; "Inactive" in badge + filter option
        const activeBadges = screen.getAllByText('Active');
        expect(activeBadges.length).toBeGreaterThanOrEqual(2);
        const inactiveBadges = screen.getAllByText('Inactive');
        expect(inactiveBadges.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should display create button', async () => {
      render(<PickupLocationsPage />);
      await waitFor(() => {
        expect(screen.getByText('Create location')).toBeInTheDocument();
      });
    });

    it('should display empty state when no locations exist', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [],
      });
      render(<PickupLocationsPage />);
      await waitFor(() => {
        expect(screen.getByText('No pickup locations found')).toBeInTheDocument();
        expect(screen.getByText('Create your first location')).toBeInTheDocument();
      });
    });
  });

  describe('Search', () => {
    it('should filter locations by search term', async () => {
      render(<PickupLocationsPage />);
      await waitFor(() => {
        expect(screen.getByText('Rhubarbe Shop – Mile End')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search locations...');
      await userEvent.type(searchInput, 'Rhubarbe');

      await waitFor(() => {
        expect(screen.getByText('Rhubarbe Shop – Mile End')).toBeInTheDocument();
        expect(screen.queryByText('Marché Jean-Talon Kiosk')).not.toBeInTheDocument();
      });
    });

    it('should search by public label (FR)', async () => {
      render(<PickupLocationsPage />);
      await waitFor(() => {
        expect(screen.getByText('Marché Jean-Talon Kiosk')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search locations...');
      await userEvent.type(searchInput, 'Vieux-Port');

      await waitFor(() => {
        expect(screen.getByText('Old Port Pop-Up')).toBeInTheDocument();
        expect(screen.queryByText('Rhubarbe Shop – Mile End')).not.toBeInTheDocument();
      });
    });

    it('should show empty state when no locations match search', async () => {
      render(<PickupLocationsPage />);
      await waitFor(() => {
        expect(screen.getByText('Rhubarbe Shop – Mile End')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search locations...');
      await userEvent.type(searchInput, 'NonExistent');

      await waitFor(() => {
        expect(screen.getByText('No locations match your search')).toBeInTheDocument();
      });
    });
  });

  describe('Reordering', () => {
    it('should call reorder API when move down is clicked', async () => {
      render(<PickupLocationsPage />);
      await waitFor(() => {
        expect(screen.getByText('Rhubarbe Shop – Mile End')).toBeInTheDocument();
      });

      (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) });

      const moveDownButtons = screen.getAllByTitle('Move down');
      await userEvent.click(moveDownButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/pickup-locations/reorder',
          expect.objectContaining({ method: 'PATCH' }),
        );
      });
    });

    it('should show error toast on reorder failure', async () => {
      render(<PickupLocationsPage />);
      await waitFor(() => {
        expect(screen.getByText('Rhubarbe Shop – Mile End')).toBeInTheDocument();
      });

      (global.fetch as any).mockResolvedValue({ ok: false });

      const moveDownButtons = screen.getAllByTitle('Move down');
      await userEvent.click(moveDownButtons[0]);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Reorder failed', 'Failed to update sort order');
      });
    });
  });

  describe('Interactions', () => {
    it('should show deactivate confirmation modal', async () => {
      render(<PickupLocationsPage />);
      await waitFor(() => {
        expect(screen.getByText('Rhubarbe Shop – Mile End')).toBeInTheDocument();
      });

      const deactivateButtons = screen.getAllByTitle('Deactivate');
      await userEvent.click(deactivateButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Deactivate Pickup Location')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to deactivate/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error toast on fetch failure', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      render(<PickupLocationsPage />);
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Fetch failed', 'Failed to load pickup locations');
      });
    });
  });
});
