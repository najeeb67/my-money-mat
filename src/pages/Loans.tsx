import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { PageTransition } from '@/components/PageTransition';
import { Badge } from '@/components/ui/badge';
import { useLoans, useLoanSummary, useCreateLoan, useProcessLoanPayment, useBankAccounts, useCashWallet } from '@/hooks/useApi';
import { HandCoins, ArrowUpRight, ArrowDownRight, User, Sparkles, Plus, DollarSign, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { toast } from 'sonner';
import { SoundButton } from '@/components/SoundButton';

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

export default function Loans() {
  const { data: loans = [], isLoading: loansLoading } = useLoans();
  const { data: summary, isLoading: summaryLoading } = useLoanSummary();
  const { data: banks = [] } = useBankAccounts();
  const createLoanMutation = useCreateLoan();
  const processPaymentMutation = useProcessLoanPayment();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null); // Using any for simplicity with API types, ideally strictly typed

  // Create Form State
  const [newLoan, setNewLoan] = useState({
    person_name: '',
    total_amount: '',
    loan_type: 'lent',
    due_date: undefined as Date | undefined,
    note: '',
  });

  // Payment Form State
  const [payment, setPayment] = useState({
    amount: '',
    payment_source: 'cash',
    bank_id: '',
  });

  const isLoading = loansLoading || summaryLoading;

  const lentLoans = loans.filter((l) => l.loan_type === 'lent');
  const borrowedLoans = loans.filter((l) => l.loan_type === 'borrowed');

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = { pending: 'bg-expense/10 text-expense', partial: 'bg-warning/10 text-warning', completed: 'bg-income/10 text-income', active: 'bg-primary/10 text-primary' };
    return <Badge className={cn("font-medium capitalize", styles[status] || styles.pending)}>{status}</Badge>;
  };

  const handleCreateLoan = async () => {
    if (!newLoan.person_name || !newLoan.total_amount) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await createLoanMutation.mutateAsync({
        person_name: newLoan.person_name,
        total_amount: parseFloat(newLoan.total_amount),
        loan_type: newLoan.loan_type as 'lent' | 'borrowed',
        due_date: newLoan.due_date ? format(newLoan.due_date, 'yyyy-MM-dd') : undefined,
        note: newLoan.note || undefined,
        status: 'pending'
      });
      setIsCreateOpen(false);
      setNewLoan({ person_name: '', total_amount: '', loan_type: 'lent', due_date: undefined, note: '' });
      toast.success('Loan created successfully');
    } catch (error) {
      toast.error('Failed to create loan');
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedLoan || !payment.amount) {
      toast.error('Please enter an amount');
      return;
    }

    try {
      await processPaymentMutation.mutateAsync({
        loanId: selectedLoan.id,
        data: {
          loan_id: selectedLoan.id,
          amount: parseFloat(payment.amount),
          payment_source: payment.payment_source,
          bank_id: payment.bank_id ? parseInt(payment.bank_id) : undefined,
        }
      });
      setIsPaymentOpen(false);
      setPayment({ amount: '', payment_source: 'cash', bank_id: '' });
      setSelectedLoan(null);
      toast.success('Payment recorded successfully');
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const openPaymentModal = (loan: any) => {
    setSelectedLoan(loan);
    setIsPaymentOpen(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <PageTransition>
          <div className="space-y-8">
            <div className="h-10 bg-muted rounded animate-pulse w-48" />
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />)}
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
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-warning flex items-center justify-center">
                <HandCoins className="h-5 w-5 text-warning-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold">Loans</h1>
                <p className="text-muted-foreground">Track money lent and borrowed</p>
              </div>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <SoundButton className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Loan
                </SoundButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Loan</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Person Name</Label>
                    <Input
                      placeholder="John Doe"
                      value={newLoan.person_name}
                      onChange={(e) => setNewLoan(prev => ({ ...prev, person_name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newLoan.total_amount}
                        onChange={(e) => setNewLoan(prev => ({ ...prev, total_amount: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={newLoan.loan_type}
                        onValueChange={(val) => setNewLoan(prev => ({ ...prev, loan_type: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lent">Lent (Given)</SelectItem>
                          <SelectItem value="borrowed">Borrowed (Taken)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newLoan.due_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newLoan.due_date ? format(newLoan.due_date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newLoan.due_date}
                          onSelect={(d) => setNewLoan(prev => ({ ...prev, due_date: d }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateLoan} disabled={createLoanMutation.isPending}>
                    {createLoanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Loan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-3"
          >
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-card rounded-2xl border border-income/20 p-6"
            >
              <div className="flex items-center gap-3"><ArrowDownRight className="h-5 w-5 text-income" /><p className="text-sm text-muted-foreground">To Receive</p></div>
              <p className="text-3xl font-display font-bold mt-2 text-income">${(summary?.to_receive ?? 0).toLocaleString()}</p>
            </motion.div>
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-card rounded-2xl border border-expense/20 p-6"
            >
              <div className="flex items-center gap-3"><ArrowUpRight className="h-5 w-5 text-expense" /><p className="text-sm text-muted-foreground">To Pay</p></div>
              <p className="text-3xl font-display font-bold mt-2 text-expense">${(summary?.to_pay ?? 0).toLocaleString()}</p>
            </motion.div>
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-card rounded-2xl border border-primary/20 p-6"
            >
              <div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">Net Balance</p></div>
              <p className={cn("text-3xl font-display font-bold mt-2", (summary?.net_balance ?? 0) >= 0 ? "text-income" : "text-expense")}>${Math.abs(summary?.net_balance ?? 0).toLocaleString()}</p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 lg:grid-cols-2"
          >
            <motion.div
              variants={itemVariants}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <h2 className="font-display font-bold mb-4 flex items-center gap-2"><ArrowDownRight className="h-5 w-5 text-income" />Money Lent ({lentLoans.length})</h2>
              <div className="space-y-3">
                {lentLoans.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No loans to show</p>
                ) : (
                  lentLoans.map((loan, index) => (
                    <motion.div
                      key={loan.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                      className="p-4 rounded-xl bg-income/5 border border-income/10 group relative"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-income" />
                          <div>
                            <p className="font-semibold">{loan.person_name}</p>
                            <p className="text-sm text-muted-foreground">${loan.amount_paid_received} / ${loan.total_amount}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => openPaymentModal(loan)}
                            title="Record Repayment"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          {getStatusBadge(loan.status)}
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 bg-secondary rounded-full">
                        <motion.div
                          className="h-full bg-income rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(loan.amount_paid_received / loan.total_amount) * 100}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <h2 className="font-display font-bold mb-4 flex items-center gap-2"><ArrowUpRight className="h-5 w-5 text-expense" />Money Borrowed ({borrowedLoans.length})</h2>
              <div className="space-y-3">
                {borrowedLoans.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No borrowed money to show</p>
                ) : (
                  borrowedLoans.map((loan, index) => (
                    <motion.div
                      key={loan.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                      className="p-4 rounded-xl bg-expense/5 border border-expense/10 group relative"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-expense" />
                          <div>
                            <p className="font-semibold">{loan.person_name}</p>
                            <p className="text-sm text-muted-foreground">${loan.amount_paid_received} / ${loan.total_amount}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => openPaymentModal(loan)}
                            title="Record Payment"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          {getStatusBadge(loan.status)}
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 bg-secondary rounded-full">
                        <motion.div
                          className="h-full bg-expense rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(loan.amount_paid_received / loan.total_amount) * 100}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Payment Modal */}
          <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={payment.amount}
                    onChange={(e) => setPayment(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Source</Label>
                  <Select
                    value={payment.payment_source}
                    onValueChange={(val) => setPayment(prev => ({ ...prev, payment_source: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash Wallet</SelectItem>
                      <SelectItem value="bank">Bank Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {payment.payment_source === 'bank' && (
                  <div className="space-y-2">
                    <Label>Bank Account</Label>
                    <Select
                      value={payment.bank_id}
                      onValueChange={(val) => setPayment(prev => ({ ...prev, bank_id: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map((b) => (
                          <SelectItem key={b.id} value={b.id.toString()}>
                            {b.bank_name} - ${b.blance}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleProcessPayment} disabled={processPaymentMutation.isPending}>
                  {processPaymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </PageTransition>
    </Layout>
  );
}
