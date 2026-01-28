import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { PageTransition } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  useBankAccounts, 
  useCashWallet, 
  useCreateBankAccount, 
  useDeleteBankAccount,
  useUpdateCashWallet 
} from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Banknote, Plus, Trash2, Edit2, Wallet, TrendingUp, Building2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccountCardSkeleton } from '@/components/LoadingSkeletons';

const accountTypeIcons: Record<string, React.ElementType> = {
  Checking: CreditCard,
  Savings: Wallet,
  Investment: TrendingUp,
  Credit: CreditCard,
};

const accountTypeColors: Record<string, string> = {
  Checking: 'from-primary/20 to-primary/5 border-primary/20',
  Savings: 'from-income/20 to-income/5 border-income/20',
  Investment: 'from-warning/20 to-warning/5 border-warning/20',
  Credit: 'from-expense/20 to-expense/5 border-expense/20',
};

const accountIconBg: Record<string, string> = {
  Checking: 'gradient-primary',
  Savings: 'gradient-income',
  Investment: 'bg-warning',
  Credit: 'gradient-expense',
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

export default function Accounts() {
  const { data: banks = [], isLoading: banksLoading } = useBankAccounts();
  const { data: cashWallet, isLoading: cashLoading } = useCashWallet();
  const createBankMutation = useCreateBankAccount();
  const deleteBankMutation = useDeleteBankAccount();
  const updateCashMutation = useUpdateCashWallet();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCashOpen, setIsCashOpen] = useState(false);
  const [newBank, setNewBank] = useState({ bank_name: '', account_type: 'Savings', blance: '' });
  const [cashBalance, setCashBalance] = useState('');
  const { toast } = useToast();

  const isLoading = banksLoading || cashLoading;

  const handleAddBank = async () => {
    if (!newBank.bank_name || !newBank.blance) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    try {
      await createBankMutation.mutateAsync({
        bank_name: newBank.bank_name,
        account_type: newBank.account_type,
        blance: parseFloat(newBank.blance),
      });
      toast({ title: 'Success', description: 'Bank account added' });
      setNewBank({ bank_name: '', account_type: 'Savings', blance: '' });
      setIsAddOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to add account', variant: 'destructive' });
    }
  };

  const handleDeleteBank = async (id: number) => {
    try {
      await deleteBankMutation.mutateAsync(id);
      toast({ title: 'Success', description: 'Account deleted' });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete account', variant: 'destructive' });
    }
  };

  const handleUpdateCash = async () => {
    try {
      await updateCashMutation.mutateAsync(parseFloat(cashBalance));
      toast({ title: 'Success', description: 'Cash wallet updated' });
      setIsCashOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to update wallet', variant: 'destructive' });
    }
  };

  const totalBalance = banks.reduce((acc, bank) => acc + bank.blance, 0) + (cashWallet?.balance || 0);
  const totalAssets = banks.filter(b => b.blance > 0).reduce((acc, bank) => acc + bank.blance, 0) + (cashWallet?.balance || 0);
  const totalLiabilities = Math.abs(banks.filter(b => b.blance < 0).reduce((acc, bank) => acc + bank.blance, 0));

  if (isLoading) {
    return (
      <Layout>
        <PageTransition>
          <div className="space-y-8">
            <div className="h-10 bg-muted rounded animate-pulse w-48" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4].map(i => <AccountCardSkeleton key={i} />)}
            </div>
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
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold">Accounts</h1>
                <p className="text-muted-foreground">Manage your bank accounts and cash</p>
              </div>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Bank Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      placeholder="e.g., Chase Bank"
                      value={newBank.bank_name}
                      onChange={(e) => setNewBank((prev) => ({ ...prev, bank_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <Select
                      value={newBank.account_type}
                      onValueChange={(value) => setNewBank((prev) => ({ ...prev, account_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Savings">Savings</SelectItem>
                        <SelectItem value="Checking">Checking</SelectItem>
                        <SelectItem value="Investment">Investment</SelectItem>
                        <SelectItem value="Credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Current Balance</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newBank.blance}
                      onChange={(e) => setNewBank((prev) => ({ ...prev, blance: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleAddBank} className="w-full gradient-primary" disabled={createBankMutation.isPending}>
                    {createBankMutation.isPending ? 'Adding...' : 'Add Account'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Total Balance Card */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="relative overflow-hidden rounded-2xl gradient-primary p-8 text-primary-foreground glow-primary"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary-foreground/70" />
                <p className="text-primary-foreground/70 text-sm font-medium">Net Worth</p>
              </div>
              <p className="text-4xl font-display font-bold">${totalBalance.toLocaleString()}</p>
              <div className="flex gap-6 mt-4">
                <div>
                  <p className="text-primary-foreground/60 text-xs">Assets</p>
                  <p className="text-lg font-semibold text-income">${totalAssets.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-primary-foreground/60 text-xs">Liabilities</p>
                  <p className="text-lg font-semibold text-expense">${totalLiabilities.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-primary-foreground/60 text-xs">Accounts</p>
                  <p className="text-lg font-semibold">{banks.length + 1}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Accounts Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {/* Cash Wallet */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-card rounded-2xl shadow-card p-6 border border-primary/20 hover:shadow-card-hover transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Banknote className="h-7 w-7 text-primary-foreground" />
                </div>
                <Dialog open={isCashOpen} onOpenChange={setIsCashOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setCashBalance(cashWallet?.balance.toString() || '0')}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Cash Wallet</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Balance</Label>
                        <Input
                          type="number"
                          value={cashBalance}
                          onChange={(e) => setCashBalance(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleUpdateCash} className="w-full gradient-primary" disabled={updateCashMutation.isPending}>
                        {updateCashMutation.isPending ? 'Updating...' : 'Update'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="mt-5">
                <p className="text-sm text-muted-foreground font-medium">Cash Wallet</p>
                <p className="text-3xl font-display font-bold mt-2">
                  ${cashWallet?.balance.toLocaleString() || '0'}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">Physical Cash</span>
                </div>
              </div>
            </motion.div>

            {/* Bank Accounts */}
            {banks.map((bank) => {
              const IconComponent = accountTypeIcons[bank.account_type] || CreditCard;
              const isCredit = bank.blance < 0;
              
              return (
                <motion.div
                  key={bank.id}
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={cn(
                    "bg-card rounded-2xl shadow-card p-6 border hover:shadow-card-hover transition-all group",
                    accountTypeColors[bank.account_type]
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "h-14 w-14 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform",
                      accountIconBg[bank.account_type]
                    )}>
                      <IconComponent className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-expense"
                      onClick={() => typeof bank.id === 'number' && handleDeleteBank(bank.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-5">
                    <p className="text-sm text-muted-foreground font-medium">{bank.bank_name}</p>
                    <p className={cn(
                      "text-3xl font-display font-bold mt-2",
                      isCredit && "text-expense"
                    )}>
                      {isCredit ? '-' : ''}${Math.abs(bank.blance).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        bank.account_type === 'Checking' && "bg-primary/10 text-primary",
                        bank.account_type === 'Savings' && "bg-income/10 text-income",
                        bank.account_type === 'Investment' && "bg-warning/10 text-warning",
                        bank.account_type === 'Credit' && "bg-expense/10 text-expense"
                      )}>
                        {bank.account_type}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Add Account Card */}
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              onClick={() => setIsAddOpen(true)}
              className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all min-h-[200px] group"
            >
              <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Plus className="h-7 w-7" />
              </div>
              <span className="font-medium">Add Bank Account</span>
            </motion.button>
          </motion.div>
        </div>
      </PageTransition>
    </Layout>
  );
}
