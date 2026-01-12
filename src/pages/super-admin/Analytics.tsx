import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Building2, Truck, Users } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { RoleLayout } from '@/components/layouts/RoleLayout';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';

const COLORS = ['#00d4ff', '#00a3cc', '#007799', '#004d66', '#002233', '#3b82f6', '#8b5cf6', '#ec4899'];

export const AnalyticsPage = () => {
  const { currentUser, entries, branches, getBranchById } = useStore();

  const assignedBranches = useMemo(() => {
    if (!currentUser?.assignedBranchIds) return [];
    return branches.filter((b) => currentUser.assignedBranchIds?.includes(b.id));
  }, [branches, currentUser]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => currentUser?.assignedBranchIds?.includes(e.branchId));
  }, [entries, currentUser]);

  // Branch-wise data
  const branchData = useMemo(() => {
    return assignedBranches.map((branch) => {
      const branchEntries = filteredEntries.filter((e) => e.branchId === branch.id);
      return {
        name: branch.name,
        entries: branchEntries.length,
        cost: branchEntries.reduce((sum, e) => sum + e.cost, 0),
        cft: branchEntries.reduce((sum, e) => sum + e.cft, 0),
        cash: branchEntries.reduce((sum, e) => sum + e.cash, 0),
        upi: branchEntries.reduce((sum, e) => sum + e.upi, 0),
      };
    });
  }, [assignedBranches, filteredEntries]);

  // Vendor-wise data across all assigned branches
  const vendorData = useMemo(() => {
    const vendorMap: Record<string, { entries: number; cost: number; cft: number }> = {};
    
    filteredEntries.forEach((entry) => {
      const vendorName = entry.coVendor || entry.vendor || 'No Vendor';
      if (!vendorMap[vendorName]) {
        vendorMap[vendorName] = { entries: 0, cost: 0, cft: 0 };
      }
      vendorMap[vendorName].entries += 1;
      vendorMap[vendorName].cost += entry.cost;
      vendorMap[vendorName].cft += entry.cft;
    });
    
    return Object.entries(vendorMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.cost - a.cost);
  }, [filteredEntries]);

  // Vendor distribution for pie chart
  const vendorPieData = useMemo(() => {
    return vendorData.slice(0, 6).map((v) => ({
      name: v.name,
      value: v.entries,
    }));
  }, [vendorData]);

  // Trip distribution
  const tripData = useMemo(() => {
    const firstTrip = filteredEntries.filter((e) => e.trip === '1st').length;
    const secondTrip = filteredEntries.filter((e) => e.trip === '2nd').length;
    return [
      { name: '1st Trip', value: firstTrip },
      { name: '2nd Trip', value: secondTrip },
    ];
  }, [filteredEntries]);

  // Payment mode distribution
  const paymentData = useMemo(() => {
    const totalCash = filteredEntries.reduce((sum, e) => sum + e.cash, 0);
    const totalUpi = filteredEntries.reduce((sum, e) => sum + e.upi, 0);
    return [
      { name: 'Cash', value: totalCash },
      { name: 'UPI', value: totalUpi },
    ];
  }, [filteredEntries]);

  // CO Status distribution
  const coStatusData = useMemo(() => {
    const pending = filteredEntries.filter((e) => !e.coApplied).length;
    const applied = filteredEntries.filter((e) => e.coApplied && !e.coPdfUrl).length;
    const uploaded = filteredEntries.filter((e) => e.coPdfUrl).length;
    return [
      { name: 'Pending', value: pending },
      { name: 'CO Applied', value: applied },
      { name: 'CO Uploaded', value: uploaded },
    ];
  }, [filteredEntries]);

  // Overall stats
  const stats = useMemo(() => ({
    totalEntries: filteredEntries.length,
    totalCFT: filteredEntries.reduce((sum, e) => sum + e.cft, 0),
    totalCost: filteredEntries.reduce((sum, e) => sum + e.cost, 0),
    avgCost: filteredEntries.length > 0 
      ? Math.round(filteredEntries.reduce((sum, e) => sum + e.cost, 0) / filteredEntries.length) 
      : 0,
    totalVendors: vendorData.length,
  }), [filteredEntries, vendorData]);

  return (
    <RoleLayout allowedRoles={['super-admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Branch-wise performance and comparisons
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Truck, label: 'Total Trucks', value: stats.totalEntries, color: 'text-primary' },
            { icon: BarChart3, label: 'Total CFT', value: stats.totalCFT.toLocaleString(), color: 'text-blue-500' },
            { icon: TrendingUp, label: 'Total Revenue', value: `₹${stats.totalCost.toLocaleString()}`, color: 'text-success' },
            { icon: Building2, label: 'Avg per Truck', value: `₹${stats.avgCost.toLocaleString()}`, color: 'text-orange-500' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5"
            >
              <div className="flex items-center gap-4">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Branch Comparison Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h3 className="mb-4 text-lg font-semibold">Branch-wise Revenue</h3>
            {branchData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </motion.div>

          {/* Trip Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h3 className="mb-4 text-lg font-semibold">Trip Distribution</h3>
            {tripData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tripData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {tripData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </motion.div>
        </div>

        {/* Vendor Analytics Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Vendor Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card p-6"
          >
            <h3 className="mb-4 text-lg font-semibold">Vendor-wise Revenue</h3>
            {vendorData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vendorData.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" width={80} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="cost" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No vendor data available
              </div>
            )}
          </motion.div>

          {/* Vendor Distribution Pie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <h3 className="mb-4 text-lg font-semibold">Vendor Entry Distribution</h3>
            {vendorPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={vendorPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {vendorPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No vendor data available
              </div>
            )}
          </motion.div>
        </div>

        {/* Second Row Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Payment Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="glass-card p-6"
          >
            <h3 className="mb-4 text-lg font-semibold">Payment Mode</h3>
            {paymentData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
                  >
                    {paymentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#22c55e' : '#a855f7'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </motion.div>

          {/* CO Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <h3 className="mb-4 text-lg font-semibold">CO Status Overview</h3>
            {coStatusData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={coStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    <Cell fill="#6b7280" />
                    <Cell fill="#eab308" />
                    <Cell fill="#22c55e" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </motion.div>
        </div>

        {/* Vendor Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass-card overflow-hidden"
        >
          <div className="p-6 pb-0">
            <h3 className="text-lg font-semibold">Vendor Performance</h3>
            <p className="text-sm text-muted-foreground">Vendor-wise entry and revenue breakdown</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30 bg-secondary/30">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Entries</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Total CFT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Avg per Entry</th>
                </tr>
              </thead>
              <tbody>
                {vendorData.map((vendor) => (
                  <tr key={vendor.name} className="border-b border-border/20 transition-colors hover:bg-secondary/30">
                    <td className="px-6 py-4 font-medium">{vendor.name}</td>
                    <td className="px-6 py-4">{vendor.entries}</td>
                    <td className="px-6 py-4">{vendor.cft.toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-success">₹{vendor.cost.toLocaleString()}</td>
                    <td className="px-6 py-4">₹{vendor.entries > 0 ? Math.round(vendor.cost / vendor.entries).toLocaleString() : 0}</td>
                  </tr>
                ))}
                {vendorData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No vendor data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Branch Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card overflow-hidden"
        >
          <div className="p-6 pb-0">
            <h3 className="text-lg font-semibold">Branch Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30 bg-secondary/30">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Entries</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Total CFT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Cash</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">UPI</th>
                </tr>
              </thead>
              <tbody>
                {branchData.map((branch) => (
                  <tr key={branch.name} className="border-b border-border/20 transition-colors hover:bg-secondary/30">
                    <td className="px-6 py-4 font-medium">{branch.name}</td>
                    <td className="px-6 py-4">{branch.entries}</td>
                    <td className="px-6 py-4">{branch.cft.toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-success">₹{branch.cost.toLocaleString()}</td>
                    <td className="px-6 py-4">₹{branch.cash.toLocaleString()}</td>
                    <td className="px-6 py-4">₹{branch.upi.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </RoleLayout>
  );
};

export default AnalyticsPage;
