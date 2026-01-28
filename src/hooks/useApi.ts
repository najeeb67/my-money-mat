import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOfflineMutation } from './useOfflineMutation';
import { api } from '@/lib/api';
import type {
  BankAccount,
  CashWallet,
  CreateBankAccount,
  ExpenseCategory,
  Expense,
  CreateExpense,
  IncomeSource,
  Income,
  CreateIncome,
  Loan,
  CreateLoan,
  LoanPayment,
  LoanSummary,
  Budget,
  CreateBudget,
  BudgetStatus,
  SavingsTarget,
  CreateSavingsTarget,
  Alert,
  DashboardData,
  MonthlyReport,
} from '@/lib/api';

// Query Keys
export const queryKeys = {
  dashboard: ['dashboard'] as const,
  cashWallet: ['cashWallet'] as const,
  bankAccounts: ['bankAccounts'] as const,
  expenseCategories: ['expenseCategories'] as const,
  expenses: (params?: { start_date?: string; end_date?: string; category_id?: number }) => ['expenses', params] as const,
  incomeSources: ['incomeSources'] as const,
  incomes: (params?: { start_date?: string; end_date?: string; source_id?: number }) => ['incomes', params] as const,
  loans: (params?: { person_name?: string; loan_type?: 'lent' | 'borrowed' }) => ['loans', params] as const,
  loanSummary: ['loanSummary'] as const,
  budgets: (month: string) => ['budgets', month] as const,
  budgetStatus: (month: string) => ['budgetStatus', month] as const,
  savingsTargets: ['savingsTargets'] as const,
  alerts: ['alerts'] as const,
  monthlyReport: (month: string) => ['monthlyReport', month] as const,
};

// ============ Dashboard ============
export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.getDashboard(),
  });
}

// ============ Banks ============
export function useCashWallet() {
  return useQuery({
    queryKey: queryKeys.cashWallet,
    queryFn: () => api.getCashWallet(),
  });
}

export function useUpdateCashWallet() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'updateCashWallet',
    mutationFn: (balance: number) => api.updateCashWallet(balance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashWallet });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useBankAccounts() {
  return useQuery({
    queryKey: queryKeys.bankAccounts,
    queryFn: () => api.getBankAccounts(),
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'createBankAccount',
    mutationFn: (data: CreateBankAccount) => api.createBankAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'updateBankAccount',
    mutationFn: ({ id, data }: { id: number; data: CreateBankAccount }) => api.updateBankAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'deleteBankAccount',
    mutationFn: (id: number) => api.deleteBankAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ============ Expenses ============
export function useExpenseCategories() {
  return useQuery({
    queryKey: queryKeys.expenseCategories,
    queryFn: () => api.getExpenseCategories(),
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createExpenseCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenseCategories });
    },
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteExpenseCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenseCategories });
    },
  });
}

export function useExpenses(params?: { start_date?: string; end_date?: string; category_id?: number }) {
  return useQuery({
    queryKey: queryKeys.expenses(params),
    queryFn: () => api.getExpenses(params),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'createExpense',
    mutationFn: (data: CreateExpense) => api.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashWallet });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'deleteExpense',
    mutationFn: (id: number) => api.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ============ Income ============
export function useIncomeSources() {
  return useQuery({
    queryKey: queryKeys.incomeSources,
    queryFn: () => api.getIncomeSources(),
  });
}

export function useCreateIncomeSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createIncomeSource(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incomeSources });
    },
  });
}

export function useIncomes(params?: { start_date?: string; end_date?: string; source_id?: number }) {
  return useQuery({
    queryKey: queryKeys.incomes(params),
    queryFn: () => api.getIncomes(params),
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'createIncome',
    mutationFn: (data: CreateIncome) => api.createIncome(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashWallet });
    },
  });
}

// ============ Loans ============
export function useLoans(params?: { person_name?: string; loan_type?: 'lent' | 'borrowed' }) {
  return useQuery({
    queryKey: queryKeys.loans(params),
    queryFn: () => api.getLoans(params),
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'createLoan',
    mutationFn: (data: CreateLoan) => api.createLoan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.loanSummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useProcessLoanPayment() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'processLoanPayment',
    mutationFn: ({ loanId, data }: { loanId: number; data: LoanPayment }) => api.processLoanPayment(loanId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.loanSummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useLoanSummary() {
  return useQuery({
    queryKey: queryKeys.loanSummary,
    queryFn: () => api.getLoanSummary(),
  });
}

// ============ Budgets ============
export function useBudgets(month: string) {
  return useQuery({
    queryKey: queryKeys.budgets(month),
    queryFn: () => api.getBudgets(month),
  });
}

export function useBudgetStatus(month: string) {
  return useQuery({
    queryKey: queryKeys.budgetStatus(month),
    queryFn: () => api.getBudgetStatus(month),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'createBudget',
    mutationFn: (data: CreateBudget) => api.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetStatus'] });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'updateBudget',
    mutationFn: ({ id, data }: { id: number; data: CreateBudget }) => api.updateBudget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetStatus'] });
    },
  });
}

// ============ Savings ============
export function useSavingsTargets() {
  return useQuery({
    queryKey: queryKeys.savingsTargets,
    queryFn: () => api.getSavingsTargets(),
  });
}

export function useCreateSavingsTarget() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'createSavingsTarget',
    mutationFn: (data: CreateSavingsTarget) => api.createSavingsTarget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsTargets });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateSavingsTarget() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'updateSavingsTarget',
    mutationFn: ({ id, data }: { id: number; data: CreateSavingsTarget }) => api.updateSavingsTarget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsTargets });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteSavingsTarget() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'deleteSavingsTarget',
    mutationFn: (id: number) => api.deleteSavingsTarget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsTargets });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useContributeToSavings() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'contributeToSavings',
    mutationFn: ({ targetId, amount }: { targetId: number; amount: number }) => api.contributeToSavings(targetId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingsTargets });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ============ Alerts ============
export function useAlerts() {
  return useQuery({
    queryKey: queryKeys.alerts,
    queryFn: () => api.getAlerts(),
  });
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'markAlertAsRead',
    mutationFn: (id: number) => api.markAlertAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationKey: 'deleteAlert',
    mutationFn: (id: number) => api.deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  });
}

// ============ Analytics ============
export function useMonthlyReport(month: string) {
  return useQuery({
    queryKey: queryKeys.monthlyReport(month),
    queryFn: () => api.getMonthlyReport(month),
    enabled: !!month,
  });
}
