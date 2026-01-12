import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { useStore, UserRole } from '@/store/useStore';
import { AnimatedBackground } from '../AnimatedBackground';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '@/components/ui/button';
import { 
  LogOut, Truck, Shield, Building2, Users, 
  LayoutDashboard, FileText, BarChart3, ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface RoleLayoutProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const roleConfig: Record<UserRole, { 
  label: string; 
  color: string; 
  icon: typeof Shield;
  navItems: { path: string; label: string; icon: typeof LayoutDashboard }[];
}> = {
  'ultra-admin': {
    label: 'Ultra Admin',
    color: 'bg-red-500/10 text-red-500 border-red-500/30',
    icon: Shield,
    navItems: [
      { path: '/ultra-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/ultra-admin/branches', label: 'Branches', icon: Building2 },
      { path: '/ultra-admin/users', label: 'Users', icon: Users },
    ],
  },
  'super-admin': {
    label: 'Super Admin',
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    icon: Shield,
    navItems: [
      { path: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/super-admin/analytics', label: 'Analytics', icon: BarChart3 },
      { path: '/super-admin/reports', label: 'Reports', icon: FileText },
    ],
  },
  'sub-super-admin': {
    label: 'CO Office',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    icon: ClipboardList,
    navItems: [
      { path: '/sub-super-admin/dashboard', label: 'CO Requests', icon: LayoutDashboard },
    ],
  },
  'admin': {
    label: 'Admin',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    icon: Users,
    navItems: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/admin/entry', label: 'New Entry', icon: FileText },
    ],
  },
};

export const RoleLayout = ({ children, allowedRoles }: RoleLayoutProps) => {
  const { currentUser, logout, getBranchById } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  if (!currentUser?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to={`/${currentUser.role}/dashboard`} replace />;
  }

  const config = roleConfig[currentUser.role];
  const RoleIcon = config.icon;
  const branch = currentUser.branchId ? getBranchById(currentUser.branchId) : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl"
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 10 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"
            >
              <Truck className="h-5 w-5 text-primary" />
            </motion.div>
            <div>
              <span className="text-lg font-bold tracking-tight">
                Transport<span className="text-primary">Pro</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn(
              'hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:flex',
              config.color
            )}>
              <RoleIcon className="h-3.5 w-3.5" />
              {config.label}
            </div>
            
            {branch && (
              <div className="hidden items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-3 py-1.5 text-xs font-medium sm:flex">
                <Building2 className="h-3.5 w-3.5" />
                {branch.name}
              </div>
            )}
            
            <span className="hidden text-sm text-muted-foreground md:block">
              {currentUser.username}
            </span>
            
            <ThemeToggle />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-9 w-9 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="sticky top-16 z-40 border-b border-border/20 bg-background/60 backdrop-blur-lg"
      >
        <div className="container mx-auto flex gap-1 overflow-x-auto px-4 py-2">
          {config.navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
                <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                 
                  <Icon className="h-4 w-4 shrink-0" />

                  <span className="whitespace-nowrap">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.nav>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3 }}
          className="container mx-auto px-4 py-6"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
};
