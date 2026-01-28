
import { useState, useCallback, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { PageTransition } from '@/components/PageTransition';
import { PullToRefresh } from '@/components/PullToRefresh';
import { AnimatedCounter, AnimatedCurrency, AnimatedPercentage } from '@/components/AnimatedCounter';
import { DashboardSkeleton } from '@/components/LoadingSkeletons';
import { useDashboard } from '@/hooks/useApi';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Calendar,
  Sparkles,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

// --- Animations ---
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// --- Mock Data Helpers ---
// (In a real scenario, these colors would come from the theme or config)
const CHART_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const { data, isLoading, refetch } = useDashboard();
  const [refreshKey, setRefreshKey] = useState(0);
  const { playRefresh } = useSoundEffects();
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    playRefresh();
    await refetch();
    queryClient.invalidateQueries();
    setRefreshKey(prev => prev + 1);
  }, [refetch, queryClient, playRefresh]);

  const today = new Date();

  // --- Derived Data ---
  const balanceTrend = useMemo(() => {
    if (!data) return 0;
    return data.summary.balance_pct;
  }, [data]);

  const expenseData = useMemo(() => {
    if (!data) return [];
    return data.expense_pie_chart.map((item: any, index: number) => ({
      ...item,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [data]);

  if (isLoading || !data) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  const { summary, trend_line_chart, savings_goals, bank_accounts, loans_overview } = data;

  return (
    <Layout>
      <PullToRefresh onRefresh={handleRefresh}>
        <PageTransition>
          <div className="space-y-8 pb-8">
            {/* --- Header Section --- */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-1"
              >
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  <span>{format(today, 'EEEE, MMMM do, yyyy')}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  Overview
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3"
              >
                <Link to="/income" className="btn-action bg-income/10 text-income hover:bg-income/20 border-income/20">
                  <Plus className="w-4 h-4 mr-2" />
                  Income
                </Link>
                <Link to="/expenses" className="btn-action bg-expense/10 text-expense hover:bg-expense/20 border-expense/20">
                  <Plus className="w-4 h-4 mr-2" />
                  Expense
                </Link>
              </motion.div>
            </header>

            {/* --- Bento Grid Layout --- */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            >

              {/* 1. Total Balance (Large Card) */}
              <motion.div
                variants={fadeInUp}
                className="md:col-span-2 lg:col-span-2 row-span-1 relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-purple-800 p-6 text-primary-foreground shadow-xl shadow-primary/20"
              >
                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold backdrop-blur-md border",
                      summary.balance_pct >= 0 ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-100" : "bg-rose-500/20 border-rose-500/30 text-rose-100"
                    )}>
                      {summary.balance_pct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{Math.abs(summary.balance_pct)}%</span>
                    </div>
                  </div>

                  <div className="space-y-1 mt-6">
                    <span className="text-primary-foreground/70 font-medium">Total Balance</span>
                    <div className="flex items-baseline gap-1">
                      <AnimatedCurrency
                        value={summary.total_balance}
                        className="text-4xl sm:text-5xl font-display font-bold tracking-tight"
                        key={`balance-${refreshKey}`}
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between text-sm">
                    <div className="flex gap-6">
                      <div className="flex flex-col">
                        <span className="text-primary-foreground/60 text-xs uppercase tracking-wider">Income</span>
                        <span className="font-semibold text-lg flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" />
                          <AnimatedCurrency value={summary.monthly_income} className="text-white" />
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-primary-foreground/60 text-xs uppercase tracking-wider">Expenses</span>
                        <span className="font-semibold text-lg flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3" />
                          <AnimatedCurrency value={summary.monthly_expenses} className="text-white" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 2. Monthly Savings */}
              <motion.div
                variants={fadeInUp}
                className="md:col-span-1 lg:col-span-1 bg-card border border-border/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
                      <PiggyBank className="w-6 h-6" />
                    </div>
                    <span className={cn("text-sm font-semibold", summary.savings_pct >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {summary.savings_pct > 0 ? '+' : ''}{summary.savings_pct}%
                    </span>
                  </div>
                  <span className="text-muted-foreground font-medium block mb-1">Monthly Savings</span>
                  <AnimatedCurrency
                    value={summary.monthly_savings}
                    className="text-3xl font-bold text-foreground block"
                  />
                  <div className="mt-4 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (summary.monthly_savings / (summary.monthly_income || 1)) * 100)}%` }}
                      transition={{ duration: 1, ease: "circOut" }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {((summary.monthly_savings / (summary.monthly_income || 1)) * 100).toFixed(1)}% of income saved
                  </p>
                </div>
              </motion.div>

              {/* 3. Action Grid (Small Cards) */}
              <motion.div
                variants={fadeInUp}
                className="md:col-span-1 lg:col-span-1 grid grid-rows-2 gap-4"
              >
                <Link to="/loans" className="bg-card border border-border/50 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] flex flex-col justify-center gap-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <Activity className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm font-medium">Net Loans</span>
                    <div className="font-bold text-lg text-foreground">
                      {loans_overview.net_balance >= 0 ? '+' : ''}${loans_overview.net_balance.toLocaleString()}
                    </div>
                  </div>
                </Link>

                <Link to="/budgets" className="bg-card border border-border/50 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] flex flex-col justify-center gap-2 group">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Target className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm font-medium">Budgets</span>
                    <div className="font-bold text-lg text-foreground">View Status</div>
                  </div>
                </Link>
              </motion.div>


              {/* 4. Main Chart (Occupies wider space) */}
              <motion.div
                variants={fadeInUp}
                className="md:col-span-2 lg:col-span-3 bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col min-h-[350px]"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold font-display">Financial Activity</h3>
                    <p className="text-sm text-muted-foreground">Income vs Expense analysis</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-secondary/50 p-1 rounded-lg">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-background rounded-md shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="font-medium">Income</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-muted-foreground">Expense</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full h-full min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend_line_chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--expense))" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="hsl(var(--expense))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickFormatter={(val) => `$${val / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: 'var(--shadow-xl)'
                        }}
                        itemStyle={{ fontWeight: 500 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorIncome)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="hsl(var(--expense))"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorExpense)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>


              {/* 5. Expense Breakdown (Side Panel) */}
              <motion.div
                variants={fadeInUp}
                className="md:col-span-1 lg:col-span-1 bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col"
              >
                <h3 className="text-lg font-bold font-display mb-1">Expense</h3>
                <p className="text-sm text-muted-foreground mb-6">Distribution by category</p>

                <div className="flex-1 min-h-[200px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: 'var(--shadow-lg)'
                        }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <span className="font-bold text-lg text-foreground">${summary.monthly_expenses.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {expenseData.slice(0, 3).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-muted-foreground truncate max-w-[100px]">{item.name}</span>
                      </div>
                      <span className="font-medium">${item.value.toLocaleString()}</span>
                    </div>
                  ))}
                  {expenseData.length > 3 && (
                    <div className="text-center pt-2">
                      <Link to="/expenses" className="text-xs text-primary font-medium hover:underline">View All Categories</Link>
                    </div>
                  )}
                </div>
              </motion.div>


              {/* 6. Accounts Scroll (Full Width Lower) */}
              <motion.div
                variants={fadeInUp}
                className="md:col-span-3 lg:col-span-4 bg-transparent"
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-lg font-bold font-display">My Accounts</h3>
                  <Link to="/accounts" className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {bank_accounts.slice(0, 4).map((account, idx) => (
                    <div
                      key={account.id}
                      className="bg-card border border-border/50 rounded-2xl p-5 hover:translate-y-[-4px] transition-all duration-300 shadow-sm hover:shadow-card cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-8">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
                          account.account_type === 'Cash' ? "bg-gradient-to-br from- emerald-500 to-teal-600" : "bg-gradient-to-br from-indigo-500 to-purple-600"
                        )}>
                          {account.account_type === 'Cash' ? <BanknoteIcon className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                        </div>
                        <span className="px-2 py-1 rounded-md bg-secondary text-xs font-medium text-muted-foreground">
                          {account.account_type}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-semibold text-foreground truncate">{account.bank_name}</h4>
                        <AnimatedCounter
                          value={account.blance}
                          prefix="$"
                          className="text-xl font-bold font-display mt-1 block group-hover:text-primary transition-colors"
                        />
                      </div>
                    </div>
                  ))}

                  <Link
                    to="/accounts"
                    className="bg-secondary/30 border border-dashed border-border rounded-2xl p-5 flex flex-col items-center justify-center text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all gap-2 min-h-[160px]"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm">Add Account</span>
                  </Link>
                </div>
              </motion.div>

            </motion.div>
          </div>
        </PageTransition>
      </PullToRefresh>
    </Layout>
  );
}

// Helper component for the Banknote icon if not imported
function BanknoteIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
  )
}

// Add these simplified styles to your global CSS or styles layer if not present
/*
.btn-action {
    @apply flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95;
}
*/
