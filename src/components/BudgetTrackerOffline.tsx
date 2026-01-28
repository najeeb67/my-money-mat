/**
 * Offline-First Budget Tracker Component
 * 
 * This component demonstrates a complete offline-capable budget tracker:
 * - All data is stored in IndexedDB via Lovefield
 * - Changes are queued for sync when offline
 * - Automatic sync when connection is restored
 * - Visual indicators for sync status
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBudgetOffline } from '@/hooks/useBudgetOffline';
import { useOnlineSync } from '@/hooks/useOnlineSync';
import { BudgetItem } from '@/lib/budgetDb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SoundButton } from '@/components/SoundButton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ConflictResolutionDialog } from '@/components/ConflictResolutionDialog';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Budget categories
const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Salary',
  'Freelance',
  'Investment',
  'Other',
];

// Animation variants
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -100 },
};

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export function BudgetTrackerOffline() {
  // Use the offline budget management hook
  const {
    items,
    isLoading,
    error,
    unsyncedCount,
    summary,
    addItem,
    editItem,
    removeItem,
    refreshItems,
  } = useBudgetOffline();

  // Use the online sync hook with refresh callback
  const {
    isOnline,
    isSyncing,
    lastSyncTime,
    syncError,
    unsyncedCount: syncUnsyncedCount,
    conflicts,
    hasConflicts,
    triggerSync,
    resolveConflicts,
    autoResolveAllConflicts,
  } = useOnlineSync(refreshItems);

  // State for conflict resolution dialog
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  // Form state for adding new items
  const [newItem, setNewItem] = useState({
    category: '',
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
  });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BudgetItem>>({});

  /**
   * Handle adding a new budget item
   */
  const handleAddItem = async () => {
    if (!newItem.category || !newItem.description || !newItem.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount = parseFloat(newItem.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const result = await addItem({
      category: newItem.category,
      description: newItem.description,
      amount,
      type: newItem.type,
      date: new Date(newItem.date),
    });

    if (result) {
      toast.success('Item added!', {
        description: isOnline ? 'Will sync shortly' : 'Saved offline',
      });
      // Reset form
      setNewItem({
        category: '',
        description: '',
        amount: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
      });
    }
  };

  /**
   * Start editing an item
   */
  const startEditing = (item: BudgetItem) => {
    setEditingId(item.id);
    setEditForm({
      category: item.category,
      description: item.description,
      amount: item.amount,
      type: item.type,
    });
  };

  /**
   * Save edited item
   */
  const handleSaveEdit = async () => {
    if (!editingId || !editForm.category || !editForm.description || !editForm.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    const result = await editItem(editingId, editForm);
    if (result) {
      toast.success('Item updated!');
      setEditingId(null);
      setEditForm({});
    }
  };

  /**
   * Cancel editing
   */
  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  /**
   * Handle deleting an item
   */
  const handleDeleteItem = async (id: string) => {
    const success = await removeItem(id);
    if (success) {
      toast.success('Item deleted!', {
        description: isOnline ? 'Will sync shortly' : 'Saved offline',
      });
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border"
      >
        {/* Online/Offline Status */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
            isOnline 
              ? "bg-income/10 text-income" 
              : "bg-expense/10 text-expense"
          )}>
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                Offline
              </>
            )}
          </div>

          {/* Sync Status */}
          {unsyncedCount > 0 && (
            <Badge variant="outline" className="gap-1.5">
              <CloudOff className="h-3 w-3" />
              {unsyncedCount} unsynced
            </Badge>
          )}

          {syncError && (
            <Badge variant="destructive" className="gap-1.5">
              <AlertCircle className="h-3 w-3" />
              Sync error
            </Badge>
          )}

          {/* Conflict Indicator */}
          {hasConflicts && (
            <Badge 
              variant="destructive" 
              className="gap-1.5 cursor-pointer animate-pulse"
              onClick={() => setShowConflictDialog(true)}
            >
              <AlertTriangle className="h-3 w-3" />
              {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-3">
          {lastSyncTime && (
            <span className="text-xs text-muted-foreground">
              Last sync: {format(lastSyncTime, 'HH:mm')}
            </span>
          )}
          <SoundButton
            variant="outline"
            size="sm"
            onClick={triggerSync}
            disabled={!isOnline || isSyncing || unsyncedCount === 0}
            className="gap-2"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Cloud className="h-4 w-4" />
                Sync Now
              </>
            )}
          </SoundButton>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 sm:grid-cols-3"
      >
        <Card className="bg-income/5 border-income/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-income/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-income" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-xl font-bold text-income">
                  {formatCurrency(summary.totalIncome)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-expense/5 border-expense/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-expense/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-expense" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-xl font-bold text-expense">
                  {formatCurrency(summary.totalExpense)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-primary/20",
          summary.balance >= 0 ? "bg-income/5" : "bg-expense/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className={cn(
                  "text-xl font-bold",
                  summary.balance >= 0 ? "text-income" : "text-expense"
                )}>
                  {formatCurrency(summary.balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add New Item Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Budget Item
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newItem.type}
                onValueChange={(value: 'income' | 'expense') => 
                  setNewItem(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-income" />
                      Income
                    </span>
                  </SelectItem>
                  <SelectItem value="expense">
                    <span className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-expense" />
                      Expense
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newItem.category}
                onValueChange={(value) => 
                  setNewItem(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newItem.description}
                onChange={(e) => 
                  setNewItem(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder="Enter description"
              />
            </div>

            <div className="space-y-2">
              <Label>Amount (PKR)</Label>
              <Input
                type="number"
                value={newItem.amount}
                onChange={(e) => 
                  setNewItem(prev => ({ ...prev, amount: e.target.value }))
                }
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={newItem.date}
                onChange={(e) => 
                  setNewItem(prev => ({ ...prev, date: e.target.value }))
                }
              />
            </div>
          </div>

          <SoundButton onClick={handleAddItem} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add Item {!isOnline && '(Offline)'}
          </SoundButton>
        </CardContent>
      </Card>

      {/* Budget Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Budget Items</span>
            <Badge variant="secondary">{items.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-expense">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No budget items yet</p>
              <p className="text-sm">Add your first item above</p>
            </div>
          ) : (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    layout
                    exit="exit"
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border",
                      "bg-secondary/30 hover:bg-secondary/50 transition-colors",
                      !item.synced && "border-l-4 border-l-warning"
                    )}
                  >
                    {editingId === item.id ? (
                      // Edit Mode
                      <div className="flex-1 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Select
                            value={editForm.category}
                            onValueChange={(value) => 
                              setEditForm(prev => ({ ...prev, category: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={editForm.description}
                            onChange={(e) => 
                              setEditForm(prev => ({ ...prev, description: e.target.value }))
                            }
                            placeholder="Description"
                          />
                          <Input
                            type="number"
                            value={editForm.amount}
                            onChange={(e) => 
                              setEditForm(prev => ({ ...prev, amount: parseFloat(e.target.value) }))
                            }
                            placeholder="Amount"
                          />
                        </div>
                        <div className="flex gap-2">
                          <SoundButton size="sm" onClick={handleSaveEdit} className="gap-1">
                            <Check className="h-4 w-4" />
                            Save
                          </SoundButton>
                          <SoundButton size="sm" variant="ghost" onClick={cancelEditing} className="gap-1">
                            <X className="h-4 w-4" />
                            Cancel
                          </SoundButton>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <>
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                          item.type === 'income' ? "bg-income/10" : "bg-expense/10"
                        )}>
                          {item.type === 'income' ? (
                            <TrendingUp className="h-5 w-5 text-income" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-expense" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{item.description}</p>
                            {!item.synced && (
                              <CloudOff className="h-3 w-3 text-warning shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{item.category}</span>
                            <span>•</span>
                            <span>{format(new Date(item.date), 'MMM d, yyyy')}</span>
                          </div>
                        </div>

                        <p className={cn(
                          "text-lg font-bold shrink-0",
                          item.type === 'income' ? "text-income" : "text-expense"
                        )}>
                          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                        </p>

                        <div className="flex gap-1 shrink-0">
                          <SoundButton
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditing(item)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </SoundButton>
                          <SoundButton
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem(item.id)}
                            className="h-8 w-8 text-expense hover:text-expense"
                          >
                            <Trash2 className="h-4 w-4" />
                          </SoundButton>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Offline Notice */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning-foreground shadow-lg"
          >
            <div className="flex items-start gap-3">
              <WifiOff className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">You're offline</p>
                <p className="text-sm opacity-80">
                  Your changes are saved locally and will sync when you're back online.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        open={showConflictDialog || hasConflicts}
        onOpenChange={setShowConflictDialog}
        conflicts={conflicts}
        onResolve={resolveConflicts}
      />
    </div>
  );
}
