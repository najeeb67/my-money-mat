import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { queueMutation } from '@/lib/offlineDb';
import { toast } from 'sonner';

interface UseOfflineMutationOptions<TData, TError, TVariables>
    extends UseMutationOptions<TData, TError, TVariables> {
    mutationKey: string; // Required for identifying the offline action
}

export function useOfflineMutation<TData = unknown, TError = unknown, TVariables = unknown>(
    options: UseOfflineMutationOptions<TData, TError, TVariables>
) {
    const queryClient = useQueryClient();
    const { mutationFn, mutationKey, onSuccess, ...rest } = options;

    return useMutation({
        ...rest,
        mutationFn: async (variables: TVariables) => {
            // Check online status
            if (!navigator.onLine) {
                // Offline: Queue it
                console.log('[OfflineMutation] Offline, queuing:', mutationKey, variables);
                await queueMutation(mutationKey, variables);

                // Throw a special error or return a mock success? 
                // Returning mock success is better for the UI flow usually,
                // but we need to distinquish real data from fake.
                // For now, let's treat it as "success" so the UI updates.
                return { offline: true } as any;
            }

            // Online: Execute normally
            if (!mutationFn) throw new Error('mutationFn is required');
            return mutationFn(variables);
        },
        onSuccess: (data, variables, context) => {
            if ((data as any)?.offline) {
                toast.info('Saved (Offline). Will sync when online.');
            }

            if (onSuccess) {
                onSuccess(data, variables, context);
            }
        },
        onError: async (error, variables, context) => {
            // If it failed but it was network related (and we thought we were online),
            // we could fallback to queueing here too.
            if (!navigator.onLine || (error as any)?.message?.includes('Network Error')) {
                console.log('[OfflineMutation] Network error fallback, queuing:', mutationKey);
                await queueMutation(mutationKey, variables);
                toast.info('Saved (Offline). Will sync when online.');
                // We might want to call onSuccess here to fake it for the UI
                if (onSuccess) {
                    onSuccess({ offline: true } as any, variables, context);
                }
                return;
            }

            if (options.onError) {
                options.onError(error, variables, context);
            }
        }
    });
}
