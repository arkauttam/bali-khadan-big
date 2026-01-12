import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Eye, Building2, Truck, 
  DollarSign, TrendingUp, ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import { useStore, FormEntry } from '@/store/useStore';
import { RoleLayout } from '@/components/layouts/RoleLayout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export const SuperAdminDashboard = () => {
  const { currentUser, entries, branches, getBranchById } = useStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [tripFilter, setTripFilter] = useState<'all' | '1st' | '2nd'>('all');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<FormEntry | null>(null);

  // Get assigned branches
  const assignedBranches = useMemo(() => {
    if (!currentUser?.assignedBranchIds) return [];
    return branches.filter((b) => currentUser.assignedBranchIds?.includes(b.id));
  }, [branches, currentUser]);

  // Filter entries by assigned branches
  const filteredEntries = useMemo(() => {
    let result = entries.filter((e) => 
      currentUser?.assignedBranchIds?.includes(e.branchId)
    );

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((e) =>
        e.carNumber.toLowerCase().includes(query) ||
        e.phoneNumber.includes(query) ||
        e.name.toLowerCase().includes(query)
      );
    }

    if (branchFilter !== 'all') {
      result = result.filter((e) => e.branchId === branchFilter);
    }

    if (tripFilter !== 'all') {
      result = result.filter((e) => e.trip === tripFilter);
    }

    if (dateFrom) {
      result = result.filter((e) => e.dateTime >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((e) => e.dateTime <= dateTo + 'T23:59:59');
    }

    result.sort((a, b) => {
      const dateA = new Date(a.dateTime).getTime();
      const dateB = new Date(b.dateTime).getTime();
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [entries, currentUser, searchQuery, branchFilter, tripFilter, dateFrom, dateTo, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    return {
      totalEntries: filteredEntries.length,
      totalCFT: filteredEntries.reduce((sum, e) => sum + e.cft, 0),
      totalCost: filteredEntries.reduce((sum, e) => sum + e.cost, 0),
      totalCash: filteredEntries.reduce((sum, e) => sum + e.cash, 0),
      totalUpi: filteredEntries.reduce((sum, e) => sum + e.upi, 0),
    };
  }, [filteredEntries]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const StatCard = ({ icon: Icon, label, value, color }: { icon: typeof Truck; label: string; value: string | number; color: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-3">
        <div className={cn('rounded-xl p-2.5', color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <RoleLayout allowedRoles={['super-admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Viewing {assignedBranches.length} assigned branches
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={Truck} label="Total Trucks" value={stats.totalEntries} color="bg-primary/10 text-primary" />
          <StatCard icon={FileText} label="Total CFT" value={stats.totalCFT.toLocaleString()} color="bg-blue-500/10 text-blue-500" />
          <StatCard icon={DollarSign} label="Total Cost" value={`₹${stats.totalCost.toLocaleString()}`} color="bg-success/10 text-success" />
          <StatCard icon={TrendingUp} label="Total Cash" value={`₹${stats.totalCash.toLocaleString()}`} color="bg-orange-500/10 text-orange-500" />
          <StatCard icon={TrendingUp} label="Total UPI" value={`₹${stats.totalUpi.toLocaleString()}`} color="bg-purple-500/10 text-purple-500" />
        </div>

        {/* Filters */}
        <div className="glass-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search car, phone, driver..."
                className="w-full rounded-xl border border-border/50 bg-secondary/50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[160px]">
                <Building2 className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {assignedBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex rounded-xl border border-border/50 bg-secondary/30 p-1">
              {(['all', '1st', '2nd'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTripFilter(t)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                    tripFilter === t
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t === 'all' ? 'All' : `${t} Trip`}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
              <Filter className="h-4 w-4" />
              {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'latest' ? 'oldest' : 'latest')}
            >
              {sortOrder === 'latest' ? 'Latest First' : 'Oldest First'}
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 flex flex-wrap items-end gap-4 border-t border-border/30 pt-4"
              >
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); setSearchQuery(''); setBranchFilter('all'); setTripFilter('all'); }}>
                  Clear All
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Truck className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium">No entries found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30 bg-secondary/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Sl</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Car Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Trip</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">CFT</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Cost</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">CO Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredEntries.map((entry, index) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          'border-b border-border/20 transition-colors hover:bg-secondary/30',
                          entry.trip === '2nd' && 'highlight-row'
                        )}
                      >
                        <td className="px-4 py-3 text-sm font-medium">{entry.slNo}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                            {getBranchById(entry.branchId)?.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(entry.dateTime)}</td>
                        <td className="px-4 py-3 text-sm font-medium">{entry.carNumber}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            entry.trip === '1st' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'
                          )}>
                            {entry.trip}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{entry.cft}</td>
                        <td className="px-4 py-3 text-sm font-medium text-success">₹{entry.cost}</td>
                        <td className="px-4 py-3">
                          {entry.coPdfUrl ? (
                            <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                              CO Uploaded
                            </span>
                          ) : entry.coApplied ? (
                            <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500">
                              CO Applied
                            </span>
                          ) : (
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(entry)} className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* View Dialog */}
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Entry Details</DialogTitle>
            </DialogHeader>
            {selectedEntry && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Branch</p>
                    <p className="font-medium">{getBranchById(selectedEntry.branchId)?.name}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Admin</p>
                    <p className="font-medium">{selectedEntry.adminUsername}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Sl No</p>
                    <p className="text-lg font-bold">{selectedEntry.slNo}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Wheels</p>
                    <p className="text-lg font-bold">{selectedEntry.wheels}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">CFT</p>
                    <p className="text-lg font-bold">{selectedEntry.cft}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Car Number</p>
                  <p className="text-lg font-bold">{selectedEntry.carNumber}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-success/10 p-3">
                    <p className="text-xs text-muted-foreground">Cost</p>
                    <p className="text-lg font-bold text-success">₹{selectedEntry.cost}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Cash</p>
                    <p className="text-lg font-bold">₹{selectedEntry.cash}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">UPI</p>
                    <p className="text-lg font-bold">₹{selectedEntry.upi}</p>
                  </div>
                </div>
                {selectedEntry.remark && (
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Remark</p>
                    <p className="text-sm">{selectedEntry.remark}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleLayout>
  );
};

export default SuperAdminDashboard;
