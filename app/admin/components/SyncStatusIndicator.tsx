'use client';

import { useState } from 'react';
import type { SyncStatus } from '@/types';

interface Props {
  status: SyncStatus;
  lastSyncedAt?: string;
  syncError?: string;
  flavourId: string;
  productId?: string;
  onResync?: () => void;
}

export default function SyncStatusIndicator({ 
  status, 
  lastSyncedAt, 
  syncError, 
  flavourId,
  productId,
  onResync 
}: Props) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const handleResync = async () => {
    if (!productId) {
      setError('No product linked');
      return;
    }

    setSyncing(true);
    setError('');

    try {
      const response = await fetch('/api/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flavourId, productId })
      });

      const data = await response.json();

      if (response.ok) {
        if (onResync) onResync();
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      setError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'synced':
        return {
          label: 'Synced',
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: '✓',
          description: 'Product metafields are up to date'
        };
      case 'pending':
        return {
          label: 'Pending',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: '⏳',
          description: 'Waiting to sync to Shopify'
        };
      case 'failed':
        return {
          label: 'Failed',
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: '✗',
          description: 'Sync failed - see error below'
        };
      case 'not_linked':
      default:
        return {
          label: 'Not Linked',
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: '○',
          description: 'No Shopify product linked'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Sync Status
      </label>
      
      <div className={`border rounded-lg p-4 ${config.color}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <span className="text-lg">{config.icon}</span>
            <div>
              <p className="font-medium">{config.label}</p>
              <p className="text-sm opacity-90 mt-0.5">{config.description}</p>
              
              {lastSyncedAt && status === 'synced' && (
                <p className="text-xs opacity-75 mt-1">
                  Last synced: {new Date(lastSyncedAt).toLocaleString()}
                </p>
              )}
              
              {syncError && status === 'failed' && (
                <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs font-mono">
                  {syncError}
                </div>
              )}
              
              {error && (
                <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
                  {error}
                </div>
              )}
            </div>
          </div>
          
          {status !== 'not_linked' && productId && (
            <button
              type="button"
              onClick={handleResync}
              disabled={syncing}
              className="text-sm font-medium hover:underline disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Resync'}
            </button>
          )}
        </div>
      </div>
      
      {status === 'not_linked' && (
        <p className="text-xs text-gray-500">
          Link a Shopify product above to enable sync
        </p>
      )}
    </div>
  );
}
