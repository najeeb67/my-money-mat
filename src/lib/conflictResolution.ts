/**
 * Conflict Resolution Module for Offline/Online Sync
 * 
 * This module handles data conflicts when the same budget item
 * is modified both offline (locally) and on the server.
 * 
 * Conflict detection is based on comparing timestamps (updatedAt).
 * Resolution strategies include: keep local, keep server, or merge.
 */

import { BudgetItem } from './budgetDb';

/**
 * Represents a conflict between local and server versions of an item
 */
export interface SyncConflict {
  localItem: BudgetItem;
  serverItem: ServerBudgetItem;
  conflictType: 'update' | 'delete_local' | 'delete_server' | 'both_modified';
}

/**
 * Server response format for budget items
 */
export interface ServerBudgetItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string; // ISO string from server
  updatedAt: string; // ISO string from server
  createdAt: string;
  deleted: boolean;
}

/**
 * Resolution strategy chosen by user or auto-resolved
 */
export type ConflictResolution = 'keep_local' | 'keep_server' | 'merge' | 'pending';

/**
 * Resolved conflict with the chosen resolution
 */
export interface ResolvedConflict extends SyncConflict {
  resolution: ConflictResolution;
  mergedItem?: BudgetItem;
}

/**
 * Detect conflicts between local and server versions
 * 
 * A conflict exists when:
 * 1. Both versions have different updatedAt timestamps (both were modified)
 * 2. One is deleted locally while modified on server
 * 3. One is deleted on server while modified locally
 */
export function detectConflict(
  localItem: BudgetItem,
  serverItem: ServerBudgetItem
): SyncConflict | null {
  const localUpdated = localItem.updatedAt.getTime();
  const serverUpdated = new Date(serverItem.updatedAt).getTime();

  // Check for delete conflicts
  if (localItem.deleted && !serverItem.deleted) {
    // Local was deleted, but server was modified
    if (serverUpdated > localUpdated) {
      return {
        localItem,
        serverItem,
        conflictType: 'delete_local',
      };
    }
    return null; // Local delete is newer, no conflict
  }

  if (!localItem.deleted && serverItem.deleted) {
    // Server was deleted, but local was modified
    if (localUpdated > serverUpdated) {
      return {
        localItem,
        serverItem,
        conflictType: 'delete_server',
      };
    }
    return null; // Server delete is newer, no conflict
  }

  // Both versions exist - check if both were modified
  // Allow a small time difference (1 second) to account for sync delays
  const TIME_TOLERANCE = 1000;
  
  if (Math.abs(localUpdated - serverUpdated) > TIME_TOLERANCE) {
    // Both were modified at different times
    return {
      localItem,
      serverItem,
      conflictType: 'both_modified',
    };
  }

  return null; // No conflict - timestamps match
}

/**
 * Auto-resolve conflicts using last-write-wins strategy
 * Returns the newer version based on updatedAt
 */
export function autoResolveConflict(conflict: SyncConflict): ResolvedConflict {
  const localUpdated = conflict.localItem.updatedAt.getTime();
  const serverUpdated = new Date(conflict.serverItem.updatedAt).getTime();

  if (localUpdated >= serverUpdated) {
    return {
      ...conflict,
      resolution: 'keep_local',
    };
  } else {
    return {
      ...conflict,
      resolution: 'keep_server',
    };
  }
}

/**
 * Merge two versions of an item
 * Takes non-null values from both, preferring the newer update for each field
 */
export function mergeItems(
  localItem: BudgetItem,
  serverItem: ServerBudgetItem
): BudgetItem {
  const localUpdated = localItem.updatedAt.getTime();
  const serverUpdated = new Date(serverItem.updatedAt).getTime();

  // For merge, we take the more recent value for each field
  // In practice, we use the local values but keep track that it needs re-sync
  return {
    id: localItem.id,
    category: localUpdated >= serverUpdated ? localItem.category : serverItem.category,
    description: localUpdated >= serverUpdated ? localItem.description : serverItem.description,
    amount: localUpdated >= serverUpdated ? localItem.amount : serverItem.amount,
    type: localUpdated >= serverUpdated ? localItem.type : serverItem.type as 'income' | 'expense',
    date: localUpdated >= serverUpdated ? localItem.date : new Date(serverItem.date),
    synced: false, // Needs to sync the merged version
    updatedAt: new Date(), // Mark as freshly updated
    createdAt: localItem.createdAt,
    deleted: false,
  };
}

/**
 * Convert server item to local BudgetItem format
 */
export function serverItemToLocal(serverItem: ServerBudgetItem): BudgetItem {
  return {
    id: serverItem.id,
    category: serverItem.category,
    description: serverItem.description,
    amount: serverItem.amount,
    type: serverItem.type,
    date: new Date(serverItem.date),
    synced: true, // Server version is already synced
    updatedAt: new Date(serverItem.updatedAt),
    createdAt: new Date(serverItem.createdAt),
    deleted: serverItem.deleted,
  };
}

/**
 * Apply resolution to get the final item
 */
export function applyResolution(resolved: ResolvedConflict): BudgetItem {
  switch (resolved.resolution) {
    case 'keep_local':
      return {
        ...resolved.localItem,
        synced: false, // Still needs to sync to override server
      };
    case 'keep_server':
      return serverItemToLocal(resolved.serverItem);
    case 'merge':
      return resolved.mergedItem || mergeItems(resolved.localItem, resolved.serverItem);
    default:
      // Default to local version if resolution is pending
      return resolved.localItem;
  }
}
