import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Eye, Upload, Building2, 
  FileText, ChevronDown, ChevronUp, Check
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const SubSuperAdminDashboard = () => {
  const { entries, branches, getBranchById, uploadCOPdf } = useStore();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [selectedEntry, setSelectedEntry] = useState<FormEntry | null>(null);
  const [uploadingEntryId, setUploadingEntryId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get only CO-applied entries (not yet uploaded)
  const coAppliedEntries = useMemo(() => {
    let result = entries.filter((e) => e.coApplied);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((e) =>
        e.carNumber.toLowerCase().includes(query) ||
        e.adminUsername.toLowerCase().includes(query) ||
        getBranchById(e.branchId)?.name.toLowerCase().includes(query)
      );
    }

    if (branchFilter !== 'all') {
      result = result.filter((e) => e.branchId === branchFilter);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.coAppliedAt || a.dateTime).getTime();
      const dateB = new Date(b.coAppliedAt || b.dateTime).getTime();
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [entries, searchQuery, branchFilter, sortOrder, getBranchById]);

  const pendingUploads = coAppliedEntries.filter((e) => !e.coPdfUrl);
  const completedUploads = coAppliedEntries.filter((e) => e.coPdfUrl);

  const handleUploadClick = (entryId: string) => {
    setUploadingEntryId(entryId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingEntryId) {
      // In a real app, you'd upload to a server. Here we create a fake URL
      const fakeUrl = `co-${uploadingEntryId}-${Date.now()}.pdf`;
      uploadCOPdf(uploadingEntryId, fakeUrl);
      
      toast({
        title: 'CO PDF Uploaded',
        description: 'The CO document has been uploaded successfully',
      });
      
      setUploadingEntryId(null);
    }
    e.target.value = '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <RoleLayout allowedRoles={['sub-super-admin']}>
      <div className="space-y-6">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
        />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">CO Office Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage CO requests from all branches
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-yellow-500/10 p-3">
                <FileText className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Uploads</p>
                <p className="text-2xl font-bold">{pendingUploads.length}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-success/10 p-3">
                <Check className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedUploads.length}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-primary/10 p-3">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total CO Requests</p>
                <p className="text-2xl font-bold">{coAppliedEntries.length}</p>
              </div>
            </div>
          </motion.div>
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
                placeholder="Search car, branch, admin..."
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
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'latest' ? 'oldest' : 'latest')}
            >
              {sortOrder === 'latest' ? 'Latest First' : 'Oldest First'}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {coAppliedEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium">No CO requests</p>
              <p className="text-sm text-muted-foreground">
                CO-applied entries will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30 bg-secondary/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Sl</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Admin</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Car Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Applied At</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {coAppliedEntries.map((entry, index) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          'border-b border-border/20 transition-colors hover:bg-secondary/30',
                          !entry.coPdfUrl && 'bg-yellow-500/5'
                        )}
                      >
                        <td className="px-4 py-3 text-sm font-medium">{entry.slNo}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                            {getBranchById(entry.branchId)?.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{entry.adminUsername}</td>
                        <td className="px-4 py-3 text-sm font-medium">{entry.coVendor}</td>
                        <td className="px-4 py-3 text-sm font-medium">{entry.carNumber}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {entry.coAppliedAt ? formatDate(entry.coAppliedAt) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {entry.coPdfUrl ? (
                            <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                              Uploaded
                            </span>
                          ) : (
                            <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEntry(entry)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!entry.coPdfUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUploadClick(entry.id)}
                                className="h-8 w-8 p-0 text-primary hover:text-primary"
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
              <DialogTitle>CO Request Details</DialogTitle>
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
                
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Vendor</p>
                  <p className="text-lg font-bold">{selectedEntry.coVendor}</p>
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

                {!selectedEntry.coPdfUrl && (
                  <Button 
                    onClick={() => { setSelectedEntry(null); handleUploadClick(selectedEntry.id); }}
                    className="w-full gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload CO PDF
                  </Button>
                )}

                {selectedEntry.coPdfUrl && (
                  <div className="rounded-lg bg-success/10 p-3 text-center">
                    <Check className="mx-auto mb-2 h-6 w-6 text-success" />
                    <p className="font-medium text-success">CO PDF Uploaded</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedEntry.coPdfUploadedAt && formatDate(selectedEntry.coPdfUploadedAt)}
                    </p>
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

export default SubSuperAdminDashboard;
