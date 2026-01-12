import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Trash2, Shield, Building2, Edit2 } from 'lucide-react';
import { useStore, UserRole } from '@/store/useStore';
import { RoleLayout } from '@/components/layouts/RoleLayout';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/FloatingInput';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const roleColors: Record<UserRole, string> = {
  'ultra-admin': 'bg-red-500/10 text-red-500 border-red-500/30',
  'super-admin': 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  'sub-super-admin': 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  'admin': 'bg-blue-500/10 text-blue-500 border-blue-500/30',
};

const roleLabels: Record<UserRole, string> = {
  'ultra-admin': 'Ultra Admin',
  'super-admin': 'Super Admin',
  'sub-super-admin': 'Sub Super Admin (CO Office)',
  'admin': 'Admin',
};

export const UsersPage = () => {
  const { users, branches, addUser, deleteUser, updateUserBranches, getBranchById } = useStore();
  const { toast } = useToast();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setRole('admin');
    setSelectedBranchId('');
    setSelectedBranchIds([]);
    setError('');
  };

  const handleAddUser = () => {
    setError('');
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    
    if (role === 'admin' && !selectedBranchId) {
      setError('Please select a branch for admin');
      return;
    }

    const result = addUser({
      username: username.trim(),
      password: password.trim(),
      role,
      branchId: role === 'admin' ? selectedBranchId : undefined,
      assignedBranchIds: role === 'super-admin' ? selectedBranchIds : undefined,
    });
    
    if (!result.success) {
      setError(result.error || 'Failed to create user');
      return;
    }
    
    setIsAddDialogOpen(false);
    resetForm();
    
    toast({
      title: 'User Created',
      description: `${username.trim()} has been added as ${roleLabels[role]}`,
    });
  };

  const handleEditBranches = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setEditingUserId(userId);
      setSelectedBranchIds(user.assignedBranchIds || []);
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateBranches = () => {
    if (editingUserId) {
      updateUserBranches(editingUserId, selectedBranchIds);
      setIsEditDialogOpen(false);
      setEditingUserId(null);
      setSelectedBranchIds([]);
      
      toast({
        title: 'Branches Updated',
        description: 'User branch assignments have been updated',
      });
    }
  };

  const handleDeleteUser = (userId: string, username: string) => {
    deleteUser(userId);
    toast({
      title: 'User Deleted',
      description: `${username} has been removed`,
    });
  };

  const toggleBranchSelection = (branchId: string) => {
    setSelectedBranchIds((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };

  const nonUltraAdminUsers = users.filter((u) => u.role !== 'ultra-admin');

  return (
    <RoleLayout allowedRoles={['ultra-admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage users across all roles
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">Role</label>
                  <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super-admin">Super Admin</SelectItem>
                      <SelectItem value="sub-super-admin">Sub Super Admin (CO Office)</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {role === 'admin' && (
                  <div>
                    <label className="mb-2 block text-sm text-muted-foreground">Branch</label>
                    <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedBranchId && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Username must end with: _{branches.find((b) => b.id === selectedBranchId)?.name.toLowerCase().replace(/\s+/g, '')}
                      </p>
                    )}
                  </div>
                )}
                
                {role === 'super-admin' && (
                  <div>
                    <label className="mb-2 block text-sm text-muted-foreground">Assign Branches</label>
                    <div className="space-y-2 rounded-lg border border-border/50 bg-secondary/30 p-3">
                      {branches.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No branches available</p>
                      ) : (
                        branches.map((branch) => (
                          <div key={branch.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`branch-${branch.id}`}
                              checked={selectedBranchIds.includes(branch.id)}
                              onCheckedChange={() => toggleBranchSelection(branch.id)}
                            />
                            <label htmlFor={`branch-${branch.id}`} className="text-sm">
                              {branch.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                
                <FloatingInput
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                
                <FloatingInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                
                <Button onClick={handleAddUser} className="w-full">
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users List */}
        {nonUltraAdminUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card flex flex-col items-center justify-center py-16 text-center"
          >
            <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">No users yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create users to manage branches
            </p>
            <Button className="mt-4 gap-2" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </motion.div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30 bg-secondary/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Branch(es)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {nonUltraAdminUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-border/20 transition-colors hover:bg-secondary/30"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                              <Shield className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{user.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', roleColors[user.role])}>
                            {roleLabels[user.role]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {user.role === 'admin' && user.branchId ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{getBranchById(user.branchId)?.name}</span>
                            </div>
                          ) : user.role === 'super-admin' && user.assignedBranchIds ? (
                            <div className="flex flex-wrap gap-1">
                              {user.assignedBranchIds.map((id) => (
                                <span key={id} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                                  {getBranchById(id)?.name}
                                </span>
                              ))}
                              {user.assignedBranchIds.length === 0 && (
                                <span className="text-xs text-muted-foreground">No branches</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">All branches</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {user.role === 'super-admin' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditBranches(user.id)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{user.username}". This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Branches Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Branch Assignments</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2 rounded-lg border border-border/50 bg-secondary/30 p-3">
                {branches.map((branch) => (
                  <div key={branch.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`edit-branch-${branch.id}`}
                      checked={selectedBranchIds.includes(branch.id)}
                      onCheckedChange={() => toggleBranchSelection(branch.id)}
                    />
                    <label htmlFor={`edit-branch-${branch.id}`} className="text-sm">
                      {branch.name}
                    </label>
                  </div>
                ))}
              </div>
              <Button onClick={handleUpdateBranches} className="w-full">
                Update Branches
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleLayout>
  );
};

export default UsersPage;
