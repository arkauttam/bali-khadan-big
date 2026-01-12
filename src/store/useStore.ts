import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'ultra-admin' | 'super-admin' | 'sub-super-admin' | 'admin';

export interface Vendor {
  id: string;
  name: string;
  branchId: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  vendors: Vendor[];
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  branchId?: string; // Only for admin
  assignedBranchIds?: string[]; // Only for super-admin
  createdAt: string;
}

export interface FormEntry {
  id: string;
  slNo: number;
  dateTime: string;
  name: string;
  phoneNumber: string;
  vendor: string;
  location: string;
  carNumber: string;
  wheels: number;
  cft: number;
  cost: number;
  cash: number;
  upi: number;
  remark: string;
  trip: '1st' | '2nd';
  policeStations?: string[];
  branchId: string;
  adminUsername: string;
  coApplied: boolean;
  coAppliedAt?: string;
  coVendor?: string;
  coPdfUrl?: string;
  coPdfUploadedAt?: string;
}

interface CurrentUser {
  id: string;
  username: string;
  role: UserRole;
  branchId?: string;
  assignedBranchIds?: string[];
  isAuthenticated: boolean;
}

interface AppState {
  // Auth
  currentUser: CurrentUser | null;
  
  // Data
  users: User[];
  branches: Branch[];
  entries: FormEntry[];
  theme: 'dark' | 'light';
  
  // Auth actions
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  
  // Branch actions
  addBranch: (name: string, vendors?: string[]) => void;
  deleteBranch: (id: string) => void;
  addVendorToBranch: (branchId: string, vendorName: string) => void;
  deleteVendor: (branchId: string, vendorId: string) => void;
  getBranchVendors: (branchId: string) => Vendor[];
  
  // User actions
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  deleteUser: (id: string) => void;
  updateUserBranches: (userId: string, branchIds: string[]) => void;
  
  // Entry actions
  addEntry: (entry: Omit<FormEntry, 'id' | 'slNo' | 'branchId' | 'adminUsername' | 'coApplied'>) => void;
  updateEntry: (entryId: string, updates: Partial<Omit<FormEntry, 'id' | 'slNo' | 'branchId' | 'adminUsername'>>) => void;
  deleteEntry: (id: string) => void;
  applyForCO: (entryId: string, vendor: string) => void;
  uploadCOPdf: (entryId: string, pdfUrl: string) => void;
  
  // Theme
  toggleTheme: () => void;
  
  // Helpers
  getNextSlNo: (date: string, branchId: string) => number;
  getBranchById: (id: string) => Branch | undefined;
  getUsersByBranch: (branchId: string) => User[];
  getEntriesByBranch: (branchId: string) => FormEntry[];
  getCOAppliedEntries: () => FormEntry[];
  
  // Demo data
  resetData: () => void;
  loadSampleData: () => void;
}

