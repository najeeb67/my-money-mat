import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getQueuedMutations, removeMutationFromQueue } from '@/lib/offlineDb';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface OfflineSyncContextType {
    isOnline: boolean;
    isSyncing: boolean;
    syncNow: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType>({
    isOnline: navigator.onLine,
    isSyncing: false,
    syncNow: async () => { },
});

export const useOfflineSync = () => useContext(OfflineSyncContext);

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const queryClient = useQueryClient();

    // Map mutation keys to actual API calls
    // This needs to match the keys passed to useOfflineMutation
    const executeMutationHelper = async (key: string, variables: any) => {
        switch (key) {
            // Budgets
            case 'createBudget': return api.createBudget(variables);
            case 'updateBudget': return api.updateBudget(variables.id, variables.data);
            // Expenses
            case 'createExpense': return api.createExpense(variables);
            case 'deleteExpense': return api.deleteExpense(variables);
            // Income
            case 'createIncome': return api.createIncome(variables);
            // Accounts
            case 'createBankAccount': return api.createBankAccount(variables);
            case 'updateBankAccount': return api.updateBankAccount(variables.id, variables.data);
            case 'deleteBankAccount': return api.deleteBankAccount(variables);
            case 'updateCashWallet': return api.updateCashWallet(variables);
            // Loans
            case 'createLoan': return api.createLoan(variables);
            case 'processLoanPayment': return api.processLoanPayment(variables.loanId, variables.data);
            // Savings
            case 'createSavingsTarget': return api.createSavingsTarget(variables);
            case 'updateSavingsTarget': return api.updateSavingsTarget(variables.id, variables.data);
            case 'deleteSavingsTarget': return api.deleteSavingsTarget(variables);
            case 'contributeToSavings': return api.contributeToSavings(variables.targetId, variables.amount);
            // Alerts
            case 'markAlertAsRead': return api.markAlertAsRead(variables);
            case 'deleteAlert': return api.deleteAlert(variables);

            default:
                console.warn('Unknown mutation key:', key);
                throw new Error(`Unknown mutation key: ${key}`);
        }
    };

    const syncNow = useCallback(async () => {
        if (!navigator.onLine || isSyncing) return;

        try {
            setIsSyncing(true);
            const queue = await getQueuedMutations();

            if (queue.length === 0) {
                setIsSyncing(false);
                return;
            }

            toast.info(`Syncing ${queue.length} offline changes...`);
            console.log('[Sync] Processing queue:', queue);

            let successCount = 0;
            let failCount = 0;

            for (const item of queue) {
                try {
                    await executeMutationHelper(item.mutationKey, item.variables);
                    await removeMutationFromQueue(item.id);
                    successCount++;
                } catch (error) {
                    console.error(`[Sync] Failed to sync item ${item.id}:`, error);
                    failCount++;
                    // Optional: decide if we keep it in queue or discard after N retries
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully synced ${successCount} changes`);
                // Invalidate everything to be safe and refresh UI
                queryClient.invalidateQueries();
            }

            if (failCount > 0) {
                toast.error(`Failed to sync ${failCount} items. Will retry later.`);
            }

        } catch (error) {
            console.error('[Sync] Error:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, queryClient]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success("You're back online!");
            syncNow();
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.warning("You're offline. Changes will save locally.");
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        if (navigator.onLine) {
            syncNow();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [syncNow]);

    return (
        <OfflineSyncContext.Provider value={{ isOnline, isSyncing, syncNow }}>
            {children}
        </OfflineSyncContext.Provider>
    );
}
