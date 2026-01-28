import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { PageTransition } from '@/components/PageTransition';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSavingsTargets, useCreateSavingsTarget, useContributeToSavings, useDeleteSavingsTarget } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { useConfetti } from '@/components/Confetti';
import { Target, Calendar, CheckCircle2, Sparkles, Plus, Trash2, DollarSign } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { cn } from '@/lib/utils';

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

export default function Savings() {
  const { data: targets = [], isLoading } = useSavingsTargets();
  const createTargetMutation = useCreateSavingsTarget();
  const contributeMutation = useContributeToSavings();
  const deleteTargetMutation = useDeleteSavingsTarget();
  const { toast } = useToast();
  const { triggerCelebration } = useConfetti();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [contributeTarget, setContributeTarget] = useState<number | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [newTarget, setNewTarget] = useState({
    name: '',
    target_amount: '',
    deadline: '',
    description: '',
  });

  const activeTargets = targets.filter((t) => !t.is_completed);
  const completedTargets = targets.filter((t) => t.is_completed);
  const totalSaved = targets.reduce((acc, t) => acc + t.current_amount, 0);
  const totalTarget = targets.reduce((acc, t) => acc + t.target_amount, 0);

  const handleCreateTarget = async () => {
    if (!newTarget.name || !newTarget.target_amount) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    try {
      await createTargetMutation.mutateAsync({
        name: newTarget.name,
        target_amount: parseFloat(newTarget.target_amount),
        deadline: newTarget.deadline || undefined,
        description: newTarget.description || undefined,
      });
      toast({ title: 'Success', description: 'Savings goal created' });
      setNewTarget({ name: '', target_amount: '', deadline: '', description: '' });
      setIsAddOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to create goal', variant: 'destructive' });
    }
  };

  const handleContribute = async () => {
    if (!contributeTarget || !contributeAmount) return;
    try {
      const target = targets.find(t => t.id === contributeTarget);
      await contributeMutation.mutateAsync({ targetId: contributeTarget, amount: parseFloat(contributeAmount) });
      
      // Check if goal is now complete
      if (target && target.current_amount + parseFloat(contributeAmount) >= target.target_amount) {
        triggerCelebration();
        toast({ title: '🎉 Goal Achieved!', description: `Congratulations! You've reached your ${target.name} goal!` });
      } else {
        toast({ title: 'Success', description: 'Contribution added' });
      }
      
      setContributeAmount('');
      setContributeTarget(null);
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to contribute', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTargetMutation.mutateAsync(id);
      toast({ title: 'Success', description: 'Goal deleted' });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete goal', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <PageTransition>
          <div className="space-y-8">
            <div className="h-10 bg-muted rounded animate-pulse w-48" />
            <div className="h-48 bg-muted rounded-2xl animate-pulse" />
          </div>
        </PageTransition>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageTransition>
        <div className="space-y-8">
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold">Savings Goals</h1>
                <p className="text-muted-foreground">Track progress towards your financial goals</p>
              </div>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  New Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Savings Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Goal Name</Label>
                    <Input
                      placeholder="e.g., New Laptop, Vacation"
                      value={newTarget.name}
                      onChange={(e) => setNewTarget(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Amount</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newTarget.target_amount}
                      onChange={(e) => setNewTarget(prev => ({ ...prev, target_amount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Deadline (Optional)</Label>
                    <Input
                      type="date"
                      value={newTarget.deadline}
                      onChange={(e) => setNewTarget(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      placeholder="What are you saving for?"
                      value={newTarget.description}
                      onChange={(e) => setNewTarget(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleCreateTarget} className="w-full gradient-primary" disabled={createTargetMutation.isPending}>
                    {createTargetMutation.isPending ? 'Creating...' : 'Create Goal'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="bg-gradient-to-r from-primary/10 to-accent/5 rounded-2xl border border-primary/20 p-8"
          >
            <div className="flex items-center gap-2 mb-2"><Sparkles className="h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">Total Progress</p></div>
            <p className="text-4xl font-display font-bold">${totalSaved.toLocaleString()}<span className="text-lg font-normal text-muted-foreground"> / ${totalTarget.toLocaleString()}</span></p>
            <div className="mt-4">
              <Progress value={totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">{activeTargets.length} active, {completedTargets.length} completed</p>
            </div>
          </motion.div>

          {activeTargets.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold">Active Goals</h2>
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {activeTargets.map((target) => {
                  const progress = (target.current_amount / target.target_amount) * 100;
                  const daysLeft = target.deadline ? differenceInDays(new Date(target.deadline), new Date()) : null;
                  return (
                    <motion.div 
                      key={target.id} 
                      variants={itemVariants}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      className="bg-card rounded-2xl border border-border p-6 group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Target className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Dialog open={contributeTarget === target.id} onOpenChange={(open) => !open && setContributeTarget(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setContributeTarget(target.id)}>
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Contribute to {target.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label>Amount</Label>
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={contributeAmount}
                                    onChange={(e) => setContributeAmount(e.target.value)}
                                  />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Remaining: ${(target.target_amount - target.current_amount).toLocaleString()}
                                </p>
                                <Button onClick={handleContribute} className="w-full gradient-primary" disabled={contributeMutation.isPending}>
                                  {contributeMutation.isPending ? 'Contributing...' : 'Add Contribution'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-expense"
                            onClick={() => handleDelete(target.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="font-semibold">{target.name}</p>
                      {target.description && <p className="text-sm text-muted-foreground mt-1">{target.description}</p>}
                      <p className="text-2xl font-display font-bold mt-3">${target.current_amount.toLocaleString()}<span className="text-sm font-normal text-muted-foreground"> / ${target.target_amount.toLocaleString()}</span></p>
                      <div className="mt-3">
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary rounded-full" 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-sm"><span className="text-primary font-medium">{progress.toFixed(0)}%</span><span className="text-muted-foreground">${(target.target_amount - target.current_amount).toLocaleString()} to go</span></div>
                      </div>
                      {daysLeft !== null && <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground"><Calendar className="h-4 w-4" /><span>{daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}</span></div>}
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          )}

          {completedTargets.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold">Completed</h2>
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {completedTargets.map((target) => (
                  <motion.div 
                    key={target.id} 
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    className="bg-card rounded-2xl border-2 border-income/20 p-6"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-income/10 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-income" /></div>
                      <div><p className="font-medium">{target.name}</p><p className="text-sm text-income font-medium">${target.target_amount.toLocaleString()} saved!</p></div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {targets.length === 0 && (
            <div className="text-center py-12">
              <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-bold text-lg">No savings goals yet</h3>
              <p className="text-muted-foreground mt-2">Create your first goal to start tracking your savings</p>
            </div>
          )}
        </div>
      </PageTransition>
    </Layout>
  );
}
