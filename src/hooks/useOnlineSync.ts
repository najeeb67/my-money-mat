/**
 * Custom Hook for Online/Offline Detection and Auto-Sync
 * 
 * This hook monitors the browser's online status and automatically
 * syncs unsynced budget items when the connection is restored.
 * Includes conflict detection and resolution for items modified both locally and on server.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { BudgetItem, getUnsyncedItems, markItemsAsSynced, updateBudgetItem, hardDeleteBudgetItem } from '@/lib/budgetDb';
import { toast } from 'sonner';
import {
  SyncConflict,
  ResolvedConflict,
  ServerBudgetItem,
  detectConflict,
  autoResolveConflict,
  applyResolution,
} from '@/lib/conflictResolution';

// API base URL - uses the same pattern as the rest of the app
const getApiBaseUrl = () => {
  return localStorage.getItem('api_base_url') || 
    import.meta.env.VITE_API_BASE_URL || 
    'https://christian-lianne-developmentsolution-814bfc29.koyeb.app';
};

interface SyncResult {
  success: boolean;
  syncedIds: string[];
  failedIds: string[];
  conflicts: SyncConflict[];
  error?: string;
}

interface UseOnlineSyncReturn {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  unsyncedCount: number;
  conflicts: SyncConflict[];
  hasConflicts: boolean;
  triggerSync: () => Promise<SyncResult>;
  resolveConflicts: (resolutions: ResolvedConflict[]) => Promise<void>;
  autoResolveAllConflicts: () => Promise<void>;
  clearConflicts: () => void;
}

/**
 * Fetch server versions of items to check for conflicts
 */
async function fetchServerItems(ids: string[]): Promise<Map<string, ServerBudgetItem>> {
  const apiUrl = getApiBaseUrl();
  const token = localStorage.getItem('access_token');
  
  try {
    const response = await fetch(`${apiUrl}/api/budget/items?ids=${ids.join(',')}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      // If endpoint doesn't exist or returns error, return empty map
      // This allows sync to proceed without conflict checking
      console.log('[Sync] Server items endpoint not available, skipping conflict check');
      return new Map();
    }

    const result = await response.json();
    const serverItems = new Map<string, ServerBudgetItem>();
    
    if (result.items && Array.isArray(result.items)) {
      result.items.forEach((item: ServerBudgetItem) => {
        serverItems.set(item.id, item);
      });
    }
    
    return serverItems;
  } catch (err) {
    console.log('[Sync] Could not fetch server items for conflict check:', err);
    return new Map();
  }
}

/**
 * Sync unsynced items to the FastAPI backend
 * Sends a batch of items to POST /api/budget/sync
 * Returns conflicts if any are detected
 */
async function syncItemsToServer(items: BudgetItem[]): Promise<SyncResult> {
  const apiUrl = getApiBaseUrl();
  
  try {
    console.log('[Sync] Checking for conflicts before sync...');
    
    // Fetch server versions to detect conflicts
    const serverItems = await fetchServerItems(items.map(i => i.id));
    const conflicts: SyncConflict[] = [];
    const itemsToSync: BudgetItem[] = [];
    
    // Check each item for conflicts
    for (const localItem of items) {
      const serverItem = serverItems.get(localItem.id);
      
      if (serverItem) {
        const conflict = detectConflict(localItem, serverItem);
        if (conflict) {
          conflicts.push(conflict);
          console.log('[Sync] Conflict detected for item:', localItem.id);
        } else {
          itemsToSync.push(localItem);
        }
      } else {
        // No server version exists, safe to sync
        itemsToSync.push(localItem);
      }
    }
    
    // If there are conflicts, return them for user resolution
    if (conflicts.length > 0) {
      console.log('[Sync] Found', conflicts.length, 'conflicts requiring resolution');
      return {
        success: false,
        syncedIds: [],
        failedIds: [],
        conflicts,
        error: `${conflicts.length} conflict(s) detected. Please resolve them.`,
      };
    }

    // No conflicts, proceed with sync
    if (itemsToSync.length === 0) {
      return { success: true, syncedIds: [], failedIds: [], conflicts: [] };
    }

    console.log('[Sync] Sending', itemsToSync.length, 'items to server');

    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${apiUrl}/api/budget/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        items: itemsToSync.map(item => ({
          id: item.id,
          category: item.category,
          description: item.description,
          amount: item.amount,
          type: item.type,
          date: item.date.toISOString(),
          deleted: item.deleted,
          updatedAt: item.updatedAt.toISOString(),
          createdAt: item.createdAt.toISOString(),
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server returned ${response.status}`);
    }

    const result = await response.json();
    
    const syncedIds = result.syncedIds || itemsToSync.map(i => i.id);
    const failedIds = result.failedIds || [];

    console.log('[Sync] Server accepted', syncedIds.length, 'items');

    return {
      success: true,
      syncedIds,
      failedIds,
      conflicts: [],
    };
  } catch (err) {
    console.error('[Sync] Failed to sync items:', err);
    return {
      success: false,
      syncedIds: [],
      failedIds: items.map(i => i.id),
      conflicts: [],
      error: err instanceof Error ? err.message : 'Sync failed',
    };
  }
}

