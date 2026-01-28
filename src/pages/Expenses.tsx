import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { PageTransition } from '@/components/PageTransition';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useExpenses, 
  useExpenseCategories, 
  useBankAccounts,
  useCreateExpense,
  useCreateExpenseCategory,
  useDeleteExpense 
} from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { TrendingDown, Plus, Calendar, Receipt, Tag, Trash2, Utensils, Car, ShoppingBag, Film, Zap, MoreHorizontal, Sparkles, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const categoryIcons: Record<string, React.ElementType> = {
  'Food & Dining': Utensils,
  'Transportation': Car,
  'Shopping': ShoppingBag,
  'Entertainment': Film,
  'Bills & Utilities': Zap,
  'Other': MoreHorizontal,
};

const categoryColors: Record<string, string> = {
  'Food & Dining': 'bg-purple-500/10 text-purple-500',
  'Transportation': 'bg-blue-500/10 text-blue-500',
  'Shopping': 'bg-pink-500/10 text-pink-500',
  'Entertainment': 'bg-amber-500/10 text-amber-500',
  'Bills & Utilities': 'bg-emerald-500/10 text-emerald-500',
  'Other': 'bg-gray-500/10 text-gray-500',
};

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

export default function Expenses() {
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: categories = [], isLoading: categoriesLoading } = useExpenseCategories();
  const { data: banks = [] } = useBankAccounts();
  const createExpenseMutation = useCreateExpense();
  const createCategoryMutation = useCreateExpenseCategory();
  const deleteExpenseMutation = useDeleteExpense();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category_id: '',
    payment_source: 'Cash' as string,
    bank_id: '',
    note: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });
  const { toast } = useToast();

  const isLoading = expensesLoading || categoriesLoading;

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await createCategoryMutation.mutateAsync(newCategoryName);
      toast({ title: 'Success', description: 'Category added' });
      setNewCategoryName('');
      setIsCategoryOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to add category', variant: 'destructive' });
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.category_id) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    try {
      await createExpenseMutation.mutateAsync({
        amount: parseFloat(newExpense.amount),
        category_id: parseInt(newExpense.category_id),
        payment_source: newExpense.payment_source,
        bank_id: newExpense.bank_id ? parseInt(newExpense.bank_id) : undefined,
        note: newExpense.note || undefined,
        date: newExpense.date,
      });
      toast({ title: 'Success', description: 'Expense recorded' });
      setNewExpense({
        amount: '',
        category_id: '',
        payment_source: 'Cash',
        bank_id: '',
        note: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
      setIsAddOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to record expense', variant: 'destructive' });
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await deleteExpenseMutation.mutateAsync(id);
      toast({ title: 'Success', description: 'Expense deleted' });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete expense', variant: 'destructive' });
    }
  };

  const getCategoryName = (categoryId: number) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Unknown';
  };

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const todayExpenses = expenses.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).reduce((acc, exp) => acc + exp.amount, 0);

  // Group by category for summary
  const expensesByCategory = categories.map(category => ({
    ...category,
    total: expenses.filter(e => e.category_id === category.id).reduce((acc, e) => acc + e.amount, 0),
    count: expenses.filter(e => e.category_id === category.id).length,
  })).filter(c => c.total > 0);

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
          {/* Header */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-expense flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-expense-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold">Expenses</h1>
                <p className="text-muted-foreground">Track your spending by category</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Tag className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Expense Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Category Name</Label>
                      <Input
                        placeholder="e.g., Food & Dining, Transport, Entertainment"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddCategory} className="w-full" disabled={createCategoryMutation.isPending}>
                      {createCategoryMutation.isPending ? 'Adding...' : 'Add Category'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-expense text-expense-foreground hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Expense</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense((prev) => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={newExpense.category_id}
                        onValueChange={(value) => setNewExpense((prev) => ({ ...prev, category_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Pay From</Label>
                      <Select
                        value={newExpense.payment_source}
                        onValueChange={(value) =>
                          setNewExpense((prev) => ({ ...prev, payment_source: value, bank_id: '' }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash Wallet</SelectItem>
                          <SelectItem value="Bank">Bank Account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newExpense.payment_source === 'Bank' && (
                      <div className="space-y-2">
                        <Label>Bank Account</Label>
                        <Select
                          value={newExpense.bank_id}
                          onValueChange={(value) => setNewExpense((prev) => ({ ...prev, bank_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {banks.map((bank) => (
                              <SelectItem key={bank.id} value={bank.id.toString()}>
                                {bank.bank_name} - {bank.account_type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense((prev) => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Note (Optional)</Label>
                      <Textarea
                        placeholder="Add a note..."
                        value={newExpense.note}
                        onChange={(e) => setNewExpense((prev) => ({ ...prev, note: e.target.value }))}
                      />
                    </div>
                    <Button onClick={handleAddExpense} className="w-full gradient-expense" disabled={createExpenseMutation.isPending}>
                      {createExpenseMutation.isPending ? 'Recording...' : 'Record Expense'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Total Card */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="relative overflow-hidden rounded-2xl gradient-expense p-8 text-expense-foreground"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-expense-foreground/70" />
                <p className="text-expense-foreground/70 text-sm font-medium">Total Expenses</p>
              </div>
              <p className="text-4xl font-display font-bold">${totalExpenses.toLocaleString()}</p>
              <div className="flex gap-6 mt-4">
                <div>
                  <p className="text-expense-foreground/60 text-xs">Today</p>
                  <p className="text-lg font-semibold">${todayExpenses.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-expense-foreground/60 text-xs">Transactions</p>
                  <p className="text-lg font-semibold">{expenses.length}</p>
                </div>
                <div>
                  <p className="text-expense-foreground/60 text-xs">Categories</p>
                  <p className="text-lg font-semibold">{expensesByCategory.length}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Expenses by Category */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {expensesByCategory.map((category) => {
              const IconComponent = categoryIcons[category.name] || Receipt;
              const colorClass = categoryColors[category.name] || 'bg-gray-500/10 text-gray-500';
              
              return (
                <motion.div
                  key={category.id}
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-card rounded-2xl border border-border p-5 hover:shadow-card-hover transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", colorClass)}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{category.name}</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-expense">${category.total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{category.count} transaction{category.count !== 1 ? 's' : ''}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Expenses List */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="bg-card rounded-2xl shadow-card overflow-hidden border border-border"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-bold text-lg">Recent Expenses</h2>
              <span className="text-sm text-muted-foreground">{expenses.length} entries</span>
            </div>
            <div className="divide-y divide-border">
              {expenses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No expenses recorded yet</p>
              ) : (
                expenses.map((expense, index) => {
                  const categoryName = getCategoryName(expense.category_id);
                  const IconComponent = categoryIcons[categoryName] || Receipt;
                  const colorClass = categoryColors[categoryName] || 'bg-gray-500/10 text-gray-500';
                  
                  return (
                    <motion.div 
                      key={expense.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-5 flex items-center justify-between hover:bg-secondary/30 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-colors", colorClass)}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-semibold">{categoryName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(expense.date), 'MMM d, yyyy')}
                            {expense.note && <span className="truncate max-w-[200px]">• {expense.note}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <ArrowDownRight className="h-4 w-4 text-expense" />
                          <p className="font-display font-bold text-lg text-expense">-${expense.amount.toLocaleString()}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-expense"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </PageTransition>
    </Layout>
  );
}
