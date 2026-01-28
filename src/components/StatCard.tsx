import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'income' | 'expense' | 'accent';
  className?: string;
  animateValue?: boolean;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default', className, animateValue = true }: StatCardProps) {
  const cardVariants = {
    default: 'bg-card border-border',
    income: 'bg-gradient-to-br from-income/20 to-income/5 border-income/20',
    expense: 'bg-gradient-to-br from-expense/20 to-expense/5 border-expense/20',
    accent: 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20',
  };

  const iconVariants = {
    default: 'bg-muted text-foreground',
    income: 'gradient-income text-income-foreground shadow-lg',
    expense: 'gradient-expense text-expense-foreground shadow-lg',
    accent: 'gradient-primary text-primary-foreground shadow-lg glow-primary',
  };

  const valueVariants = {
    default: 'text-foreground',
    income: 'text-income',
    expense: 'text-expense',
    accent: 'text-gradient',
  };

  const trendColor = trend ? (trend.value >= 0 ? 'text-income' : 'text-expense') : '';

  const renderValue = () => {
    if (typeof value === 'number' && animateValue) {
      return (
        <AnimatedCounter
          value={value}
          prefix="$"
          decimals={2}
          className={cn(
            'text-3xl font-display font-bold tracking-tight transition-all duration-200 group-hover:scale-[1.02] origin-left',
            valueVariants[variant]
          )}
        />
      );
    }
    return (
      <span className={cn(
        'text-3xl font-display font-bold tracking-tight transition-all duration-200 group-hover:scale-[1.02] origin-left',
        valueVariants[variant]
      )}>
        {typeof value === 'number' ? `$${value.toLocaleString()}` : value}
      </span>
    );
  };

  return (
    <div className={cn(
      'group relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:translate-y-[-4px] hover:shadow-card-hover cursor-pointer active:scale-[0.98]',
      cardVariants[variant],
      className
    )}>
      {/* Decorative element with animation */}
      <div className="absolute top-0 right-0 w-32 h-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:from-primary/10" />
      
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider transition-all duration-200 group-hover:text-foreground">{title}</p>
          {renderValue()}
          {subtitle && (
            <p className="text-sm text-muted-foreground transition-opacity duration-200 group-hover:opacity-80">{subtitle}</p>
          )}
          {trend && (
            <div className={cn('inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full transition-all duration-200 group-hover:scale-105', 
              trend.value >= 0 ? 'bg-income/10' : 'bg-expense/10',
              trendColor
            )}>
              <span className="transition-transform duration-200 group-hover:translate-y-[-2px]">{trend.value >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-xl p-3.5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6', iconVariants[variant])}>
          <Icon className="h-6 w-6 transition-transform duration-200" />
        </div>
      </div>
    </div>
  );
}
