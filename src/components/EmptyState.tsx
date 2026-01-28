import { motion } from 'framer-motion';
import { LucideIcon, Inbox, FileQuestion, Wallet, PiggyBank, Receipt, Bell, Banknote, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'muted' | 'accent';
  className?: string;
}

export function EmptyState({ 
  icon: Icon = Inbox, 
  title, 
  description, 
  action,
  variant = 'default',
  className 
}: EmptyStateProps) {
  const variants = {
    default: {
      container: 'bg-card border-border',
      icon: 'bg-muted text-muted-foreground',
    },
    muted: {
      container: 'bg-secondary/50 border-transparent',
      icon: 'bg-muted text-muted-foreground',
    },
    accent: {
      container: 'bg-primary/5 border-primary/20',
      icon: 'gradient-primary text-primary-foreground',
    },
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-2xl border",
        variants[variant].container,
        className
      )}
    >
      <motion.div 
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className={cn(
          "h-16 w-16 rounded-2xl flex items-center justify-center mb-4",
          variants[variant].icon
        )}
      >
        <Icon className="h-8 w-8" />
      </motion.div>
      <h3 className="text-lg font-display font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>
      {action && (
        <Button 
          onClick={action.onClick}
          className="gradient-primary text-primary-foreground"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

// Preset empty states for common pages
export function EmptyAccounts({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Wallet}
      title="No accounts yet"
      description="Add your first bank account to start tracking your finances across all your accounts."
      action={onAdd ? { label: "Add Account", onClick: onAdd } : undefined}
      variant="accent"
    />
  );
}

export function EmptyTransactions({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Receipt}
      title="No transactions yet"
      description="Start recording your income and expenses to see them appear here."
      action={onAdd ? { label: "Add Transaction", onClick: onAdd } : undefined}
    />
  );
}

export function EmptyLoans({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Banknote}
      title="No loans recorded"
      description="Track money you've lent or borrowed to stay on top of your lending activities."
      action={onAdd ? { label: "Add Loan", onClick: onAdd } : undefined}
    />
  );
}

export function EmptySavings({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Target}
      title="No savings goals"
      description="Set up savings goals to track your progress toward financial milestones."
      action={onAdd ? { label: "Create Goal", onClick: onAdd } : undefined}
      variant="accent"
    />
  );
}

export function EmptyBudgets({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={PiggyBank}
      title="No budgets set"
      description="Create budgets for different categories to manage your spending effectively."
      action={onAdd ? { label: "Create Budget", onClick: onAdd } : undefined}
    />
  );
}

export function EmptyAlerts() {
  return (
    <EmptyState
      icon={Bell}
      title="No alerts"
      description="You're all caught up! New alerts about your finances will appear here."
      variant="muted"
    />
  );
}

export function NoResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={FileQuestion}
      title="No results found"
      description={query ? `No results match "${query}". Try adjusting your search or filters.` : "No results match your current filters. Try adjusting them."}
      variant="muted"
    />
  );
}
