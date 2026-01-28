import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { InstallPWA } from './InstallPWA';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  HandCoins,
  PiggyBank,
  Target,
  Bell,
  Menu,
  X,
  Settings,
  Sparkles,
  LogOut,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/accounts', label: 'Accounts', icon: Wallet },
  { path: '/income', label: 'Income', icon: TrendingUp },
  { path: '/expenses', label: 'Expenses', icon: TrendingDown },
  { path: '/loans', label: 'Loans', icon: HandCoins },
  { path: '/budgets', label: 'Budgets', icon: PiggyBank },
  { path: '/savings', label: 'Savings Goals', icon: Target },
  // { path: '/settings', label: 'Settings', icon: Settings },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();


  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border px-4 h-16 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2.5 rounded-xl bg-secondary hover:bg-muted transition-all duration-200 active:scale-95 hover:shadow-md"
        >
          <Menu className="h-5 w-5 transition-transform duration-200 hover:scale-110" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center glow-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">Zaroorat</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/alerts" className="p-2.5 rounded-xl bg-secondary hover:bg-muted transition-all duration-200 relative active:scale-95 hover:shadow-md group">
            <Bell className="h-5 w-5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-expense rounded-full border-2 border-card animate-pulse" />
          </Link>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-[280px] bg-card border-r border-border transform transition-transform duration-300 ease-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center glow-primary animate-pulse-glow">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display font-bold text-xl block">Zaroorat</span>
                <span className="text-xs text-muted-foreground">Pro Dashboard</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-all duration-200 active:scale-90 hover:rotate-90"
            >
              <X className="h-5 w-5 transition-transform duration-200" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-4">Menu</p>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]',
                    isActive
                      ? 'gradient-primary text-primary-foreground shadow-lg glow-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-1 hover:shadow-md'
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive ? "animate-bounce-subtle" : "group-hover:scale-110 group-hover:rotate-6"
                  )} />
                  <span className="transition-all duration-200 group-hover:tracking-wide">{item.label}</span>
                </Link>
              );
            })}

            {/* Divider */}
            <div className="my-4 border-t border-border" />

            {/* Theme Toggle & Install - Desktop */}
            <div className="hidden lg:flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <InstallPWA variant="outline" className="w-full justify-start mt-2" />
            </div>

            {/* Alerts Link */}
            <Link
              to="/alerts"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]',
                location.pathname === '/alerts'
                  ? 'gradient-primary text-primary-foreground shadow-lg glow-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-1 hover:shadow-md'
              )}
            >
              <Bell className={cn(
                "h-5 w-5 transition-all duration-200",
                location.pathname === '/alerts' ? "animate-bounce-subtle" : "group-hover:scale-110 group-hover:rotate-12"
              )} />
              <span className="transition-all duration-200 group-hover:tracking-wide">Alerts</span>
              <span className="ml-auto h-5 w-5 rounded-full bg-expense/20 text-expense text-xs flex items-center justify-center font-semibold animate-pulse">3</span>
            </Link>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            <div className="group flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-200">
              <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold transition-transform duration-200 group-hover:scale-105">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold truncate capitalize">{user?.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-muted transition-all duration-200 active:scale-95"
              >
                <Settings className="h-4 w-4 text-muted-foreground transition-transform duration-300 hover:rotate-90" />
              </Link>
            </div>
            <button
              onClick={logout}
              className="mt-2 w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-expense hover:bg-expense/10 transition-all duration-200 active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-[280px] pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
