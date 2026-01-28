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
  useIncomes, 
  useIncomeSources, 
  useBankAccounts,
  useCreateIncome,
  useCreateIncomeSource 
} from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Plus, Calendar, DollarSign, Tag, Briefcase, Gift, Sparkles, ArrowUpRight, Coins } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const sourceIcons: Record<string, React.ElementType> = {
  Salary: Briefcase,
  Freelance: DollarSign,
  Investments: TrendingUp,
  Gifts: Gift,
};

const currencies = [
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

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

export default function Income() {
  const { data: incomes = [], isLoading: incomesLoading } = useIncomes();
  const { data: sources = [], isLoading: sourcesLoading } = useIncomeSources();
  const { data: banks = [] } = useBankAccounts();
  const createIncomeMutation = useCreateIncome();
  const createSourceMutation = useCreateIncomeSource();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newIncome, setNewIncome] = useState({
    amount: '',
    currency: 'PKR',
    source_id: '',
    payment_source: 'Cash' as string,
    bank_id: '',
    note: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const getCurrencySymbol = (code: string) => currencies.find(c => c.code === code)?.symbol || '₨';
  const { toast } = useToast();

  const isLoading = incomesLoading || sourcesLoading;

  const handleAddSource = async () => {
    if (!newSourceName.trim()) return;
    try {
      await createSourceMutation.mutateAsync(newSourceName);
      toast({ title: 'Success', description: 'Income source added' });
      setNewSourceName('');
      setIsSourceOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to add source', variant: 'destructive' });
    }
  };

  const handleAddIncome = async () => {
    if (!newIncome.amount || !newIncome.source_id) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    try {
      await createIncomeMutation.mutateAsync({
        amount: parseFloat(newIncome.amount),
        source_id: parseInt(newIncome.source_id),
        payment_source: newIncome.payment_source,
        bank_id: newIncome.bank_id ? parseInt(newIncome.bank_id) : undefined,
        note: newIncome.note || undefined,
        date: newIncome.date,
      });
      toast({ title: 'Success', description: 'Income recorded' });
      setNewIncome({
        amount: '',
        currency: 'PKR',
        source_id: '',
        payment_source: 'Cash',
        bank_id: '',
        note: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
      setIsAddOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to record income', variant: 'destructive' });
    }
  };

  const getSourceName = (sourceId: number) => {
    return sources.find((s) => s.id === sourceId)?.name || 'Unknown';
  };

  const totalIncome = incomes.reduce((acc, inc) => acc + inc.amount, 0);
  const thisMonthIncome = incomes.filter(i => new Date(i.date).getMonth() === new Date().getMonth()).reduce((acc, inc) => acc + inc.amount, 0);

  // Group by source for summary
  const incomeBySource = sources.map(source => ({
    ...source,
    total: incomes.filter(i => i.source_id === source.id).reduce((acc, i) => acc + i.amount, 0),
    count: incomes.filter(i => i.source_id === source.id).length,
  })).filter(s => s.total > 0);

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
              <div className="h-10 w-10 rounded-xl gradient-income flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-income-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold">Income</h1>
                <p className="text-muted-foreground">Track your earnings and income sources</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isSourceOpen} onOpenChange={setIsSourceOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Tag className="h-4 w-4 mr-2" />
                    Add Source
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Income Source</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Source Name</Label>
                      <Input
                        placeholder="e.g., Salary, Freelance, Dividends"
                        value={newSourceName}
                        onChange={(e) => setNewSourceName(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddSource} className="w-full" disabled={createSourceMutation.isPending}>
                      {createSourceMutation.isPending ? 'Adding...' : 'Add Source'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-income text-income-foreground hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Income
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Income</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-10"
                            value={newIncome.amount}
                            onChange={(e) => setNewIncome((prev) => ({ ...prev, amount: e.target.value }))}
                          />
                        </div>
                        <Select
                          value={newIncome.currency}
                          onValueChange={(value) => setNewIncome((prev) => ({ ...prev, currency: value }))}
                        >
                          <SelectTrigger className="w-[110px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            {currencies.map((currency) => (
                              <SelectItem key={currency.code} value={currency.code}>
                                <span className="flex items-center gap-2">
                                  <span className="font-medium">{currency.symbol}</span>
                                  <span>{currency.code}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Source</Label>
                      <Select
                        value={newIncome.source_id}
                        onValueChange={(value) => setNewIncome((prev) => ({ ...prev, source_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {sources.map((source) => (
                            <SelectItem key={source.id} value={source.id.toString()}>
                              {source.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Deposit To</Label>
                      <Select
                        value={newIncome.payment_source}
                        onValueChange={(value) =>
                          setNewIncome((prev) => ({ ...prev, payment_source: value, bank_id: '' }))
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
                    {newIncome.payment_source === 'Bank' && (
                      <div className="space-y-2">
                        <Label>Bank Account</Label>
                        <Select
                          value={newIncome.bank_id}
                          onValueChange={(value) => setNewIncome((prev) => ({ ...prev, bank_id: value }))}
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
                        value={newIncome.date}
                        onChange={(e) => setNewIncome((prev) => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Note (Optional)</Label>
                      <Textarea
                        placeholder="Add a note..."
                        value={newIncome.note}
                        onChange={(e) => setNewIncome((prev) => ({ ...prev, note: e.target.value }))}
                      />
                    </div>
                    <Button onClick={handleAddIncome} className="w-full gradient-income" disabled={createIncomeMutation.isPending}>
                      {createIncomeMutation.isPending ? 'Recording...' : 'Record Income'}
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
            className="relative overflow-hidden rounded-2xl gradient-income p-8 text-income-foreground"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-income-foreground/70" />
                <p className="text-income-foreground/70 text-sm font-medium">Total Income</p>
              </div>
              <p className="text-4xl font-display font-bold">${totalIncome.toLocaleString()}</p>
              <div className="flex gap-6 mt-4">
                <div>
                  <p className="text-income-foreground/60 text-xs">This Month</p>
                  <p className="text-lg font-semibold">${thisMonthIncome.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-income-foreground/60 text-xs">Transactions</p>
                  <p className="text-lg font-semibold">{incomes.length}</p>
                </div>
                <div>
                  <p className="text-income-foreground/60 text-xs">Sources</p>
                  <p className="text-lg font-semibold">{sources.length}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Income by Source */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {incomeBySource.map((source) => {
              const IconComponent = sourceIcons[source.name] || DollarSign;
              return (
                <motion.div
                  key={source.id}
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-card rounded-2xl border border-border p-5 hover:shadow-card-hover transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-income/10 flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-income" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{source.name}</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-income">${source.total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{source.count} transaction{source.count !== 1 ? 's' : ''}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Income List */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="bg-card rounded-2xl shadow-card overflow-hidden border border-border"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-bold text-lg">Recent Income</h2>
              <span className="text-sm text-muted-foreground">{incomes.length} entries</span>
            </div>
            <div className="divide-y divide-border">
              {incomes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No income recorded yet</p>
              ) : (
                incomes.map((income, index) => {
                  const sourceName = getSourceName(income.source_id);
                  const IconComponent = sourceIcons[sourceName] || DollarSign;
                  
                  return (
                    <motion.div 
                      key={income.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-5 flex items-center justify-between hover:bg-secondary/30 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-income/10 flex items-center justify-center group-hover:bg-income/20 transition-colors">
                          <IconComponent className="h-6 w-6 text-income" />
                        </div>
                        <div>
                          <p className="font-semibold">{sourceName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(income.date), 'MMM d, yyyy')}
                            {income.note && <span className="truncate max-w-[200px]">• {income.note}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4 text-income" />
                        <p className="font-display font-bold text-lg text-income">+${income.amount.toLocaleString()}</p>
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
