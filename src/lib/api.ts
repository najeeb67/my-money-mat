// API Base URL - Update this to your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://christian-lianne-developmentsolution-814bfc29.koyeb.app';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;
    const token = this.getToken();

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || 'An error occurred');
    }

    // Handle empty responses (204 No Content, etc.)
    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text);
  }

  // ============ Auth ============
  async register(data: { username: string; email: string; password: string }) {
    return this.request<User>('/api/auth/register', { method: 'POST', body: data });
  }

  async login(username: string, password: string) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${this.baseUrl}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return data;
  }

  async getCurrentUser() {
    return this.request<User>('/api/auth/me');
  }

  logout() {
    localStorage.removeItem('access_token');
  }

  // ============ Banks ============
  async getCashWallet() {
    return this.request<CashWallet>('/api/banks/cash-wallet');
  }

  async updateCashWallet(balance: number) {
    return this.request<CashWallet>('/api/banks/cash-wallet', { method: 'PUT', body: { balance } });
  }

  async getBankAccounts() {
    return this.request<BankAccount[]>('/api/banks');
  }

  async createBankAccount(data: CreateBankAccount) {
    return this.request<BankAccount>('/api/banks', { method: 'POST', body: data });
  }

  async getBankAccount(id: number) {
    return this.request<BankAccount>(`/api/banks/${id}`);
  }

  async updateBankAccount(id: number, data: CreateBankAccount) {
    return this.request<BankAccount>(`/api/banks/${id}`, { method: 'PUT', body: data });
  }

  async deleteBankAccount(id: number) {
    return this.request<{ message: string }>(`/api/banks/${id}`, { method: 'DELETE' });
  }

  // ============ Expenses ============
  async createExpenseCategory(name: string) {
    return this.request<ExpenseCategory>('/api/expenses/category', { method: 'POST', body: { name } });
  }

  async getExpenseCategories() {
    return this.request<ExpenseCategory[]>('/api/expenses/categories');
  }

  async updateExpenseCategory(categoryId: number, name: string) {
    return this.request<ExpenseCategory>(`/api/expenses/${categoryId}`, { method: 'PUT', body: { name } });
  }

  async deleteExpenseCategory(categoryId: number) {
    return this.request<{ message: string }>(`/api/expenses/${categoryId}`, { method: 'DELETE' });
  }

  async getExpenses(params?: { start_date?: string; end_date?: string; category_id?: number }) {
    const query = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, val]) => val !== undefined ? { ...acc, [key]: String(val) } : acc, {})
    ).toString() : '';
    return this.request<Expense[]>(`/api/expenses${query}`);
  }

  async createExpense(data: CreateExpense) {
    return this.request<Expense>('/api/expenses', { method: 'POST', body: data });
  }

  async deleteExpense(expenseId: number) {
    return this.request<{ message: string }>(`/api/expenses/${expenseId}`, { method: 'DELETE' });
  }

  // ============ Income ============
  async createIncomeSource(name: string) {
    return this.request<IncomeSource>('/api/incomes/sources', { method: 'POST', body: { name } });
  }

  async getIncomeSources() {
    return this.request<IncomeSource[]>('/api/incomes/sources');
  }

  async getIncomes(params?: { start_date?: string; end_date?: string; source_id?: number }) {
    const query = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, val]) => val !== undefined ? { ...acc, [key]: String(val) } : acc, {})
    ).toString() : '';
    return this.request<Income[]>(`/api/incomes${query}`);
  }

  async createIncome(data: CreateIncome) {
    return this.request<Income>('/api/incomes', { method: 'POST', body: data });
  }

  // ============ Loans ============
  async getLoans(params?: { person_name?: string; loan_type?: 'lent' | 'borrowed' }) {
    const query = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, val]) => val !== undefined ? { ...acc, [key]: String(val) } : acc, {})
    ).toString() : '';
    return this.request<Loan[]>(`/api/loans${query}`);
  }

  async createLoan(data: CreateLoan) {
    return this.request<Loan>('/api/loans', { method: 'POST', body: data });
  }

  async processLoanPayment(loanId: number, data: LoanPayment) {
    return this.request<Loan>(`/api/loans/${loanId}/payment`, { method: 'POST', body: data });
  }

  async getLoansByPerson(personName: string) {
    return this.request<Loan[]>(`/api/loans/person/${encodeURIComponent(personName)}`);
  }

  async getLoanSummary() {
    return this.request<LoanSummary>('/api/loans/summary');
  }

  // ============ Budgets ============
  async createBudget(data: CreateBudget) {
    return this.request<Budget>('/api/budgets', { method: 'POST', body: data });
  }

  async getBudgets(month: string) {
    return this.request<Budget[]>(`/api/budgets/${month}`);
  }

  async getBudgetStatus(month: string) {
    return this.request<BudgetStatus[]>(`/api/budgets/${month}/status`);
  }

  async updateBudget(budgetId: number, data: CreateBudget) {
    return this.request<Budget>(`/api/budgets/${budgetId}`, { method: 'PUT', body: data });
  }

  // ============ Savings ============
  async createSavingsTarget(data: CreateSavingsTarget) {
    return this.request<SavingsTarget>('/api/savings/targets', { method: 'POST', body: data });
  }

  async getSavingsTargets() {
    return this.request<SavingsTarget[]>('/api/savings/targets');
  }

  async getSavingsTarget(targetId: number) {
    return this.request<SavingsTarget>(`/api/savings/targets/${targetId}`);
  }

  async updateSavingsTarget(targetId: number, data: CreateSavingsTarget) {
    return this.request<SavingsTarget>(`/api/savings/target/${targetId}`, { method: 'PUT', body: data });
  }

  async deleteSavingsTarget(targetId: number) {
    return this.request<{ message: string }>(`/api/savings/target/${targetId}`, { method: 'DELETE' });
  }

  async contributeToSavings(targetId: number, amount: number) {
    return this.request<SavingsTarget>(`/api/savings/targets/${targetId}/contribute?amount=${amount}`, { method: 'POST' });
  }

  // ============ Alerts ============
  async getAlerts() {
    return this.request<Alert[]>('/api/savings/alerts');
  }

  async markAlertAsRead(alertId: number) {
    return this.request<Alert>(`/api/savings/alerts/${alertId}/read`, { method: 'PUT' });
  }

  async deleteAlert(alertId: number) {
    return this.request<{ message: string }>(`/api/savings/alerts/${alertId}`, { method: 'DELETE' });
  }

  // ============ Analytics ============
  async getDashboard() {
    return this.request<DashboardData>('/api/analytics/dashboard');
  }

  async getMonthlyReport(month: string) {
    return this.request<MonthlyReport>(`/api/analytics/monthly/${month}`);
  }

  async getMonthComparison(currentMonth: string, previousMonth: string) {
    return this.request<MonthComparison>(`/api/analytics/comparison?current_month=${currentMonth}&previous_month=${previousMonth}`);
  }
}

