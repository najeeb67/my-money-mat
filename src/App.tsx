import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "./components/ThemeProvider";
import { PageTransition } from "./components/PageTransition";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Loans from "./pages/Loans";
import Budgets from "./pages/Budgets";
import Savings from "./pages/Savings";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import { OfflineSyncProvider } from "./components/OfflineSyncProvider";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/auth" element={<Auth />} />
        <Route path="/install" element={<PageTransition><Install /></PageTransition>} />

        <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute><PageTransition><Accounts /></PageTransition></ProtectedRoute>} />
        <Route path="/income" element={<ProtectedRoute><PageTransition><Income /></PageTransition></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><PageTransition><Expenses /></PageTransition></ProtectedRoute>} />
        <Route path="/loans" element={<ProtectedRoute><PageTransition><Loans /></PageTransition></ProtectedRoute>} />
        <Route path="/budgets" element={<ProtectedRoute><PageTransition><Budgets /></PageTransition></ProtectedRoute>} />
        <Route path="/savings" element={<ProtectedRoute><PageTransition><Savings /></PageTransition></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><PageTransition><Alerts /></PageTransition></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><PageTransition><Settings /></PageTransition></ProtectedRoute>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <OfflineSyncProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </OfflineSyncProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
