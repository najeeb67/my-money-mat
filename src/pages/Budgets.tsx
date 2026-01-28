import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { PageTransition } from '@/components/PageTransition';
import { PullToRefresh } from '@/components/PullToRefresh';
import { Progress } from '@/components/ui/progress';
import { useBudgetStatus, useCreateBudget, useExpenseCategories } from '@/hooks/useApi';
import { PiggyBank, AlertTriangle, Plus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SoundButton } from '@/components/SoundButton';
import { useConfetti, SuccessCheckmark } from '@/components/Confetti';
import { BudgetCardSkeleton } from '@/components/LoadingSkeletons';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';

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

export default function Budgets() {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const { data: rawBudgetStatus, isLoading, refetch } = useBudgetStatus(currentMonth);
  const budgetStatus = Array.isArray(rawBudgetStatus) ? rawBudgetStatus : [];
  const { data: categories = [] } = useExpenseCategories();
  const createBudgetMutation = useCreateBudget();

  const [showSuccess, setShowSuccess] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({ category_id: '', amount: '' });

  const { triggerCelebration } = useConfetti();

  // Calculate totals
  const totalBudget = budgetStatus.reduce((acc, b) => acc + b.budget_amount, 0);
  const totalSpent = budgetStatus.reduce((acc, s) => acc + s.spent, 0);
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const handleRefresh = async () => {
    await refetch();
  };

  const handleCreateBudget = async () => {
    if (!newBudget.category_id || !newBudget.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await createBudgetMutation.mutateAsync({
        category_id: parseInt(newBudget.category_id),
        amount: parseFloat(newBudget.amount),
        month: currentMonth,
        alert_threshold: 80, // Default 80% threshold
      });
      setIsCreateOpen(false);
      setNewBudget({ category_id: '', amount: '' });
      toast.success('Budget created successfully');
      setShowSuccess(true);
    } catch (error) {
      toast.error('Failed to create budget');
    }
  };

  const handleGoalReached = () => {
    triggerCelebration();
    toast.success('🎉 Congratulations!', {
      description: 'You stayed within your budget this month!',
    });
  };

  return (
    <Layout>
      <PullToRefresh onRefresh={handleRefresh}>
        <PageTransition>
          <div className="space-y-8">
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              className="flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <PiggyBank className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold">Budgets</h1>
                <p className="text-muted-foreground">{format(new Date(), 'MMMM yyyy')} spending limits</p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              className="bg-card rounded-2xl border border-border p-8"
            >
              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <AnimatedCounter value={totalBudget} prefix="$" decimals={0} className="text-3xl font-display font-bold mt-1" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <AnimatedCounter value={totalSpent} prefix="$" decimals={0} className="text-3xl font-display font-bold mt-1 text-expense" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <AnimatedCounter value={Math.abs(totalBudget - totalSpent)} prefix={totalBudget - totalSpent >= 0 ? "$" : "-$"} decimals={0} className={cn("text-3xl font-display font-bold mt-1", totalBudget - totalSpent >= 0 ? "text-income" : "text-expense")} />
                </div>
              </div>
              <div className="mt-6">
                <Progress value={totalPercentage} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">{totalPercentage.toFixed(1)}% of total budget used</p>
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              className="flex gap-3"
            >
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <SoundButton soundType="click" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Set Budget
                  </SoundButton>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set Monthly Budget</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={newBudget.category_id}
                        onValueChange={(val) => setNewBudget(prev => ({ ...prev, category_id: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newBudget.amount}
                        onChange={(e) => setNewBudget(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleCreateBudget} disabled={createBudgetMutation.isPending}>
                      {createBudgetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Budget
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <SoundButton variant="outline" soundType="pop" onClick={handleGoalReached} className="gap-2">
                <Check className="h-4 w-4" />
                Complete Month
              </SoundButton>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <BudgetCardSkeleton key={i} />
                    ))}
                  </>
                ) : (
                  budgetStatus.map((status) => (
                    <motion.div
                      key={status.budget_id}
                      variants={itemVariants}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      className="bg-card rounded-2xl border border-border p-6 group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold group-hover:text-primary transition-colors">
                            {categories.find(c => c.id === status.category_id)?.name || 'Unknown Category'}
                          </p>
                          <p className="text-2xl font-display font-bold mt-2">
                            ${status.spent.toLocaleString()}
                            <span className="text-sm font-normal text-muted-foreground"> / ${status.budget_amount.toLocaleString()}</span>
                          </p>
                        </div>
                        {status.alert && (
                          <motion.div
                            className={cn("rounded-full p-2", status.percentage >= 100 ? "bg-expense/10" : "bg-warning/10")}
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <AlertTriangle className={cn("h-4 w-4", status.percentage >= 100 ? "text-expense" : "text-warning")} />
                          </motion.div>
                        )}
                      </div>
                      <div className="mt-4">
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            className={cn("h-full rounded-full", status.percentage >= 100 ? "bg-expense" : status.percentage >= 80 ? "bg-warning" : "bg-income")}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(status.percentage, 100)}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                          <span className={cn("font-medium", status.percentage >= 100 ? "text-expense" : status.percentage >= 80 ? "text-warning" : "text-income")}>
                            {status.percentage.toFixed(0)}% used
                          </span>
                          <span className="text-muted-foreground">
                            ${Math.abs(status.remaining).toLocaleString()} {status.remaining >= 0 ? 'left' : 'over'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>

              {!isLoading && budgetStatus.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  No budgets set for this month. Click "Set Budget" to get started!
                </div>
              )}
            </motion.div>

            {/* Success animation overlay */}
            <SuccessCheckmark show={showSuccess} onComplete={() => setShowSuccess(false)} />
          </div>
        </PageTransition>
      </PullToRefresh>
    </Layout>
  );
}