import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp,
  Car,
  Truck,
  FileCheck,
  Users,
  Printer,
  Download,
  Save,
  X,
} from 'lucide-react';

import { useStore, FormEntry } from '@/store/useStore';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FloatingInput } from '@/components/FloatingInput';
import { generateGhatSlipPDF } from '@/utils/generateGhatSlipPDF';



const getDateKey = (date: Date) =>
  date.toLocaleDateString('en-CA'); // YYYY-MM-DD

const getLabel = (date: Date) =>
  date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

// CO Status helper
const getCOStatus = (entry: FormEntry) => {
  if (entry.coPdfUrl) {
    return { status: 'completed', label: entry.coVendor || 'Completed', color: 'bg-green-500/10 text-green-500' };
  }
  if (entry.coApplied) {
    return { status: 'applied', label: 'Applied', color: 'bg-yellow-500/10 text-yellow-500' };
  }
  return { status: 'pending', label: 'Pending', color: 'bg-gray-500/10 text-gray-500' };
};

/* =====================
   Component
===================== */

export const Dashboard = () => {
  const { entries, currentUser, getBranchVendors, applyForCO, updateEntry, getBranchById } = useStore();
  const { toast } = useToast();
  const branch = currentUser.branchId ? getBranchById(currentUser.branchId) : null;
  const COMPANY = {
    name: branch.name,
    address: 'NH-16, Kolaghat, West Bengal',
    phone: '+91 9XXXXXXXXX',
  };
  // Filter entries for current user's branch
  const branchEntries = useMemo(() => {
    if (!currentUser?.branchId) return entries;
    return entries.filter((e) => e.branchId === currentUser.branchId);
  }, [entries, currentUser]);

  // Get branch vendors
  const branchVendors = useMemo(() => {
    if (!currentUser?.branchId) return [];
    return getBranchVendors(currentUser.branchId);
  }, [currentUser, getBranchVendors]);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [tripFilter, setTripFilter] = useState<'all' | '1st' | '2nd'>('all');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');

  const [dateFilterMode, setDateFilterMode] = useState('today');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FormEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<FormEntry>>({});

  // CO Apply state
  const [selectedVendor, setSelectedVendor] = useState('');

  /* =====================
     Dynamic Date Options
  ===================== */

  const dateOptions = useMemo(() => {
    const today = new Date();

    const dates = [0, 1, 2].map((offset) => {
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      return d;
    });

    const options = ['today', ...dates.slice(1).map(d => getDateKey(d))];

    const labels: Record<string, string> = {
      today: 'Today',
    };

    dates.slice(1).forEach((d) => {
      labels[getDateKey(d)] = getLabel(d);
    });

    return { options, labels };
  }, []);

  /* =====================
     Filter + Sort
  ===================== */

  const filteredEntries = useMemo(() => {
    let result = [...branchEntries];

    /* Search */
    if (searchQuery) {
      result = result.filter((e) =>
        e.carNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    /* Vendor filter */
    if (vendorFilter !== 'all') {
      const selectedVendor = branchVendors.find(v => v.id === vendorFilter);
      if (selectedVendor) {
        result = result.filter((e) => e.coVendor === selectedVendor.name);
      }
    }

    /* Trip filter */
    if (tripFilter !== 'all') {
      result = result.filter((e) => e.trip === tripFilter);
    }

    /* DATE FILTER */
    if (dateFrom || dateTo) {
      result = result.filter((e) => {
        const time = new Date(e.dateTime).getTime();

        const fromOk = dateFrom
          ? time >= new Date(dateFrom).setHours(0, 0, 0, 0)
          : true;

        const toOk = dateTo
          ? time <= new Date(dateTo).setHours(23, 59, 59, 999)
          : true;

        return fromOk && toOk;
      });
    }
    else if (dateFilterMode === 'today') {
      const todayKey = getDateKey(new Date());
      result = result.filter(
        (e) => getDateKey(new Date(e.dateTime)) === todayKey
      );
    }
    else {
      result = result.filter(
        (e) => getDateKey(new Date(e.dateTime)) === dateFilterMode
      );
    }

    /* Sort */
    result.sort((a, b) => {
      const aTime = new Date(a.dateTime).getTime();
      const bTime = new Date(b.dateTime).getTime();
      return sortOrder === 'latest' ? bTime - aTime : aTime - bTime;
    });

    return result;
  }, [
    branchEntries,
    searchQuery,
    vendorFilter,
    branchVendors,
    tripFilter,
    sortOrder,
    dateFilterMode,
    dateFrom,
    dateTo,
  ]);

  /* =====================
     Stats
  ===================== */

  const stats = useMemo(() => {
    const totalCft = filteredEntries.reduce((s, e) => s + e.cft, 0);
    const coAppliedCount = filteredEntries.filter((e) => e.coApplied).length;

    return {
      totalEntries: filteredEntries.length,
      totalCft,
      coAppliedCount,
      vendorCount: branchVendors.length,
    };
  }, [filteredEntries, branchVendors]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  const clearFilters = () => {
    setSearchQuery('');
    setTripFilter('all');
    setVendorFilter('all');
    setDateFrom('');
    setDateTo('');
    setDateFilterMode('today');
  };

  const getPdfDateTitle = () => {
    if (dateFrom && dateTo) {
      return `${format(new Date(dateFrom), 'dd MMM yyyy')} – ${format(
        new Date(dateTo),
        'dd MMM yyyy'
      )}`;
    }

    if (dateFrom && !dateTo) {
      return format(new Date(dateFrom), 'dd MMM yyyy');
    }

    if (dateFilterMode === 'today') {
      return format(new Date(), 'dd MMM yyyy');
    }

    return format(new Date(dateFilterMode), 'dd MMM yyyy');
  };

  const drawHeader = (doc: jsPDF) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;

    doc.setFillColor(33, 37, 41);
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(COMPANY.name, margin, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('DAILY TRANSPORT SHEET', pageWidth - margin, 14, {
      align: 'right',
    });
    doc.text(`Date : ${getPdfDateTitle()}`, pageWidth - margin, 22, {
      align: 'right',
    });

    doc.setTextColor(0);
  };

  const exportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;

    drawHeader(doc);

    // Always export with oldest first
    const sortedForExport = [...filteredEntries].sort((a, b) => {
      const aTime = new Date(a.dateTime).getTime();
      const bTime = new Date(b.dateTime).getTime();
      return aTime - bTime; // oldest first
    });

    const tableData = sortedForExport.map((e) => {
      // Format cost values - show empty if not set
      const formatCost = (value: number | undefined) => {
        return value && value > 0 ? `₹${value}` : '-';
      };

      return [
        e.slNo,
        e.carNumber,
        e.wheels,
        e.cft,
        formatCost(e.cost), // Cost
        formatCost(e.cash), // Cash
        formatCost(e.upi),  // UPI
        e.trip === '2nd' ? '2nd Trip' : '1st Trip',
        e.remark || '-',
      ];
    });

    // Calculate totals
    const totalCft = sortedForExport.reduce((s, e) => s + (e.cft || 0), 0);
    const totalCost = sortedForExport.reduce((s, e) => s + (e.cost || 0), 0);
    const totalCash = sortedForExport.reduce((s, e) => s + (e.cash || 0), 0);
    const totalUpi = sortedForExport.reduce((s, e) => s + (e.upi || 0), 0);

    // Format totals - show only if > 0
    const formatTotal = (value: number) => {
      return value > 0 ? `₹${value}` : '-';
    };

    // Add total row
    tableData.push([
      '',
      'TOTAL',
      '',
      totalCft,
      formatTotal(totalCost),
      formatTotal(totalCash),
      formatTotal(totalUpi),
      '',
      '',
    ]);

    autoTable(doc, {
      startY: 36,
      tableWidth: pageWidth - margin * 2,
      margin: { left: margin, right: margin, top: 36 },
      theme: 'grid',

      head: [[
        'Sl',
        'Vehicle No',
        'Wheel',
        'CFT',
        'Cost',
        'Cash',
        'Upi',
        'Trip',
        'Remarks',
      ]],

      body: tableData,

      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: 'middle',
      },

      headStyles: {
        fillColor: [220, 220, 220],
        textColor: 0,
        fontStyle: 'bold',
      },

      didParseCell(data) {
        const row = data.row.raw as (string | number)[];

        // Highlight 2nd trip rows
        if (row && row[7] === '2nd Trip' && data.section === 'body') {
          data.cell.styles.fillColor = [255, 243, 205];
        }

        // Style total row
        if (row && row[1] === 'TOTAL') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [230, 230, 230];
        }
      },

      didDrawPage: () => {
        drawHeader(doc);
      },

      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 28 },
        2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 18 },
        5: { halign: 'right', cellWidth: 18 },
        6: { halign: 'right', cellWidth: 18 },
        7: { halign: 'center', cellWidth: 20 },
        8: { cellWidth: 30 },
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`daily-sheet-${getPdfDateTitle().replace(/ /g, '-')}.pdf`);
  };

  const handleApplyCO = () => {
    if (!selectedEntry || !selectedVendor) return;

    applyForCO(selectedEntry.id, selectedVendor);
    toast({
      title: 'CO Applied',
      description: `CO applied successfully for ${selectedEntry.carNumber}`,
    });
    // Update local state
    setSelectedEntry((prev) => prev ? { ...prev, coApplied: true, coVendor: selectedVendor, coAppliedAt: new Date().toISOString() } : null);
    setSelectedVendor('');
  };

  const handleReprintGhatSlip = (entry: FormEntry) => {
    generateGhatSlipPDF(
      {
        slNo: entry.slNo,
        dateTime: entry.dateTime,
        carNumber: entry.carNumber,
        name: entry.name,
        phoneNumber: entry.phoneNumber,
        location: entry.location,
        wheels: entry.wheels,
        cft: entry.cft,
        remark: entry.remark,
        cost: 0,
        cash: 0,
        upi: 0,
        branch: branch ? branch.name : 'Main Branch',
      },
      2
    );
    toast({
      title: 'Printing',
      description: 'Ghat slip sent to printer',
    });
  };

  const handleDownloadCO = (entry: FormEntry) => {
    if (entry.coPdfUrl) {
      window.open(entry.coPdfUrl, '_blank');
    }
  };

  const openEditMode = () => {
    if (selectedEntry) {
      setEditData({
        name: selectedEntry.name,
        phoneNumber: selectedEntry.phoneNumber,
        location: selectedEntry.location,
        carNumber: selectedEntry.carNumber,
        wheels: selectedEntry.wheels,
        cft: selectedEntry.cft,
        remark: selectedEntry.remark,
      });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (selectedEntry && editData) {
      updateEntry(selectedEntry.id, editData);
      setSelectedEntry((prev) => prev ? { ...prev, ...editData } : null);
      setIsEditing(false);
      toast({
        title: 'Updated',
        description: 'Entry updated successfully',
      });
    }
  };

  const closeDialog = () => {
    setSelectedEntry(null);
    setIsEditing(false);
    setEditData({});
    setSelectedVendor('');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Truck} label="Total Entries" value={stats.totalEntries} color="bg-primary/10 text-primary" />
          <StatCard icon={Car} label="Total CFT" value={stats.totalCft} color="bg-blue-500/10 text-blue-500" />
          <StatCard icon={FileCheck} label="CO Applied" value={stats.coAppliedCount} color="bg-green-500/10 text-green-500" />
          <StatCard icon={Users} label="Vendors" value={stats.vendorCount} color="bg-purple-500/10 text-purple-500" />
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
                placeholder="Search car number..."
                className="w-full rounded-xl border bg-secondary/50 py-2.5 pl-10 pr-4 text-sm"
              />
            </div>

            {/* Dynamic Date Filter */}
            <FilterGroup
              value={dateFilterMode}
              onChange={(val: string) => {
                setDateFrom('');
                setDateTo('');
                setDateFilterMode(val);
              }}
              options={dateOptions.options}
              labels={dateOptions.labels}
            />

            {/* Vendor Filter */}
            <div>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {branchVendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trip Filter */}
            <div>
              <Select value={tripFilter} onValueChange={(value: 'all' | '1st' | '2nd') => setTripFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select Trip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trips</SelectItem>
                  <SelectItem value="1st">1st Trip</SelectItem>
                  <SelectItem value="2nd">2nd Trip</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSortOrder(sortOrder === 'latest' ? 'oldest' : 'latest')
              }
            >
              {sortOrder === 'latest' ? 'Latest First' : 'Oldest First'}
            </Button>

            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {showFilters ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
            </Button>

            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
            <Button variant="default" size="sm" onClick={exportPDF}>
              Export PDF
            </Button>
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 flex flex-wrap items-end gap-4 border-t border-border/30 pt-4"
              >
                {/* From Date */}
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">From Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(new Date(dateFrom), 'dd MMM yyyy') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom ? new Date(dateFrom) : undefined}
                        onSelect={(date) => {
                          setDateFilterMode('today');
                          setDateFrom(date ? getDateKey(date) : '');
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* To Date */}
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">To Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(new Date(dateTo), 'dd MMM yyyy') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo ? new Date(dateTo) : undefined}
                        onSelect={(date) => {
                          setDateFilterMode('today');
                          setDateTo(date ? getDateKey(date) : '');
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Table / Cards */}
        <div className="glass-card overflow-hidden">
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Truck className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No entries found</p>
              <p className="text-sm text-muted-foreground">
                {branchEntries.length === 0
                  ? 'Start adding data from the Entry Form'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/30 bg-secondary/30">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Sl No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date/Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Car Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Trip</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Wheels</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">CFT</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">CO Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry, index) => {
                      const coStatus = getCOStatus(entry);
                      return (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={cn(
                            'border-b border-border/20 transition-colors hover:bg-secondary/30',
                            entry.trip === '2nd' && 'bg-primary/5'
                          )}
                        >
                          <td className="px-4 py-3 text-sm font-medium">{entry.slNo}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDate(entry.dateTime)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium uppercase">{entry.carNumber}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-medium',
                              entry.trip === '1st' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'
                            )}>
                              {entry.trip}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{entry.wheels}</td>
                          <td className="px-4 py-3 text-sm">{entry.cft}</td>
                          <td className="px-4 py-3">
                            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', coStatus.color)}>
                              {coStatus.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEntry(entry)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 p-4 md:hidden">
                {filteredEntries.map((entry, index) => {
                  const coStatus = getCOStatus(entry);
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        'rounded-xl border border-border/30 bg-secondary/30 p-4 transition-all',
                        entry.trip === '2nd' && 'border-l-2 border-l-primary bg-primary/5'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">#{entry.slNo}</span>
                          <span className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            entry.trip === '1st' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'
                          )}>
                            {entry.trip} Trip
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(entry.dateTime)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium uppercase">{entry.carNumber}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {entry.wheels} wheels • {entry.cft} CFT
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', coStatus.color)}>
                          {coStatus.label}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEntry(entry)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* View/Edit Dialog */}
        <Dialog open={!!selectedEntry} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {isEditing ? 'Edit Entry' : 'Entry Details'}
                {selectedEntry?.trip === '2nd' && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    2nd Trip
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            {selectedEntry && (
              <div className="space-y-4">
                {isEditing ? (
                  // Edit Mode
                  <>
                    <FloatingInput
                      label="Car Number"
                      value={editData.carNumber || ''}
                      onChange={(e) => setEditData({ ...editData, carNumber: e.target.value })}
                      className='uppercase'
                    />
                    <FloatingInput
                      label="Name"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                    <FloatingInput
                      label="Phone Number"
                      value={editData.phoneNumber || ''}
                      onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                    />
                    <FloatingInput
                      label="Location"
                      value={editData.location || ''}
                      onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FloatingInput
                        label="Wheels"
                        type="number"
                        value={String(editData.wheels || '')}
                        onChange={(e) => setEditData({ ...editData, wheels: Number(e.target.value) })}
                      />
                      <FloatingInput
                        label="CFT"
                        type="number"
                        value={String(editData.cft || '')}
                        onChange={(e) => setEditData({ ...editData, cft: Number(e.target.value) })}
                      />
                    </div>
                    <FloatingInput
                      label="Remark"
                      value={editData.remark || ''}
                      onChange={(e) => setEditData({ ...editData, remark: e.target.value })}
                    />

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button className="flex-1" onClick={handleSaveEdit}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </>
                ) : (
                  // View Mode
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-secondary/50 p-3">
                        <p className="text-xs text-muted-foreground">Sl No</p>
                        <p className="text-lg font-bold">{selectedEntry.slNo}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/50 p-3">
                        <p className="text-xs text-muted-foreground">Date/Time</p>
                        <p className="text-sm font-medium">
                          {new Date(selectedEntry.dateTime).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground uppercase">Car Number</p>
                      <p className="text-lg font-bold">{selectedEntry.carNumber}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-secondary/50 p-3">
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="font-medium">{selectedEntry.name}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/50 p-3">
                        <p className="text-xs text-muted-foreground">Phone Number</p>
                        <p className="font-medium">{selectedEntry.phoneNumber}</p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-medium">{selectedEntry.location}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-secondary/50 p-3">
                        <p className="text-xs text-muted-foreground">Wheels</p>
                        <p className="text-lg font-bold">{selectedEntry.wheels}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/50 p-3">
                        <p className="text-xs text-muted-foreground">CFT</p>
                        <p className="text-lg font-bold">{selectedEntry.cft}</p>
                      </div>
                    </div>

                    {/* CO Status Section */}
                    <div className="rounded-lg border border-border/50 p-3">
                      <p className="mb-2 text-xs text-muted-foreground">CO Status</p>
                      {(() => {
                        const coStatus = getCOStatus(selectedEntry);
                        return (
                          <div className="flex items-center justify-between">
                            <span className={cn('rounded-full px-3 py-1 text-sm font-medium', coStatus.color)}>
                              {coStatus.label}
                            </span>
                            {selectedEntry.coPdfUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadCO(selectedEntry)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download CO
                              </Button>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Apply CO Section - only show if not applied */}
                    {!selectedEntry.coApplied && branchVendors.length > 0 && (
                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                        <p className="mb-2 text-sm font-medium">Apply for CO</p>
                        <div className="flex gap-2">
                          <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select vendor" />
                            </SelectTrigger>
                            <SelectContent>
                              {branchVendors.map((vendor) => (
                                <SelectItem key={vendor.id} value={vendor.name}>
                                  {vendor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button onClick={handleApplyCO} disabled={!selectedVendor}>
                            Apply CO
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedEntry.remark && (
                      <div className="rounded-lg bg-secondary/50 p-3">
                        <p className="text-xs text-muted-foreground">Remark</p>
                        <p className="font-medium">{selectedEntry.remark}</p>
                      </div>
                    )}

                    {selectedEntry.policeStations && selectedEntry.policeStations.length > 0 && (
                      <div className="rounded-lg bg-secondary/50 p-3">
                        <p className="text-xs text-muted-foreground">Police Stations</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedEntry.policeStations.map((station) => (
                            <span
                              key={station}
                              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                            >
                              {station}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons - Only show if no CO PDF */}
                    {!selectedEntry.coPdfUrl && (
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={openEditMode}>
                          Edit Entry
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleReprintGhatSlip(selectedEntry)}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Reprint Slip
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

/* =====================
   Small Components
===================== */

const FilterGroup = ({ value, onChange, options, labels }: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  labels: Record<string, string>;
}) => (
  <div className="flex rounded-xl border border-border/50 bg-secondary/30 p-1">
    {options.map((o: string) => (
      <button
        key={o}
        onClick={() => onChange(o)}
        className={cn(
          'rounded-lg px-3 py-1.5 text-xs',
          value === o
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground'
        )}
      >
        {labels[o]}
      </button>
    ))}
  </div>
);

const StatCard = ({ icon: Icon, label, value, color }: {
  icon: typeof Truck;
  label: string;
  value: string | number;
  color: string;
}) => (
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

export default Dashboard;