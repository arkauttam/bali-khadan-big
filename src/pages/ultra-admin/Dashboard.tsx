import { motion } from 'framer-motion';
import { 
  Building2, Users, FileText, Truck, 
  DollarSign, RefreshCw, Database, Shield
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { RoleLayout } from '@/components/layouts/RoleLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color,
  delay = 0 
}: { 
  icon: typeof Building2; 
  label: string; 
  value: string | number; 
  color: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card p-5"
  >
    <div className="flex items-center gap-4">
      <div className={cn('rounded-xl p-3', color)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </motion.div>
);

export const UltraAdminDashboard = () => {
  const { branches, users, entries, resetData, loadSampleData } = useStore();
  const { toast } = useToast();

  const stats = {
    totalBranches: branches.length,
    totalUsers: users.length,
    totalEntries: entries.length,
    totalCost: entries.reduce((sum, e) => sum + e.cost, 0),
    superAdmins: users.filter((u) => u.role === 'super-admin').length,
    admins: users.filter((u) => u.role === 'admin').length,
    coApplied: entries.filter((e) => e.coApplied).length,
    coUploaded: entries.filter((e) => e.coPdfUrl).length,
  };

  const handleReset = () => {
    resetData();
    toast({
      title: 'Data Reset',
      description: 'All demo data has been cleared',
    });
  };

  const handleLoadSample = () => {
    loadSampleData();
    toast({
      title: 'Sample Data Loaded',
      description: 'Demo branches, users, and entries have been created',
    });
  };

  return (
    <RoleLayout allowedRoles={['ultra-admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ultra Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              System controller with full access
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reset Data
            </Button>
            <Button size="sm" onClick={handleLoadSample} className="gap-2">
              <Database className="h-4 w-4" />
              Load Sample Data
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Building2}
            label="Total Branches"
            value={stats.totalBranches}
            color="bg-blue-500/10 text-blue-500"
            delay={0}
          />
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers}
            color="bg-green-500/10 text-green-500"
            delay={0.1}
          />
          <StatCard
            icon={Truck}
            label="Total Entries"
            value={stats.totalEntries}
            color="bg-purple-500/10 text-purple-500"
            delay={0.2}
          />
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`₹${stats.totalCost.toLocaleString()}`}
            color="bg-success/10 text-success"
            delay={0.3}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Shield}
            label="Super Admins"
            value={stats.superAdmins}
            color="bg-orange-500/10 text-orange-500"
            delay={0.4}
          />
          <StatCard
            icon={Users}
            label="Branch Admins"
            value={stats.admins}
            color="bg-cyan-500/10 text-cyan-500"
            delay={0.5}
          />
          <StatCard
            icon={FileText}
            label="CO Applied"
            value={stats.coApplied}
            color="bg-yellow-500/10 text-yellow-500"
            delay={0.6}
          />
          <StatCard
            icon={FileText}
            label="CO Uploaded"
            value={stats.coUploaded}
            color="bg-emerald-500/10 text-emerald-500"
            delay={0.7}
          />
        </div>

        {/* Quick Access Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <a href="/ultra-admin/branches" className="glass-card group p-6 transition-all hover:border-primary/50">
            <Building2 className="mb-4 h-8 w-8 text-primary transition-transform group-hover:scale-110" />
            <h3 className="text-lg font-semibold">Manage Branches</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create, edit, and delete branches
            </p>
            <p className="mt-3 text-sm text-primary">
              {stats.totalBranches} branches configured →
            </p>
          </a>

          <a href="/ultra-admin/users" className="glass-card group p-6 transition-all hover:border-primary/50">
            <Users className="mb-4 h-8 w-8 text-primary transition-transform group-hover:scale-110" />
            <h3 className="text-lg font-semibold">Manage Users</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create Super Admins, Sub Super Admin, and Admins
            </p>
            <p className="mt-3 text-sm text-primary">
              {stats.totalUsers} users active →
            </p>
          </a>

          <a href="#" className="glass-card group p-6 transition-all hover:border-primary/50">
            <FileText className="mb-4 h-8 w-8 text-primary transition-transform group-hover:scale-110" />
            <h3 className="text-lg font-semibold">View All Entries</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Read-only access to all operational data
            </p>
            <p className="mt-3 text-sm text-primary">
              {stats.totalEntries} entries total →
            </p>
          </a>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h2 className="mb-4 text-lg font-semibold">Recent Branches</h2>
          {branches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Building2 className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No branches created yet</p>
              <Button size="sm" className="mt-4" onClick={handleLoadSample}>
                Load Sample Data
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {branches.slice(0, 5).map((branch, index) => (
                <motion.div
                  key={branch.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center justify-between rounded-xl border border-border/30 bg-secondary/30 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{branch.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {users.filter((u) => u.branchId === branch.id).length} admins
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {entries.filter((e) => e.branchId === branch.id).length} entries
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </RoleLayout>
  );
};

export default UltraAdminDashboard;