const initialState = {
  currentUser: null,
  users: [
    {
      id: 'ultra-1',
      username: 'ultraadmin',
      password: 'ultra123',
      role: 'ultra-admin' as UserRole,
      createdAt: new Date().toISOString(),
    },
  ],
  branches: [],
  entries: [],
  theme: 'dark' as const,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      login: (username: string, password: string) => {
        const user = get().users.find(
          (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
        );
        
        if (!user) {
          return { success: false, error: 'Invalid username or password' };
        }
        
        set({
          currentUser: {
            id: user.id,
            username: user.username,
            role: user.role,
            branchId: user.branchId,
            assignedBranchIds: user.assignedBranchIds,
            isAuthenticated: true,
          },
        });
        
        return { success: true };
      },
      
      logout: () => {
        set({ currentUser: null });
      },
      
      addBranch: (name: string, vendorNames: string[] = []) => {
        const branchId = crypto.randomUUID();
        const vendors: Vendor[] = vendorNames
          .filter((v) => v.trim())
          .map((vendorName) => ({
            id: crypto.randomUUID(),
            name: vendorName.trim(),
            branchId,
            createdAt: new Date().toISOString(),
          }));
        
        const newBranch: Branch = {
          id: branchId,
          name,
          vendors,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ branches: [...state.branches, newBranch] }));
      },
      
      deleteBranch: (id: string) => {
        set((state) => ({
          branches: state.branches.filter((b) => b.id !== id),
          users: state.users.filter((u) => u.branchId !== id),
          entries: state.entries.filter((e) => e.branchId !== id),
        }));
      },
      
      addVendorToBranch: (branchId: string, vendorName: string) => {
        const newVendor: Vendor = {
          id: crypto.randomUUID(),
          name: vendorName.trim(),
          branchId,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          branches: state.branches.map((b) =>
            b.id === branchId ? { ...b, vendors: [...b.vendors, newVendor] } : b
          ),
        }));
      },
      
      deleteVendor: (branchId: string, vendorId: string) => {
        set((state) => ({
          branches: state.branches.map((b) =>
            b.id === branchId
              ? { ...b, vendors: b.vendors.filter((v) => v.id !== vendorId) }
              : b
          ),
        }));
      },
      
      getBranchVendors: (branchId: string) => {
        const branch = get().branches.find((b) => b.id === branchId);
        return branch?.vendors || [];
      },
      
      addUser: (userData) => {
        const { users, branches } = get();
        
        // Check if username exists
        if (users.some((u) => u.username.toLowerCase() === userData.username.toLowerCase())) {
          return { success: false, error: 'Username already exists' };
        }
        
        // Validate admin username format
        if (userData.role === 'admin' && userData.branchId) {
          const branch = branches.find((b) => b.id === userData.branchId);
          if (branch) {
            const expectedSuffix = `_${branch.name.toLowerCase().replace(/\s+/g, '')}`;
            if (!userData.username.toLowerCase().endsWith(expectedSuffix)) {
              return { 
                success: false, 
                error: `Admin username must end with ${expectedSuffix}` 
              };
            }
          }
        }
        
        // Only one sub-super-admin allowed
        if (userData.role === 'sub-super-admin') {
          if (users.some((u) => u.role === 'sub-super-admin')) {
            return { success: false, error: 'Only one Sub Super Admin is allowed' };
          }
        }
        
        const newUser: User = {
          ...userData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({ users: [...state.users, newUser] }));
        return { success: true };
      },
      
      deleteUser: (id: string) => {
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
        }));
      },
      
      updateUserBranches: (userId: string, branchIds: string[]) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId ? { ...u, assignedBranchIds: branchIds } : u
          ),
        }));
      },
      
      addEntry: (entry) => {
        const state = get();
        const currentUser = state.currentUser;
        
        if (!currentUser || currentUser.role !== 'admin' || !currentUser.branchId) {
          return;
        }
        
        const dateKey = entry.dateTime.split('T')[0];
        const slNo = state.getNextSlNo(dateKey, currentUser.branchId);
        
        const newEntry: FormEntry = {
          ...entry,
          id: crypto.randomUUID(),
          slNo,
          branchId: currentUser.branchId,
          adminUsername: currentUser.username,
          coApplied: false,
        };
        
        set({ entries: [...state.entries, newEntry] });
      },
      
      updateEntry: (entryId: string, updates: Partial<Omit<FormEntry, 'id' | 'slNo' | 'branchId' | 'adminUsername'>>) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === entryId ? { ...e, ...updates } : e
          ),
        }));
      },
      
      deleteEntry: (id: string) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },
      
      applyForCO: (entryId: string, vendor: string) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === entryId
              ? {
                  ...e,
                  coApplied: true,
                  coAppliedAt: new Date().toISOString(),
                  coVendor: vendor,
                }
              : e
          ),
        }));
      },
      
      uploadCOPdf: (entryId: string, pdfUrl: string) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === entryId
              ? {
                  ...e,
                  coPdfUrl: pdfUrl,
                  coPdfUploadedAt: new Date().toISOString(),
                }
              : e
          ),
        }));
      },
      
      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        }));
      },
      
      getNextSlNo: (date: string, branchId: string) => {
        const state = get();
        const sameDateEntries = state.entries.filter(
          (e) => e.dateTime.split('T')[0] === date && e.branchId === branchId
        );
        return sameDateEntries.length + 1;
      },
      
      getBranchById: (id: string) => {
        return get().branches.find((b) => b.id === id);
      },
      
      getUsersByBranch: (branchId: string) => {
        return get().users.filter((u) => u.branchId === branchId);
      },
      
      getEntriesByBranch: (branchId: string) => {
        return get().entries.filter((e) => e.branchId === branchId);
      },
      
      getCOAppliedEntries: () => {
        return get().entries.filter((e) => e.coApplied);
      },
      
      resetData: () => {
        set({
          ...initialState,
          currentUser: get().currentUser,
        });
      },
      
      loadSampleData: () => {
        const branches: Branch[] = [
          { 
            id: 'branch-1', 
            name: 'Mumbai', 
            vendors: [
              { id: 'v1', name: 'Vendor A', branchId: 'branch-1', createdAt: new Date().toISOString() },
              { id: 'v2', name: 'Vendor B', branchId: 'branch-1', createdAt: new Date().toISOString() },
            ],
            createdAt: new Date().toISOString() 
          },
          { 
            id: 'branch-2', 
            name: 'Delhi', 
            vendors: [
              { id: 'v3', name: 'Vendor C', branchId: 'branch-2', createdAt: new Date().toISOString() },
            ],
            createdAt: new Date().toISOString() 
          },
          { 
            id: 'branch-3', 
            name: 'Bangalore', 
            vendors: [],
            createdAt: new Date().toISOString() 
          },
        ];
        
        const users: User[] = [
          ...get().users.filter((u) => u.role === 'ultra-admin'),
          {
            id: 'super-1',
            username: 'superadmin',
            password: 'super123',
            role: 'super-admin',
            assignedBranchIds: ['branch-1', 'branch-2'],
            createdAt: new Date().toISOString(),
          },
          {
            id: 'subsup-1',
            username: 'cooffice',
            password: 'co123',
            role: 'sub-super-admin',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'admin-1',
            username: 'amit_mumbai',
            password: 'admin123',
            role: 'admin',
            branchId: 'branch-1',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'admin-2',
            username: 'raj_delhi',
            password: 'admin123',
            role: 'admin',
            branchId: 'branch-2',
            createdAt: new Date().toISOString(),
          },
        ];
        
        const entries: FormEntry[] = [
          {
            id: 'entry-1',
            slNo: 1,
            dateTime: new Date().toISOString(),
            name: 'John Driver',
            phoneNumber: '9876543210',
            vendor: 'Vendor A',
            location: 'Mumbai Port',
            carNumber: 'MH01AB1234',
            wheels: 10,
            cft: 100,
            cost: 5000,
            cash: 3000,
            upi: 2000,
            remark: 'Regular delivery',
            trip: '1st',
            branchId: 'branch-1',
            adminUsername: 'amit_mumbai',
            coApplied: true,
            coAppliedAt: new Date().toISOString(),
            coVendor: 'Vendor A',
          },
          {
            id: 'entry-2',
            slNo: 2,
            dateTime: new Date().toISOString(),
            name: 'Mike Trucker',
            phoneNumber: '9123456789',
            vendor: 'Vendor B',
            location: 'Delhi Hub',
            carNumber: 'DL02CD5678',
            wheels: 12,
            cft: 150,
            cost: 7500,
            cash: 7500,
            upi: 0,
            remark: 'Express delivery',
            trip: '2nd',
            policeStations: ['Station A', 'Station B'],
            branchId: 'branch-2',
            adminUsername: 'raj_delhi',
            coApplied: false,
          },
        ];
        
        set({ branches, users, entries });
      },
    }),
    {
      name: 'transport-rbac-storage',
    }
  )
);
