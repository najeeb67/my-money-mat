/**
 * Lovefield Database Setup for Offline Budget Storage
 * 
 * This module creates and manages an IndexedDB database using Lovefield.
 * Lovefield provides a SQL-like query interface on top of IndexedDB,
 * making it easier to work with structured data offline.
 */

import lf from 'lovefield';

// Database instance (singleton)
let db: lf.Database | null = null;
let budgetTable: lf.schema.Table | null = null;

// Budget item interface
export interface BudgetItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: Date;
  // Flag to track sync status - items with synced=false need to be sent to server
  synced: boolean;
  // Timestamp for conflict resolution
  updatedAt: Date;
  createdAt: Date;
  // Track if item was deleted locally (soft delete for sync)
  deleted: boolean;
}

/**
 * Initialize the Lovefield database schema
 * This creates the IndexedDB structure for storing budget items offline
 */
export async function initBudgetDatabase(): Promise<lf.Database> {
  if (db) return db;

  // Create schema builder with database name and version
  const schemaBuilder = lf.schema.create('BudgetTrackerDB', 1);

  // Define the budget items table schema
  schemaBuilder.createTable('BudgetItems')
    .addColumn('id', lf.Type.STRING)
    .addColumn('category', lf.Type.STRING)
    .addColumn('description', lf.Type.STRING)
    .addColumn('amount', lf.Type.NUMBER)
    .addColumn('type', lf.Type.STRING)
    .addColumn('date', lf.Type.DATE_TIME)
    .addColumn('synced', lf.Type.BOOLEAN)
    .addColumn('updatedAt', lf.Type.DATE_TIME)
    .addColumn('createdAt', lf.Type.DATE_TIME)
    .addColumn('deleted', lf.Type.BOOLEAN)
    .addPrimaryKey(['id'])
    // Index for quick lookup of unsynced items
    .addIndex('idx_synced', ['synced'])
    // Index for filtering by type
    .addIndex('idx_type', ['type'])
    // Index for date-based queries
    .addIndex('idx_date', ['date']);

  // Connect to the database (creates IndexedDB if not exists)
  db = await schemaBuilder.connect();
  budgetTable = db.getSchema().table('BudgetItems');
  
  console.log('[BudgetDB] Database initialized successfully');
  return db;
}

/**
 * Get the database instance (initializes if needed)
 */
export async function getDatabase(): Promise<lf.Database> {
  if (!db) {
    return initBudgetDatabase();
  }
  return db;
}

/**
 * Get the budget items table reference
 */
export async function getBudgetTable(): Promise<lf.schema.Table> {
  await getDatabase();
  if (!budgetTable) {
    throw new Error('Budget table not initialized');
  }
  return budgetTable;
}

/**
 * Generate a unique ID for new budget items
 */
export function generateId(): string {
  return `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add a new budget item to IndexedDB
 * New items are marked as unsynced (synced: false)
 */
export async function addBudgetItem(item: Omit<BudgetItem, 'id' | 'synced' | 'updatedAt' | 'createdAt' | 'deleted'>): Promise<BudgetItem> {
  const database = await getDatabase();
  const table = await getBudgetTable();

  const newItem: BudgetItem = {
    ...item,
    id: generateId(),
    synced: false, // Mark as unsynced - needs to be sent to server
    updatedAt: new Date(),
    createdAt: new Date(),
    deleted: false,
  };

  // Insert the new item into IndexedDB
  await database.insertOrReplace().into(table).values([table.createRow(newItem)]).exec();
  
  console.log('[BudgetDB] Added new item:', newItem.id);
  return newItem;
}

/**
 * Update an existing budget item
 * Marks the item as unsynced after modification
 */
export async function updateBudgetItem(id: string, updates: Partial<BudgetItem>): Promise<BudgetItem | null> {
  const database = await getDatabase();
  const table = await getBudgetTable();

  // First, get the existing item
  const existingItems = await database
    .select()
    .from(table)
    .where(table['id'].eq(id))
    .exec();

  if (existingItems.length === 0) {
    console.warn('[BudgetDB] Item not found for update:', id);
    return null;
  }

  const existingItem = existingItems[0] as BudgetItem;
  const updatedItem: BudgetItem = {
    ...existingItem,
    ...updates,
    id, // Ensure ID doesn't change
    synced: false, // Mark as unsynced after edit
    updatedAt: new Date(),
  };

  // Update the item in IndexedDB
  await database.insertOrReplace().into(table).values([table.createRow(updatedItem)]).exec();
  
  console.log('[BudgetDB] Updated item:', id);
  return updatedItem;
}

/**
 * Soft delete a budget item
 * Instead of removing, we mark as deleted and unsynced
 * This allows syncing the deletion to the server
 */
export async function deleteBudgetItem(id: string): Promise<boolean> {
  const database = await getDatabase();
  const table = await getBudgetTable();

  // Soft delete - mark as deleted and unsynced
  const result = await updateBudgetItem(id, {
    deleted: true,
    synced: false,
  });

  if (result) {
    console.log('[BudgetDB] Soft deleted item:', id);
    return true;
  }
  return false;
}

/**
 * Hard delete a budget item (permanently remove from IndexedDB)
 * Used after successful sync of deleted items
 */
export async function hardDeleteBudgetItem(id: string): Promise<void> {
  const database = await getDatabase();
  const table = await getBudgetTable();

  await database.delete().from(table).where(table['id'].eq(id)).exec();
  console.log('[BudgetDB] Hard deleted item:', id);
}

/**
 * Get all budget items (excluding soft-deleted ones)
 */
export async function getAllBudgetItems(): Promise<BudgetItem[]> {
  const database = await getDatabase();
  const table = await getBudgetTable();

  const items = await database
    .select()
    .from(table)
    .where(table['deleted'].eq(false))
    .orderBy(table['date'], lf.Order.DESC)
    .exec();

  return items as BudgetItem[];
}

/**
 * Get all unsynced items (need to be sent to server)
 * Includes both active and deleted items
 */
export async function getUnsyncedItems(): Promise<BudgetItem[]> {
  const database = await getDatabase();
  const table = await getBudgetTable();

  const items = await database
    .select()
    .from(table)
    .where(table['synced'].eq(false))
    .exec();

  console.log('[BudgetDB] Found', items.length, 'unsynced items');
  return items as BudgetItem[];
}

/**
 * Mark items as synced after successful server sync
 */
export async function markItemsAsSynced(ids: string[]): Promise<void> {
  const database = await getDatabase();
  const table = await getBudgetTable();

  for (const id of ids) {
    // For deleted items, hard delete after sync
    const items = await database
      .select()
      .from(table)
      .where(table['id'].eq(id))
      .exec();

    if (items.length > 0) {
      const item = items[0] as BudgetItem;
      if (item.deleted) {
        // Hard delete synced deleted items
        await hardDeleteBudgetItem(id);
      } else {
        // Mark as synced for active items
        await database.insertOrReplace().into(table).values([
          table.createRow({ ...item, synced: true })
        ]).exec();
      }
    }
  }

  console.log('[BudgetDB] Marked', ids.length, 'items as synced');
}

/**
 * Get budget summary (totals by type)
 */
export async function getBudgetSummary(): Promise<{ totalIncome: number; totalExpense: number; balance: number }> {
  const items = await getAllBudgetItems();
  
  const totalIncome = items
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);
  
  const totalExpense = items
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}
