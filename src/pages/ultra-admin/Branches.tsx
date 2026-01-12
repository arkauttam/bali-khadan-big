import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Trash2, Users, FileText, Store, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { RoleLayout } from '@/components/layouts/RoleLayout';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/FloatingInput';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export const BranchesPage = () => {
  const { branches, users, entries, addBranch, deleteBranch, addVendorToBranch, deleteVendor } = useStore();
  const { toast } = useToast();
  
  const [newBranchName, setNewBranchName] = useState('');
  const [vendorInputs, setVendorInputs] = useState<string[]>(['']);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');
  
  // Vendor management dialog
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [newVendorName, setNewVendorName] = useState('');

  const handleAddVendorInput = () => {
    setVendorInputs([...vendorInputs, '']);
  };

  const handleRemoveVendorInput = (index: number) => {
    if (vendorInputs.length > 1) {
      setVendorInputs(vendorInputs.filter((_, i) => i !== index));
    }
  };

  const handleVendorChange = (index: number, value: string) => {
    const updated = [...vendorInputs];
    updated[index] = value;
    setVendorInputs(updated);
  };

  const handleAddBranch = () => {
    setError('');
    
    if (!newBranchName.trim()) {
      setError('Branch name is required');
      return;
    }
    
    if (branches.some((b) => b.name.toLowerCase() === newBranchName.trim().toLowerCase())) {
      setError('Branch name already exists');
      return;
    }
    
    const vendors = vendorInputs.filter((v) => v.trim() !== '');
    addBranch(newBranchName.trim(), vendors);
    setNewBranchName('');
    setVendorInputs(['']);
    setIsDialogOpen(false);
    
    toast({
      title: 'Branch Created',
      description: `${newBranchName.trim()} has been added with ${vendors.length} vendor(s)`,
    });
  };

  const handleDeleteBranch = (branchId: string, branchName: string) => {
    deleteBranch(branchId);
    toast({
      title: 'Branch Deleted',
      description: `${branchName} and all associated data removed`,
    });
  };

  const openVendorDialog = (branchId: string) => {
    setSelectedBranchId(branchId);
    setNewVendorName('');
    setVendorDialogOpen(true);
  };

  const handleAddVendorToBranch = () => {
    if (!newVendorName.trim() || !selectedBranchId) return;
    
    const branch = branches.find((b) => b.id === selectedBranchId);
    const exists = branch?.vendors.some(
      (v) => v.name.toLowerCase() === newVendorName.toLowerCase()
    );
    
    if (exists) {
      toast({
        title: 'Error',
        description: 'Vendor already exists in this branch',
        variant: 'destructive',
      });
      return;
    }
    
    addVendorToBranch(selectedBranchId, newVendorName.trim());
    toast({
      title: 'Vendor Added',
      description: `${newVendorName.trim()} has been added`,
    });
    setNewVendorName('');
  };

  const handleDeleteVendor = (branchId: string, vendorId: string, vendorName: string) => {
    deleteVendor(branchId, vendorId);
    toast({
      title: 'Vendor Deleted',
      description: `${vendorName} has been removed`,
    });
  };

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  return (
    <RoleLayout allowedRoles={['ultra-admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Branch Management</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage branches and their vendors
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setNewBranchName('');
              setVendorInputs(['']);
              setError('');
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Branch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Branch</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <FloatingInput
                  label="Branch Name"
                  value={newBranchName}
                  onChange={(e) => {
                    setNewBranchName(e.target.value);
                    setError('');
                  }}
                  error={error}
                />
                
                {/* Vendors Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Vendors</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddVendorInput}
                      className="gap-1 h-7"
                    >
                      <Plus className="h-3 w-3" />
                      Add Vendor
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {vendorInputs.map((vendor, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-1">
                          <FloatingInput
                            label={`Vendor ${index + 1}`}
                            value={vendor}
                            onChange={(e) => handleVendorChange(index, e.target.value)}
                          />
                        </div>
                        {vendorInputs.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveVendorInput(index)}
                            className="shrink-0 h-10 w-10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can add more vendors later from the branch card
                  </p>
                </div>
                
                <Button onClick={handleAddBranch} className="w-full">
                  Create Branch
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Branches Grid */}
        {branches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card flex flex-col items-center justify-center py-16 text-center"
          >
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">No branches yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first branch to get started
            </p>
            <Button className="mt-4 gap-2" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Branch
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {branches.map((branch, index) => {
                const branchUsers = users.filter((u) => u.branchId === branch.id);
                const branchEntries = entries.filter((e) => e.branchId === branch.id);
                
                return (
                  <motion.div
                    key={branch.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-5"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{branch.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(branch.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Branch?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{branch.name}" and all associated users and entries. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBranch(branch.id, branch.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="rounded-lg bg-secondary/50 p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="text-xs">Admins</span>
                        </div>
                        <p className="mt-1 text-xl font-bold">{branchUsers.length}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/50 p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span className="text-xs">Entries</span>
                        </div>
                        <p className="mt-1 text-xl font-bold">{branchEntries.length}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/50 p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Store className="h-4 w-4" />
                          <span className="text-xs">Vendors</span>
                        </div>
                        <p className="mt-1 text-xl font-bold">{branch.vendors?.length || 0}</p>
                      </div>
                    </div>
                    
                    {/* Vendor List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Vendors</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openVendorDialog(branch.id)}
                          className="h-7 text-xs gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Manage
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {!branch.vendors || branch.vendors.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No vendors added</span>
                        ) : (
                          branch.vendors.slice(0, 3).map((vendor) => (
                            <Badge key={vendor.id} variant="secondary" className="text-xs">
                              {vendor.name}
                            </Badge>
                          ))
                        )}
                        {branch.vendors && branch.vendors.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{branch.vendors.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Vendor Management Dialog */}
        <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Vendors - {selectedBranch?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <FloatingInput
                    label="New Vendor Name"
                    value={newVendorName}
                    onChange={(e) => setNewVendorName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddVendorToBranch();
                      }
                    }}
                  />
                </div>
                <Button onClick={handleAddVendorToBranch} className="shrink-0">
                  Add
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Current Vendors</h4>
                {!selectedBranch?.vendors || selectedBranch.vendors.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No vendors in this branch yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedBranch?.vendors.map((vendor) => (
                      <div
                        key={vendor.id}
                        className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{vendor.name}</span>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove "{vendor.name}" from {selectedBranch?.name}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteVendor(selectedBranch!.id, vendor.id, vendor.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleLayout>
  );
};

export default BranchesPage;
