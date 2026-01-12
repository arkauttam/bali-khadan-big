import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "@/store/useStore";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Ultra Admin
import UltraAdminDashboard from "./pages/ultra-admin/Dashboard";
import BranchesPage from "./pages/ultra-admin/Branches";
import UsersPage from "./pages/ultra-admin/Users";

// Super Admin
import SuperAdminDashboard from "./pages/super-admin/Dashboard";
import AnalyticsPage from "./pages/super-admin/Analytics";
import ReportsPage from "./pages/super-admin/Reports";

// Sub Super Admin
import SubSuperAdminDashboard from "./pages/sub-super-admin/Dashboard";

// Admin
import AdminEntry from "./pages/admin/Entry";
import AdminDashboard from "./pages/admin/Dashboard";

const queryClient = new QueryClient();

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {/* Ultra Admin */}
            <Route path="/ultra-admin/dashboard" element={<UltraAdminDashboard />} />
            <Route path="/ultra-admin/branches" element={<BranchesPage />} />
            <Route path="/ultra-admin/users" element={<UsersPage />} />
            
            {/* Super Admin */}
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/analytics" element={<AnalyticsPage />} />
            <Route path="/super-admin/reports" element={<ReportsPage />} />
            
            {/* Sub Super Admin */}
            <Route path="/sub-super-admin/dashboard" element={<SubSuperAdminDashboard />} />
            
            {/* Admin */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/entry" element={<AdminEntry />} />
            
            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
