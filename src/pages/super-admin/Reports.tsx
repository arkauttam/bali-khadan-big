import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Building2, Filter } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { RoleLayout } from '@/components/layouts/RoleLayout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReportsPage = () => {
  const { currentUser, entries, branches, getBranchById } = useStore();
  const { toast } = useToast();
  
  const [branchFilter, setBranchFilter] = useState('all');
  const [tripFilter, setTripFilter] = useState<'all' | '1st' | '2nd'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const assignedBranches = useMemo(() => {
    if (!currentUser?.assignedBranchIds) return [];
    return branches.filter((b) => currentUser.assignedBranchIds?.includes(b.id));
  }, [branches, currentUser]);

  const filteredEntries = useMemo(() => {
    let result = entries.filter((e) => currentUser?.assignedBranchIds?.includes(e.branchId));

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

    return result.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [entries, currentUser, branchFilter, tripFilter, dateFrom, dateTo]);

  const totals = useMemo(() => ({
    entries: filteredEntries.length,
    cft: filteredEntries.reduce((sum, e) => sum + e.cft, 0),
    cost: filteredEntries.reduce((sum, e) => sum + e.cost, 0),
    cash: filteredEntries.reduce((sum, e) => sum + e.cash, 0),
    upi: filteredEntries.reduce((sum, e) => sum + e.upi, 0),
  }), [filteredEntries]);

  const downloadCSV = () => {
    const headers = ['Sl No', 'Branch', 'Date', 'Car Number', 'Name', 'Phone', 'Vendor', 'Trip', 'Wheels', 'CFT', 'Cost', 'Cash', 'UPI'];
    const rows = filteredEntries.map((e) => [
      e.slNo,
      getBranchById(e.branchId)?.name || '',
      new Date(e.dateTime).toLocaleDateString(),
      e.carNumber,
      e.name,
      e.phoneNumber,
      e.vendor,
      e.trip,
      e.wheels,
      e.cft,
      e.cost,
      e.cash,
      e.upi,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      '',
      `Total Entries,${totals.entries}`,
      `Total CFT,${totals.cft}`,
      `Total Cost,${totals.cost}`,
      `Total Cash,${totals.cash}`,
      `Total UPI,${totals.upi}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transport-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'CSV Downloaded',
      description: 'Report has been exported successfully',
    });
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 212, 255);
    doc.text('TransportPro Report', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    
    // Filters applied
    const filterText = [];
    if (branchFilter !== 'all') {
      filterText.push(`Branch: ${getBranchById(branchFilter)?.name}`);
    }
    if (tripFilter !== 'all') {
      filterText.push(`Trip: ${tripFilter}`);
    }
    if (dateFrom) filterText.push(`From: ${dateFrom}`);
    if (dateTo) filterText.push(`To: ${dateTo}`);
    
    if (filterText.length > 0) {
      doc.text(`Filters: ${filterText.join(' | ')}`, 14, 38);
    }

    // Table
    autoTable(doc, {
      startY: 45,
      head: [['Sl', 'Branch', 'Date', 'Car No', 'Name', 'Trip', 'CFT', 'Cost', 'Cash', 'UPI']],
      body: filteredEntries.map((e) => [
        e.slNo,
        getBranchById(e.branchId)?.name || '',
        new Date(e.dateTime).toLocaleDateString(),
        e.carNumber,
        e.name,
        e.trip,
        e.cft,
        `₹${e.cost}`,
        `₹${e.cash}`,
        `₹${e.upi}`,
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 150, 180] },
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary', 14, finalY);
    doc.setFontSize(10);
    doc.text(`Total Entries: ${totals.entries}`, 14, finalY + 8);
    doc.text(`Total CFT: ${totals.cft.toLocaleString()}`, 14, finalY + 14);
    doc.text(`Total Cost: ₹${totals.cost.toLocaleString()}`, 14, finalY + 20);
    doc.text(`Total Cash: ₹${totals.cash.toLocaleString()}`, 14, finalY + 26);
    doc.text(`Total UPI: ₹${totals.upi.toLocaleString()}`, 14, finalY + 32);

    doc.save(`transport-report-${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: 'PDF Downloaded',
      description: 'Report has been exported successfully',
    });
  };

  return (
    <RoleLayout allowedRoles={['super-admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-sm text-muted-foreground">
              Generate and download reports
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV} className="gap-2">
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button onClick={downloadPDF} className="gap-2">
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Report Filters</h3>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Branch</label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger>
                  <Building2 className="mr-2 h-4 w-4" />
                  <SelectValue />
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
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Trip Type</label>
              <Select value={tripFilter} onValueChange={(v) => setTripFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trips</SelectItem>
                  <SelectItem value="1st">1st Trip</SelectItem>
                  <SelectItem value="2nd">2nd Trip</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        </motion.div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Entries', value: totals.entries },
            { label: 'Total CFT', value: totals.cft.toLocaleString() },
            { label: 'Total Cost', value: `₹${totals.cost.toLocaleString()}` },
            { label: 'Total Cash', value: `₹${totals.cash.toLocaleString()}` },
            { label: 'Total UPI', value: `₹${totals.upi.toLocaleString()}` },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4 text-center"
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Preview Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card overflow-hidden"
        >
          <div className="p-6 pb-0">
            <h3 className="font-semibold">Preview ({filteredEntries.length} entries)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30 bg-secondary/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Sl</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Branch</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Car No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Trip</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">CFT</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Cost</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.slice(0, 10).map((entry) => (
                  <tr key={entry.id} className="border-b border-border/20 transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3 text-sm">{entry.slNo}</td>
                    <td className="px-4 py-3 text-sm">{getBranchById(entry.branchId)?.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(entry.dateTime).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{entry.carNumber}</td>
                    <td className="px-4 py-3 text-sm">{entry.trip}</td>
                    <td className="px-4 py-3 text-sm">{entry.cft}</td>
                    <td className="px-4 py-3 text-sm font-medium text-success">₹{entry.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEntries.length > 10 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Showing 10 of {filteredEntries.length} entries. Download to see all.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </RoleLayout>
  );
};

export default ReportsPage;