export const api = new ApiClient(API_BASE_URL);

// ============ Types ============

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface CashWallet {
  id: number;
  user_id: number;
  balance: number;
  updated_at: string;
}

export interface BankAccount {
  id: number | string;
  user_id: number;
  bank_name: string;
  account_type: string;
  blance: number; // Note: matches backend typo
  created_at: string;
}

export interface CreateBankAccount {
  bank_name: string;
  account_type: string;
  blance: number; // Note: matches backend typo
}

export interface ExpenseCategory {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
}

export interface Expense {
  id: number;
  user_id: number;
  amount: number;
  category_id: number;
  payment_source: string;
  bank_id?: number;
  note?: string;
  date: string;
  created_at: string;
}

export interface CreateExpense {
  amount: number;
  category_id: number;
  payment_source: string; // "Bank" or "Cash"
  bank_id?: number;
  note?: string;
  date: string;
}

export interface IncomeSource {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
}

export interface Income {
  id: number;
  user_id: number;
  amount: number;
  source_id: number;
  payment_source: string;
  bank_id?: number;
  note?: string;
  date: string;
  created_at: string;
}

export interface CreateIncome {
  amount: number;
  source_id: number;
  payment_source: string;
  bank_id?: number;
  note?: string;
  date: string;
}

export interface Loan {
  id: number;
  user_id: number;
  person_name: string;
  loan_type: 'lent' | 'borrowed';
  total_amount: number;
  amount_paid_received: number;
  status: 'pending' | 'active' | 'partial' | 'completed';
  due_date?: string;
  note?: string;
  date: string;
  created_at: string;
}

export interface CreateLoan {
  person_name: string;
  loan_type: 'lent' | 'borrowed';
  total_amount: number;
  status: string;
  due_date?: string;
  note?: string;
}

export interface LoanPayment {
  loan_id: number;
  amount: number;
  payment_source: string;
  bank_id?: number;
}

export interface LoanSummary {
  to_receive: number;
  to_pay: number;
  net_balance: number;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id?: number;
  amount: number;
  month: string;
  alert_threshold: number;
  created_at: string;
}

export interface CreateBudget {
  category_id?: number;
  amount: number;
  month: string;
  alert_threshold: number;
}

export interface BudgetStatus {
  budget_id: number;
  category_id?: number;
  budget_amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  alert?: string;
}

export interface SavingsTarget {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  description?: string;
  is_completed: boolean;
  created_at: string;
}

export interface CreateSavingsTarget {
  name: string;
  target_amount: number;
  deadline?: string;
  description?: string;
}

export interface Alert {
  id: number;
  alert_type: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardSummary {
  total_balance: number;
  balance_pct: number;
  monthly_income: number;
  income_pct: number;
  monthly_expenses: number;
  expense_pct: number;
  monthly_savings: number;
  savings_pct: number;
}

export interface ExpensePieChartData {
  name: string;
  value: number;
}

export interface TrendLineChartData {
  month: string;
  income: number;
  expense: number;
}

export interface SavingsGoalData {
  id: number;
  name: string;
  current: number;
  target: number;
  percentage: number;
}

export interface DashboardBankAccount {
  id: number | string;
  bank_name: string;
  account_type: string;
  blance: number;
}

export interface LoansOverview {
  to_receive: number;
  to_pay: number;
  net_balance: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  expense_pie_chart: ExpensePieChartData[];
  trend_line_chart: TrendLineChartData[];
  savings_goals: SavingsGoalData[];
  bank_accounts: DashboardBankAccount[];
  loans_overview: LoansOverview;
}

export interface MonthlyReport {
  month: string;
  total_income: number;
  total_expense: number;
  savings: number;
  average_daily_expense: number;
  category_breakdown: { category: string; amount: number }[];
  transaction_count: number;
}

export interface MonthComparison {
  current_month: string;
  current_total: number;
  previous_month: string;
  previous_total: number;
  change: number;
  percentage_change: number;
  trend: 'increased' | 'decreased' | 'stable';
}
