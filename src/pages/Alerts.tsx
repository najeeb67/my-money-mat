import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { PageTransition } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { SoundButton } from '@/components/SoundButton';
import { useAlerts, useMarkAlertAsRead, useDeleteAlert } from '@/hooks/useApi';
import { Bell, Check, Trash2, AlertTriangle, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useConfetti } from '@/components/Confetti';
import { AlertCardSkeleton } from '@/components/LoadingSkeletons';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function Alerts() {
  const { data: alerts = [], isLoading } = useAlerts();
  const markAsReadMutation = useMarkAlertAsRead();
  const deleteMutation = useDeleteAlert();
  const { triggerConfetti } = useConfetti();

  const unreadAlerts = alerts.filter((a) => !a.is_read);
  const readAlerts = alerts.filter((a) => a.is_read);

  const handleMarkAsRead = (alertId: number) => {
    markAsReadMutation.mutate(alertId, {
      onSuccess: () => {
        toast.success('Alert marked as read');
      },
      onError: () => {
        toast.error('Failed to mark alert as read');
      }
    });
  };

  const handleMarkAllRead = async () => {
    // Optimistically assume success or handle individually
    // Backend doesn't have bulk update, so we loop. 
    // This might be slow if there are many, but for now it's fine.
    try {
      await Promise.all(unreadAlerts.map(a => markAsReadMutation.mutateAsync(a.id)));
      triggerConfetti({ particleCount: 80, spread: 60 });
      toast.success('All alerts cleared!', {
        description: 'You\'re all caught up!',
      });
    } catch (error) {
      toast.error('Failed to mark some alerts as read');
    }
  };

  const handleDelete = (alertId: number) => {
    deleteMutation.mutate(alertId, {
      onSuccess: () => {
        toast.success('Alert deleted');
      },
      onError: () => {
        toast.error('Failed to delete alert');
      }
    });
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertCircle className="h-5 w-5 text-expense" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning" />;
      default: return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getAlertStyles = (level: string) => {
    switch (level) {
      case 'critical': return 'border-expense/30 bg-expense/5';
      case 'warning': return 'border-warning/30 bg-warning/5';
      default: return 'border-primary/30 bg-primary/5';
    }
  };

  return (
    <Layout>
      <PageTransition>
        <div className="space-y-8">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Alerts</h1>
              <p className="text-muted-foreground">Stay on top of your budget and savings</p>
            </div>
          </motion.div>

          {unreadAlerts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 bg-expense rounded-full animate-pulse" />
                  Unread ({unreadAlerts.length})
                </h2>
                <SoundButton variant="outline" size="sm" soundType="success" onClick={handleMarkAllRead} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Mark all read
                </SoundButton>
              </div>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                <AnimatePresence mode="popLayout">
                  {isLoading ? (
                    [1, 2, 3].map((i) => <AlertCardSkeleton key={i} />)
                  ) : (
                    unreadAlerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        variants={itemVariants}
                        layout
                        exit={{ x: 100, opacity: 0, transition: { duration: 0.3 } }}
                        whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                        className={cn("rounded-2xl border p-5", getAlertStyles(alert.level))}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <motion.div
                              className="mt-0.5"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              {getAlertIcon(alert.level)}
                            </motion.div>
                            <div>
                              <p className="font-medium">{alert.message}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(alert.created_at), 'MMM d, yyyy at h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMarkAsRead(alert.id)}
                              className="hover:bg-income/10 hover:text-income"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-expense hover:bg-expense/10"
                              onClick={() => handleDelete(alert.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          {unreadAlerts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl border border-border p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="h-16 w-16 rounded-full bg-income/10 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="h-8 w-8 text-income" />
              </motion.div>
              <h3 className="font-display font-semibold text-lg">All caught up!</h3>
              <p className="text-muted-foreground mt-1">No unread alerts at the moment.</p>
            </motion.div>
          )}

          {readAlerts.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold text-muted-foreground">Previous ({readAlerts.length})</h2>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                <AnimatePresence mode="popLayout">
                  {readAlerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      variants={itemVariants}
                      layout
                      exit={{ x: 100, opacity: 0, transition: { duration: 0.3 } }}
                      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                      className="rounded-2xl border border-border bg-card p-5 opacity-70 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="mt-0.5 opacity-50">{getAlertIcon(alert.level)}</div>
                          <div>
                            <p className="font-medium text-muted-foreground">{alert.message}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(alert.created_at), 'MMM d, yyyy at h:mm a')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-expense hover:bg-expense/10"
                          onClick={() => handleDelete(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </div>
      </PageTransition>
    </Layout>
  );
}