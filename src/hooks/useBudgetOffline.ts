/**
 * Custom Hook for Offline Budget Management
 * 
 * This hook provides React state management for budget items stored in IndexedDB.
 * It handles CRUD operations and automatically tracks sync status.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  BudgetItem,
  initBudgetDatabase,
  getAllBudgetItems,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  getUnsyncedItems,
  getBudgetSummary,
} from '@/lib/budgetDb';

interface BudgetState {
  items: BudgetItem[];
  isLoading: boolean;
  error: string | null;
  unsyncedCount: number;
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

interface UseBudgetOfflineReturn extends BudgetState {
  // CRUD operations
  addItem: (item: Omit<BudgetItem, 'id' | 'synced' | 'updatedAt' | 'createdAt' | 'deleted'>) => Promise<BudgetItem | null>;
  editItem: (id: string, updates: Partial<BudgetItem>) => Promise<BudgetItem | null>;
  removeItem: (id: string) => Promise<boolean>;
  // Utility functions
  refreshItems: () => Promise<void>;
  getUnsynced: () => Promise<BudgetItem[]>;
}

export function useBudgetOffline(): UseBudgetOfflineReturn {
  const [state, setState] = useState<BudgetState>({
    items: [],
    isLoading: true,
    error: null,
    unsyncedCount: 0,
    summary: { totalIncome: 0, totalExpense: 0, balance: 0 },
  });

  /**
   * Load all budget items from IndexedDB
   * Updates both the items list and summary statistics
   */
  const refreshItems = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Ensure database is initialized
      await initBudgetDatabase();

      // Fetch all items and unsynced count in parallel
      const [items, unsyncedItems, summary] = await Promise.all([
        getAllBudgetItems(),
        getUnsyncedItems(),
        getBudgetSummary(),
      ]);

      setState({
        items,
        isLoading: false,
        error: null,
        unsyncedCount: unsyncedItems.length,
        summary,
      });

      console.log('[useBudgetOffline] Loaded', items.length, 'items,', unsyncedItems.length, 'unsynced');
    } catch (err) {
      console.error('[useBudgetOffline] Error loading items:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load budget items',
      }));
    }
  }, []);

  /**
   * Initialize database and load items on mount
   */
  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  /**
   * Add a new budget item
   * The item is stored in IndexedDB and marked as unsynced
   */
  const addItem = useCallback(async (
    item: Omit<BudgetItem, 'id' | 'synced' | 'updatedAt' | 'createdAt' | 'deleted'>
  ): Promise<BudgetItem | null> => {
    try {
      const newItem = await addBudgetItem(item);
      
      // Optimistically update state
      setState(prev => ({
        ...prev,
        items: [newItem, ...prev.items],
        unsyncedCount: prev.unsyncedCount + 1,
        summary: {
          ...prev.summary,
          totalIncome: prev.summary.totalIncome + (item.type === 'income' ? item.amount : 0),
          totalExpense: prev.summary.totalExpense + (item.type === 'expense' ? item.amount : 0),
          balance: prev.summary.balance + (item.type === 'income' ? item.amount : -item.amount),
        },
      }));

      console.log('[useBudgetOffline] Added item:', newItem.id);
      return newItem;
    } catch (err) {
      console.error('[useBudgetOffline] Error adding item:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to add item',
      }));
      return null;
    }
  }, []);

  /**
   * Edit an existing budget item
   * Updates IndexedDB and marks the item as unsynced
   */
  const editItem = useCallback(async (
    id: string,
    updates: Partial<BudgetItem>
  ): Promise<BudgetItem | null> => {
    try {
      const updatedItem = await updateBudgetItem(id, updates);
      
      if (updatedItem) {
        // Update state with the modified item
        setState(prev => ({
          ...prev,
          items: prev.items.map(item => 
            item.id === id ? updatedItem : item
          ),
          unsyncedCount: prev.unsyncedCount + (prev.items.find(i => i.id === id)?.synced ? 1 : 0),
        }));

        // Refresh summary if amount or type changed
        if (updates.amount !== undefined || updates.type !== undefined) {
          const summary = await getBudgetSummary();
          setState(prev => ({ ...prev, summary }));
        }

        console.log('[useBudgetOffline] Edited item:', id);
      }
      
      return updatedItem;
    } catch (err) {
      console.error('[useBudgetOffline] Error editing item:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to edit item',
      }));
      return null;
    }
  }, []);

  /**
   * Delete a budget item (soft delete)
   * The item is marked as deleted and unsynced for server sync
   */
  const removeItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Find the item to calculate summary update
      const itemToDelete = state.items.find(item => item.id === id);
      
      const success = await deleteBudgetItem(id);
      
      if (success && itemToDelete) {
        // Remove from UI immediately
        setState(prev => ({
          ...prev,
          items: prev.items.filter(item => item.id !== id),
          unsyncedCount: prev.unsyncedCount + 1,
          summary: {
            ...prev.summary,
            totalIncome: prev.summary.totalIncome - (itemToDelete.type === 'income' ? itemToDelete.amount : 0),
            totalExpense: prev.summary.totalExpense - (itemToDelete.type === 'expense' ? itemToDelete.amount : 0),
            balance: prev.summary.balance - (itemToDelete.type === 'income' ? itemToDelete.amount : -itemToDelete.amount),
          },
        }));

        console.log('[useBudgetOffline] Removed item:', id);
      }
      
      return success;
    } catch (err) {
      console.error('[useBudgetOffline] Error removing item:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to remove item',
      }));
      return false;
    }
  }, [state.items]);

  /**
   * Get all unsynced items for sync operation
   */
  const getUnsynced = useCallback(async (): Promise<BudgetItem[]> => {
    return getUnsyncedItems();
  }, []);

  return {
    ...state,
    addItem,
    editItem,
    removeItem,
    refreshItems,
    getUnsynced,
  };
}