export function useOnlineSync(onSyncComplete?: () => void): UseOnlineSyncReturn {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);

  const syncInProgress = useRef<boolean>(false);

  /**
   * Update unsynced count
   */
  const updateUnsyncedCount = useCallback(async () => {
    try {
      const items = await getUnsyncedItems();
      setUnsyncedCount(items.length);
    } catch (err) {
      console.error('[Sync] Error getting unsynced count:', err);
    }
  }, []);

  /**
   * Clear conflicts (e.g., after resolution)
   */
  const clearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  /**
   * Resolve conflicts with user-provided resolutions
   */
  const resolveConflicts = useCallback(async (resolutions: ResolvedConflict[]) => {
    console.log('[Sync] Applying', resolutions.length, 'conflict resolutions');
    
    for (const resolved of resolutions) {
      const finalItem = applyResolution(resolved);
      
      if (resolved.resolution === 'keep_server' && resolved.serverItem.deleted) {
        // Server version is deleted, remove local copy
        await hardDeleteBudgetItem(resolved.localItem.id);
      } else {
        // Update local item with resolved version
        await updateBudgetItem(resolved.localItem.id, {
          category: finalItem.category,
          description: finalItem.description,
          amount: finalItem.amount,
          type: finalItem.type,
          date: finalItem.date,
          synced: finalItem.synced,
          deleted: finalItem.deleted,
        });
      }
    }
    
    // Clear conflicts and refresh
    setConflicts([]);
    await updateUnsyncedCount();
    onSyncComplete?.();
    
    toast.success('Conflicts resolved successfully');
    
    // Trigger a new sync to push resolved items
    setTimeout(() => {
      syncInProgress.current = false;
      triggerSync();
    }, 500);
  }, [updateUnsyncedCount, onSyncComplete]);

  /**
   * Auto-resolve all conflicts using last-write-wins
   */
  const autoResolveAllConflicts = useCallback(async () => {
    if (conflicts.length === 0) return;
    
    const resolutions = conflicts.map(conflict => autoResolveConflict(conflict));
    await resolveConflicts(resolutions);
  }, [conflicts, resolveConflicts]);

  /**
   * Perform sync operation
   */
  const triggerSync = useCallback(async (): Promise<SyncResult> => {
    if (syncInProgress.current || isSyncing) {
      console.log('[Sync] Sync already in progress, skipping');
      return { success: false, syncedIds: [], failedIds: [], conflicts: [], error: 'Sync already in progress' };
    }

    if (!navigator.onLine) {
      console.log('[Sync] Offline, cannot sync');
      return { success: false, syncedIds: [], failedIds: [], conflicts: [], error: 'No internet connection' };
    }

    syncInProgress.current = true;
    setIsSyncing(true);
    setSyncError(null);

    try {
      const unsyncedItems = await getUnsyncedItems();

      if (unsyncedItems.length === 0) {
        console.log('[Sync] No items to sync');
        setLastSyncTime(new Date());
        return { success: true, syncedIds: [], failedIds: [], conflicts: [] };
      }

      console.log('[Sync] Found', unsyncedItems.length, 'unsynced items');
      
      const toastId = toast.loading(`Syncing ${unsyncedItems.length} items...`);

      const result = await syncItemsToServer(unsyncedItems);

      // Handle conflicts
      if (result.conflicts.length > 0) {
        setConflicts(result.conflicts);
        toast.warning(`${result.conflicts.length} conflict(s) need resolution`, { 
          id: toastId,
          description: 'Some items were modified both locally and on the server.' 
        });
        return result;
      }

      if (result.success && result.syncedIds.length > 0) {
        await markItemsAsSynced(result.syncedIds);
        setLastSyncTime(new Date());
        await updateUnsyncedCount();
        onSyncComplete?.();
        toast.success(`Synced ${result.syncedIds.length} items`, { id: toastId });
        console.log('[Sync] Successfully synced', result.syncedIds.length, 'items');
      } else if (result.error) {
        setSyncError(result.error);
        toast.error('Sync failed', { id: toastId, description: result.error });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setSyncError(errorMessage);
      console.error('[Sync] Error during sync:', err);
      return { success: false, syncedIds: [], failedIds: [], conflicts: [], error: errorMessage };
    } finally {
      setIsSyncing(false);
      syncInProgress.current = false;
    }
  }, [isSyncing, updateUnsyncedCount, onSyncComplete]);

  /**
   * Handle online event
   */
  const handleOnline = useCallback(() => {
    console.log('[Sync] Connection restored, triggering sync');
    setIsOnline(true);
    toast.success('Back online!', { description: 'Syncing your changes...' });
    
    setTimeout(() => {
      triggerSync();
    }, 1000);
  }, [triggerSync]);

  /**
   * Handle offline event
   */
  const handleOffline = useCallback(() => {
    console.log('[Sync] Connection lost');
    setIsOnline(false);
    toast.warning('You are offline', { 
      description: 'Changes will be saved locally and synced when you reconnect.' 
    });
  }, []);

  /**
   * Set up event listeners
   */
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      updateUnsyncedCount().then(() => {
        triggerSync();
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline, updateUnsyncedCount, triggerSync]);

  /**
   * Periodic sync check
   */
  useEffect(() => {
    if (!isOnline) return;

    const intervalId = setInterval(() => {
      updateUnsyncedCount().then(() => {
        if (unsyncedCount > 0) {
          triggerSync();
        }
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isOnline, unsyncedCount, updateUnsyncedCount, triggerSync]);

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    syncError,
    unsyncedCount,
    conflicts,
    hasConflicts: conflicts.length > 0,
    triggerSync,
    resolveConflicts,
    autoResolveAllConflicts,
    clearConflicts,
  };
}
