'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Table, TableCard } from '@/src/app/admin/components/ui/application/table/table';
import { Badge } from '@/src/app/admin/components/ui/base/badges/badges';
import { Select } from '@/src/app/admin/components/ui/base/select/select';
import { Button } from '@/app/admin/components/ui/buttons/button';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Edit01, Trash01, SearchLg, ChevronUp, ChevronDown } from '@untitledui/icons';

interface PickupLocation {
  id: string;
  internalName: string;
  publicLabel: { en: string; fr: string };
  address: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function PickupLocationsPage() {
  const router = useRouter();
  const toast = useToast();
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: '', name: '' });
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeFilter]);

  async function fetchData() {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (activeFilter !== 'all') {
        params.append('active', activeFilter);
      }

      const response = await fetch(`/api/pickup-locations?${params}`);
      if (response.ok) {
        setLocations(await response.json());
      }
    } catch (error) {
      console.error('Error fetching pickup locations:', error);
      toast.error('Fetch failed', 'Failed to load pickup locations');
    } finally {
      setLoading(false);
    }
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    const index = locations.findIndex((loc) => loc.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === locations.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...locations];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];

    // Build new sort_order values based on array position
    const updates = reordered.map((loc, i) => ({ id: loc.id, sort_order: i }));

    // Optimistic update
    const updatedLocations = reordered.map((loc, i) => ({ ...loc, sortOrder: i }));
    setLocations(updatedLocations);
    setReordering(true);

    try {
      const response = await fetch('/api/pickup-locations/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        toast.error('Reorder failed', 'Failed to update sort order');
        fetchData(); // Revert on failure
      }
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Reorder failed', 'Failed to update sort order');
      fetchData();
    } finally {
      setReordering(false);
    }
  }

  const handleDelete = async () => {
    const response = await fetch(`/api/pickup-locations/${deleteConfirm.id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setLocations(locations.filter((loc) => loc.id !== deleteConfirm.id));
      toast.success('Location deactivated', `"${deleteConfirm.name}" has been deactivated`);
      setDeleteConfirm({ show: false, id: '', name: '' });
    } else {
      const error = await response.json();
      toast.error('Delete failed', error.error || 'Failed to deactivate location');
      setDeleteConfirm({ show: false, id: '', name: '' });
    }
  };

  // Client-side search filtering
  const filteredLocations = locations.filter((loc) =>
    loc.internalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.publicLabel.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.publicLabel.fr.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <TableCard.Root>
        <TableCard.Header
          title="Pickup Locations"
          badge={filteredLocations.length}
          description="Manage pickup locations for preorder fulfillment"
          contentTrailing={
            <div className="flex items-center gap-3">
              <div className="relative">
                <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 w-52"
                />
              </div>
              <Select
                placeholder="All statuses"
                selectedKey={activeFilter}
                onSelectionChange={(key) => setActiveFilter(key as string)}
                items={[
                  { id: 'all', label: 'All statuses' },
                  { id: 'true', label: 'Active' },
                  { id: 'false', label: 'Inactive' },
                ]}
              >
                {(item) => <Select.Item id={item.id} label={item.label} />}
              </Select>
              <Link href="/admin/pickup-locations/create">
                <Button color="primary" size="sm">Create location</Button>
              </Link>
            </div>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-tertiary">
              {searchTerm ? 'No locations match your search' : 'No pickup locations found'}
            </p>
            <Link href="/admin/pickup-locations/create">
              <Button color="secondary" size="sm">Create your first location</Button>
            </Link>
          </div>
        ) : (
          <Table aria-label="Pickup Locations">
            <Table.Header>
              <Table.Head isRowHeader label="Internal Name" />
              <Table.Head label="Public Label" />
              <Table.Head label="Status" />
              <Table.Head label="Order" />
              <Table.Head label="" />
            </Table.Header>
            <Table.Body items={filteredLocations}>
              {(location) => (
                <Table.Row
                  key={location.id}
                  id={location.id}
                  onAction={() => router.push(`/admin/pickup-locations/${location.id}`)}
                >
                  <Table.Cell>
                    <div>
                      <p className="text-sm font-medium text-primary">{location.internalName}</p>
                      <p className="text-xs text-tertiary truncate max-w-md mt-0.5">
                        {location.address}
                      </p>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div>
                      <p className="text-sm text-primary">{location.publicLabel.en}</p>
                      <p className="text-xs text-tertiary mt-0.5">{location.publicLabel.fr}</p>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={location.active ? 'success' : 'gray'}>
                      {location.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <span className="text-sm text-tertiary mr-1">{location.sortOrder}</span>
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                        disabled={reordering || filteredLocations.indexOf(location) === 0}
                        onClick={() => handleReorder(location.id, 'up')}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                        disabled={reordering || filteredLocations.indexOf(location) === filteredLocations.length - 1}
                        onClick={() => handleReorder(location.id, 'down')}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/pickup-locations/${location.id}`}>
                        <button
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded"
                          title="Edit"
                        >
                          <Edit01 className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                        title="Deactivate"
                        onClick={() => setDeleteConfirm({
                          show: true,
                          id: location.id,
                          name: location.internalName,
                        })}
                      >
                        <Trash01 className="w-4 h-4" />
                      </button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        )}
      </TableCard.Root>

      <ConfirmModal
        isOpen={deleteConfirm.show}
        variant="danger"
        title="Deactivate Pickup Location"
        message={`Are you sure you want to deactivate "${deleteConfirm.name}"? The location will be marked as inactive.`}
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: '', name: '' })}
      />
    </>
  );
}
