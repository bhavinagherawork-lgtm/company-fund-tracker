import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid2 as Grid,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CloseIcon from '@mui/icons-material/Close';
import TableChartIcon from '@mui/icons-material/TableChart';
import DateRangeIcon from '@mui/icons-material/DateRange';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PaymentsIcon from '@mui/icons-material/Payments';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import TableRowsIcon from '@mui/icons-material/TableRows';
import RestoreIcon from '@mui/icons-material/Restore';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  format,
  parseISO,
} from 'date-fns';
import { getExpenses, deleteExpense, voidExpense, unvoidExpense } from '../services/expenseService';
import { getCategories } from '../services/categoryService';
import { getDayWiseExpenses } from '../services/reportService';
import { importGoogleSheetCSV } from '../services/importService';
import { downloadExcelReport } from '../services/excelService';
import { AddExpenseDialog } from '../components/AddExpenseDialog';
import { useOffice } from '../context/OfficeContext';
import type { ExpenseRecord, ExpenseCategory, DailyExpenseSummary } from '../types';
import { formatINR, toPaise, fromPaise } from '../utils/currency';
import { formatDate } from '../utils/formatters';

export const ExpensesPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0); // 0: Day-Wise View, 1: All Records Table
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [dayWiseList, setDayWiseList] = useState<DailyExpenseSummary[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Day-wise grouped expand/collapse state
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
  const [allCollapsed, setAllCollapsed] = useState(false);

  // Day-wise Pagination & View Design Style
  const [dayPage, setDayPage] = useState(0);
  const [daysPerPage, setDaysPerPage] = useState(10); // 5, 7, 10, 14, 30 days
  const [dayViewStyle, setDayViewStyle] = useState<'cards' | 'compact'>('cards');

  const toggleDay = (date: string) => {
    setCollapsedDays((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const handleToggleAllDays = () => {
    const next = !allCollapsed;
    setAllCollapsed(next);
    const updated: Record<string, boolean> = {};
    filteredDayWiseList.forEach((d) => {
      updated[d.date] = next;
    });
    setCollapsedDays(updated);
  };

  // Office Context
  const { offices, selectedOfficeId } = useOffice();
  const [officeFilter, setOfficeFilter] = useState<string>(String(selectedOfficeId));

  useEffect(() => {
    setOfficeFilter(String(selectedOfficeId));
    setDayPage(0);
  }, [selectedOfficeId]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');

  // Date & Week Filter State
  const [periodPreset, setPeriodPreset] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination for table
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals
  const [openAddModal, setOpenAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [viewDetailModal, setViewDetailModal] = useState<ExpenseRecord | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<{ title: string; dataUrl: string } | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handlePeriodChange = (val: string) => {
    setPeriodPreset(val);
    setDayPage(0);
    const now = new Date();
    if (val === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (val === 'THIS_WEEK') {
      setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    } else if (val === 'LAST_WEEK') {
      const prev = subWeeks(now, 1);
      setStartDate(format(startOfWeek(prev, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(prev, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    } else if (val === 'THIS_MONTH') {
      setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
    } else if (val === 'LAST_MONTH') {
      const prev = subMonths(now, 1);
      setStartDate(format(startOfMonth(prev), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(prev), 'yyyy-MM-dd'));
    }
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setPeriodPreset('CUSTOM');
    setDayPage(0);
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setPeriodPreset('CUSTOM');
    setDayPage(0);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('ALL');
    setOfficeFilter('ALL');
    setPaymentModeFilter('ALL');
    setPeriodPreset('ALL');
    setStartDate('');
    setEndDate('');
    setPage(0);
    setDayPage(0);
  };

  const handleExportExcel = async () => {
    try {
      let periodLabel = 'Day-Wise Operating Expenses';
      if (periodPreset === 'THIS_WEEK') periodLabel = 'This Week (Mon–Sun)';
      else if (periodPreset === 'LAST_WEEK') periodLabel = 'Last Week';
      else if (periodPreset === 'THIS_MONTH') periodLabel = 'This Month';
      else if (periodPreset === 'LAST_MONTH') periodLabel = 'Last Month';
      else if (startDate || endDate) periodLabel = `Period: ${startDate || 'Start'} to ${endDate || 'Latest'}`;

      await downloadExcelReport({
        title: 'Company Expenses - Audited Records',
        periodLabel,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        officeId: officeFilter !== 'ALL' ? Number(officeFilter) : undefined,
        filename: `ExpenseFlow_Expenses_${periodPreset !== 'ALL' ? periodPreset : 'All'}.xlsx`,
      });
      setImportStatus('2-Sheet Excel file exported successfully (OverAll & Details with Day-Wise Opening Balance)!');
    } catch (err: any) {
      setImportStatus(`Export failed: ${err.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = await importGoogleSheetCSV(text);
      setImportStatus(`Successfully imported ${result.expensesAdded} expenses and ${result.incomesAdded} fund entries from ${file.name}!`);
      await loadData();
    } catch (err) {
      console.error(err);
      setImportStatus('Error importing CSV file. Please make sure format matches Google Sheets export.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allExp, dayList, cats] = await Promise.all([
        getExpenses(),
        getDayWiseExpenses(),
        getCategories(),
      ]);
      setExpenses(allExp);
      setDayWiseList(dayList);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered expenses based on Date, Week, Category, Office, Payment Mode, Search
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      if (officeFilter !== 'ALL' && item.officeId !== Number(officeFilter)) return false;
      if (categoryFilter !== 'ALL' && item.categoryId !== Number(categoryFilter)) return false;
      if (paymentModeFilter !== 'ALL' && item.paymentMode !== paymentModeFilter) return false;
      if (startDate && item.expenseDate < startDate) return false;
      if (endDate && item.expenseDate > endDate) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mTitle = item.expenseTitle.toLowerCase().includes(q);
        const mVendor = item.vendor?.toLowerCase().includes(q) || false;
        const mCat = item.categoryName?.toLowerCase().includes(q) || false;
        const mOffice = item.officeName?.toLowerCase().includes(q) || false;
        const mBill = item.billNumber?.toLowerCase().includes(q) || false;
        const mDesc = item.description?.toLowerCase().includes(q) || false;
        const mAmt = item.amount.toString().includes(q);
        if (!mTitle && !mVendor && !mCat && !mOffice && !mBill && !mDesc && !mAmt) return false;
      }
      return true;
    });
  }, [expenses, officeFilter, categoryFilter, paymentModeFilter, startDate, endDate, searchTerm]);

  // Filtered day-wise list for Accordion view
  const filteredDayWiseList = useMemo(() => {
    return dayWiseList
      .filter((dayGroup) => {
        if (startDate && dayGroup.date < startDate) return false;
        if (endDate && dayGroup.date > endDate) return false;
        return true;
      })
      .map((dayGroup) => {
        const matched = dayGroup.expenses.filter((item) => {
          if (officeFilter !== 'ALL' && item.officeId !== Number(officeFilter)) return false;
          if (categoryFilter !== 'ALL' && item.categoryId !== Number(categoryFilter)) return false;
          if (paymentModeFilter !== 'ALL' && item.paymentMode !== paymentModeFilter) return false;
          if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            const mTitle = item.expenseTitle.toLowerCase().includes(q);
            const mVendor = item.vendor?.toLowerCase().includes(q) || false;
            const mCat = item.categoryName?.toLowerCase().includes(q) || false;
            const mOffice = item.officeName?.toLowerCase().includes(q) || false;
            const mBill = item.billNumber?.toLowerCase().includes(q) || false;
            const mDesc = item.description?.toLowerCase().includes(q) || false;
            const mAmt = item.amount.toString().includes(q);
            if (!mTitle && !mVendor && !mCat && !mOffice && !mBill && !mDesc && !mAmt) return false;
          }
          return true;
        });

        const totalPaise = matched
          .filter((e) => e.status === 'Completed')
          .reduce((acc, e) => acc + toPaise(e.amount), 0);
        return {
          ...dayGroup,
          totalAmount: fromPaise(totalPaise),
          expenseCount: matched.length,
          expenses: matched,
        };
      })
      .filter((dayGroup) => dayGroup.expenses.length > 0);
  }, [dayWiseList, startDate, endDate, categoryFilter, paymentModeFilter, searchTerm]);

  // Paginated Day-Wise list
  const paginatedDayWiseList = useMemo(() => {
    const start = dayPage * daysPerPage;
    return filteredDayWiseList.slice(start, start + daysPerPage);
  }, [filteredDayWiseList, dayPage, daysPerPage]);

  const categoryMap = useMemo(() => {
    const map = new Map<number, ExpenseCategory>();
    categories.forEach((c) => {
      if (c.id !== undefined) map.set(c.id, c);
    });
    return map;
  }, [categories]);

  // Dynamically calculate KPIs based on filtered expenses
  const totalCompleted = useMemo(() => {
    return fromPaise(
      filteredExpenses
        .filter((e) => e.status === 'Completed')
        .reduce((acc, e) => acc + toPaise(e.amount), 0)
    );
  }, [filteredExpenses]);

  const totalFilteredActiveDays = useMemo(() => {
    const dates = new Set(filteredExpenses.map((e) => e.expenseDate));
    return dates.size;
  }, [filteredExpenses]);

  const handleToggleVoid = async (exp: ExpenseRecord) => {
    if (!exp.id) return;
    const isVoided = exp.status === 'Void';
    if (isVoided) {
      if (window.confirm(`Unvoid / Restore expense "${exp.expenseTitle}"? It will be re-included in total calculations.`)) {
        await unvoidExpense(exp.id);
        loadData();
      }
    } else {
      if (window.confirm(`Voiding expense "${exp.expenseTitle}" will exclude it from calculations. Proceed?`)) {
        await voidExpense(exp.id);
        loadData();
      }
    }
  };

  const handleVoid = async (id?: number) => {
    if (!id) return;
    const found = expenses.find(e => e.id === id);
    if (found) {
      await handleToggleVoid(found);
    } else {
      if (window.confirm('Voiding this expense will exclude it from calculations. Proceed?')) {
        await voidExpense(id);
        loadData();
      }
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to permanently delete this expense?')) {
      await deleteExpense(id);
      loadData();
    }
  };

  return (
    <Box sx={{ pb: 3 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontFamily: '"Space Grotesk", sans-serif', letterSpacing: "-0.02em" }}>
            Day-Wise Expenses
          </Typography>
          <Typography variant="caption" sx={{ color: '#5b616e', fontSize: '0.72rem' }}>
            Log daily expenditures, filter by date/week, categorize bills, and track balances
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<UploadFileIcon sx={{ fontSize: 16 }} />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ fontWeight: 700, borderRadius: '9999px', borderColor: '#e2e8f0', color: '#0f172a', height: 30, px: 1.2, fontSize: '0.75rem', '&:hover': { borderColor: '#2563eb', bgcolor: '#f8fafc' } }}
          >
            Import CSV
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<TableChartIcon sx={{ fontSize: 16 }} />}
            onClick={handleExportExcel}
            sx={{
              fontWeight: 700,
              borderRadius: '9999px',
              borderColor: '#22c55e',
              color: '#22c55e',
              height: 30,
              px: 1.2,
              fontSize: '0.75rem',
              '&:hover': { borderColor: '#22c55e', bgcolor: '#f0fdf4' }
            }}
          >
            Export 2-Sheet Excel
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              setEditingExpense(null);
              setOpenAddModal(true);
            }}
            sx={{
              fontWeight: 700,
              px: 1.5,
              borderRadius: '9999px',
              bgcolor: '#2563eb',
              color: '#ffffff',
              height: 30,
              fontSize: '0.75rem',
              '&:hover': { bgcolor: '#1d4ed8', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }
            }}
          >
            Record Expense
          </Button>
        </Box>
      </Box>

      {importStatus && (
        <Alert severity="success" onClose={() => setImportStatus(null)} sx={{ mb: 1.8, borderRadius: '9999px', py: 0.5, fontSize: '0.8rem' }}>
          {importStatus}
        </Alert>
      )}

      {/* KPI Cards (Dynamically Filtered - 60-30-10 Highlighter Rule) */}
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ border: '1px solid #e4e4e7', borderRadius: '12px' }}>
            <CardContent sx={{ p: '8px 12px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 700, fontSize: '0.66rem', textTransform: 'uppercase' }}>
                    Total Posted Expenses {periodPreset !== 'ALL' && '(Filtered)'}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#ef4444', mt: 0.2, fontFamily: "Space Mono, monospace", fontSize: '1.15rem' }}>
                    {formatINR(totalCompleted)}
                  </Typography>
                </Box>
                <Box sx={{ p: 0.6, bgcolor: '#fef2f2', borderRadius: '8px' }}>
                  <TrendingDownIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mt: 0.4, fontSize: '0.68rem' }}>
                Operational deductions in selected scope
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ border: '1px solid #e4e4e7', borderRadius: '12px' }}>
            <CardContent sx={{ p: '8px 12px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.66rem', textTransform: 'uppercase' }}>
                    Active Expense Days
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.2, fontFamily: "Space Mono, monospace", fontSize: '1.15rem' }}>
                    {totalFilteredActiveDays} Days
                  </Typography>
                </Box>
                <Box sx={{ p: 0.6, bgcolor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <CalendarMonthIcon sx={{ color: '#2563eb', fontSize: 18 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mt: 0.4, fontSize: '0.68rem' }}>
                Calendar days with matching expenses
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ border: '1px solid #e4e4e7', borderRadius: '12px' }}>
            <CardContent sx={{ p: '8px 12px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 700, fontSize: '0.66rem', textTransform: 'uppercase' }}>
                    Matching Transactions
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#22c55e', mt: 0.2, fontFamily: "Space Mono, monospace", fontSize: '1.15rem' }}>
                    {filteredExpenses.length} Records
                  </Typography>
                </Box>
                <Box sx={{ p: 0.6, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e4e4e7' }}>
                  <ReceiptLongIcon sx={{ color: '#22c55e', fontSize: 18 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#5b616e', display: 'block', mt: 0.4, fontSize: '0.68rem' }}>
                Audited expense vouchers in scope
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* UNIFIED DATE, WEEK & CATEGORY FILTER BAR */}
      <Card sx={{ mb: 1.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: '8px 12px !important' }}>
          <Grid container spacing={1.2} sx={{ alignItems: 'center' }}>
            {/* 1. Search Box */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                placeholder="Search title, vendor, bill #..."
                fullWidth
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#a1a1aa', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            {/* 2. Date & Week Preset */}
            <Grid size={{ xs: 12, sm: 6, md: 2.3 }}>
              <TextField
                select
                label="Date & Week Filter"
                fullWidth
                size="small"
                value={periodPreset}
                onChange={(e) => handlePeriodChange(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateRangeIcon sx={{ color: '#2563eb', fontSize: 17 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              >
                <MenuItem value="ALL">All Recorded Dates</MenuItem>
                <MenuItem value="THIS_WEEK">This Week (Mon–Sun)</MenuItem>
                <MenuItem value="LAST_WEEK">Last Week</MenuItem>
                <MenuItem value="THIS_MONTH">This Month</MenuItem>
                <MenuItem value="LAST_MONTH">Last Month</MenuItem>
                <MenuItem value="CUSTOM">Custom Date Range...</MenuItem>
              </TextField>
            </Grid>

            {/* 3. From Date */}
            <Grid size={{ xs: 6, sm: 3, md: 1.7 }}>
              <TextField
                label="From Date"
                type="date"
                fullWidth
                size="small"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            {/* 4. To Date */}
            <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
              <TextField
                label="To Date"
                type="date"
                fullWidth
                size="small"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            {/* 5. Office / Branch */}
            <Grid size={{ xs: 6, sm: 3, md: 1.8 }}>
              <TextField
                select
                label="Office / Branch"
                fullWidth
                size="small"
                value={officeFilter}
                onChange={(e) => {
                  setOfficeFilter(e.target.value);
                  setDayPage(0);
                }}
              >
                <MenuItem value="ALL">All Offices</MenuItem>
                {offices.map((off) => (
                  <MenuItem key={off.id} value={String(off.id)}>
                    {off.name} ({off.code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* 6. Category */}
            <Grid size={{ xs: 6, sm: 3, md: 1.8 }}>
              <TextField
                select
                label="Category"
                fullWidth
                size="small"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Categories</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* 7. Payment Mode */}
            <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
              <TextField
                select
                label="Mode"
                fullWidth
                size="small"
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Modes</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
              </TextField>
            </Grid>

            {/* Reset Button */}
            <Grid size={{ xs: 12, md: 'auto' }} sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
              {(periodPreset !== 'ALL' || officeFilter !== 'ALL' || categoryFilter !== 'ALL' || paymentModeFilter !== 'ALL' || searchTerm.trim() || startDate || endDate) && (
                <Chip
                  label={`${filteredExpenses.length} found`}
                  size="small"
                  sx={{ bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 700, fontSize: '0.72rem' }}
                />
              )}
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                onClick={handleResetFilters}
                sx={{ height: 32, fontSize: '0.75rem', fontWeight: 600, borderColor: '#e4e4e7', minWidth: 64 }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)} sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.6, fontSize: '0.8rem' } }}>
          <Tab label={`Day-Wise Grouped View (${filteredDayWiseList.length} Days)`} sx={{ fontWeight: 700 }} />
          <Tab label={`All Expense Records (${filteredExpenses.length} Records)`} sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>

      {/* Tab 0: Day-Wise Grouped View */}
      {tabValue === 0 && (
        <Box>
          {loading ? (
            <Typography variant="body2" sx={{ p: 3, textAlign: 'center', color: '#5b616e' }}>
              Loading day-wise expenses...
            </Typography>
          ) : filteredDayWiseList.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <Typography variant="body2" color="text.secondary">
                No expenses match the selected date / week filter. Try resetting filters or clicking "Record Expense".
              </Typography>
            </Card>
          ) : (
            <>
              {/* Day-Wise Summary, View Switcher & Controls Toolbar */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1.5,
                  px: 0.5,
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                {/* Left: Summary Metrics */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${filteredDayWiseList.length} Active Days`}
                    size="small"
                    sx={{
                      bgcolor: '#eff6ff',
                      color: '#1d4ed8',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      height: 26,
                      border: '1px solid #bfdbfe',
                    }}
                  />
                  <Chip
                    label={`Total: ${formatINR(totalCompleted)}`}
                    size="small"
                    sx={{
                      bgcolor: '#fef2f2',
                      color: '#ef4444',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      fontFamily: "Space Mono, monospace",
                      height: 26,
                      border: '1px solid #fecaca',
                    }}
                  />
                  <Chip
                    label={`Avg: ${formatINR(filteredDayWiseList.length ? Math.round(totalCompleted / filteredDayWiseList.length) : 0)} / day`}
                    size="small"
                    sx={{
                      bgcolor: '#f4f4f5',
                      color: '#71717a',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      fontFamily: "Space Mono, monospace",
                      height: 26,
                    }}
                  />
                </Box>

                {/* Right: View Style Toggle & Expand/Collapse Toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {/* View Style Switcher */}
                  <ToggleButtonGroup
                    value={dayViewStyle}
                    exclusive
                    onChange={(_, val) => {
                      if (val) setDayViewStyle(val);
                    }}
                    size="small"
                    sx={{
                      height: 28,
                      bgcolor: '#ffffff',
                      '& .MuiToggleButton-root': {
                        px: 1.2,
                        py: 0.2,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        color: '#4d4d4d',
                        borderColor: '#e6e6e6',
                        '&.Mui-selected': {
                          bgcolor: '#2563eb',
                          color: '#ffffff !important',
                          '&:hover': { bgcolor: '#1d4ed8' },
                        },
                      },
                    }}
                  >
                    <ToggleButton value="cards" aria-label="Day Cards View">
                      <ViewAgendaIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      Cards View
                    </ToggleButton>
                    <ToggleButton value="compact" aria-label="Compact Ledger Table">
                      <TableRowsIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      Ledger Table
                    </ToggleButton>
                  </ToggleButtonGroup>

                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleToggleAllDays}
                    startIcon={allCollapsed ? <UnfoldMoreIcon sx={{ fontSize: 15 }} /> : <UnfoldLessIcon sx={{ fontSize: 15 }} />}
                    sx={{
                      height: 28,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderColor: '#d4d4d8',
                      color: '#0f172a',
                      bgcolor: '#ffffff',
                      '&:hover': { bgcolor: '#f8fafc', borderColor: '#a1a1aa' },
                    }}
                  >
                    {allCollapsed ? 'Expand All' : 'Collapse All'}
                  </Button>
                </Box>
              </Box>

              {/* VIEW STYLE 1: Modern Day Cards */}
              {dayViewStyle === 'cards' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {paginatedDayWiseList.map((dayGroup) => {
                    const isCollapsed = !!collapsedDays[dayGroup.date];
                    const isExpanded = !isCollapsed;

                    let monthStr = 'DAY';
                    let dayNum = '--';
                    let fullDateStr = dayGroup.date;
                    try {
                      const parsed = parseISO(dayGroup.date);
                      monthStr = format(parsed, 'MMM').toUpperCase();
                      dayNum = format(parsed, 'dd');
                      fullDateStr = `${format(parsed, 'EEEE, dd MMMM yyyy')}`;
                    } catch {
                      fullDateStr = `${dayGroup.date} (${dayGroup.dayOfWeek})`;
                    }

                    return (
                      <Card
                        key={dayGroup.date}
                        sx={{
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                          bgcolor: '#ffffff',
                          overflow: 'hidden',
                          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                          '&:hover': {
                            borderColor: '#d4d4d8',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                          },
                        }}
                      >
                        {/* Day Header - Clickable Bar */}
                        <Box
                          onClick={() => toggleDay(dayGroup.date)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: '6px 12px',
                            cursor: 'pointer',
                            bgcolor: isExpanded ? '#f8fafc' : '#ffffff',
                            borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                            transition: 'background-color 0.15s ease',
                            userSelect: 'none',
                            '&:hover': {
                              bgcolor: '#f4f4f5',
                            },
                          }}
                        >
                          {/* Left: Mini Calendar Badge + Date & Item count */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                            {/* Mini Calendar Square */}
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '8px',
                                border: '1px solid #dbeafe',
                                bgcolor: '#ffffff',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: '0.52rem',
                                  fontWeight: 800,
                                  color: '#2563eb',
                                  letterSpacing: '0.3px',
                                  lineHeight: 1,
                                }}
                              >
                                {monthStr}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '0.85rem',
                                  fontWeight: 800,
                                  color: '#0f172a',
                                  lineHeight: 1.1,
                                  fontFamily: "Space Mono, monospace",
                                }}
                              >
                                {dayNum}
                              </Typography>
                            </Box>

                            {/* Full Date & Count */}
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 700,
                                  color: '#0f172a',
                                  fontSize: '0.8rem',
                                  lineHeight: 1.2,
                                }}
                              >
                                {fullDateStr}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#71717a',
                                  fontSize: '0.66rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  mt: 0.1,
                                }}
                              >
                                <span>{dayGroup.dayOfWeek}</span>
                                <span>•</span>
                                <span>{dayGroup.expenseCount} {dayGroup.expenseCount === 1 ? 'transaction' : 'transactions'}</span>
                              </Typography>
                            </Box>
                          </Box>

                          {/* Right: Outflow pill + Expand/Collapse chevron */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={`-${formatINR(dayGroup.totalAmount)}`}
                              size="small"
                              sx={{
                                bgcolor: '#fef2f2',
                                color: '#ef4444',
                                fontWeight: 800,
                                fontSize: '0.72rem',
                                fontFamily: "Space Mono, monospace",
                                border: '1px solid #fecaca',
                                height: 22,
                                px: 0.3,
                              }}
                            />
                            <IconButton
                              size="small"
                              sx={{
                                p: 0.3,
                                color: '#71717a',
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease',
                              }}
                            >
                              <ExpandMoreIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Day Expenses List Body */}
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ bgcolor: '#ffffff' }}>
                            {dayGroup.expenses.map((exp, idx) => {
                              const cat = exp.categoryId ? categoryMap.get(exp.categoryId) : undefined;
                              const catColor = cat?.color || '#2563eb';
                              const isVoided = exp.status === 'Void';

                              return (
                                <Box
                                  key={exp.id || idx}
                                  sx={{
                                    p: '6px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 1.2,
                                    borderBottom: idx === dayGroup.expenses.length - 1 ? 'none' : '1px solid #f1f5f9',
                                    bgcolor: isVoided ? '#f8fafc' : '#ffffff',
                                    opacity: isVoided ? 0.65 : 1,
                                    transition: 'background-color 0.15s ease',
                                    '&:hover': {
                                      bgcolor: isVoided ? '#f4f4f5' : '#f8fafc',
                                    },
                                  }}
                                >
                                  {/* Left: Category Color Strip + Title + Subtitle + Meta Chips */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 240, flex: '1 1 300px' }}>
                                    {/* Category Color Strip */}
                                    <Box
                                      sx={{
                                        width: 3,
                                        height: 28,
                                        borderRadius: '2px',
                                        bgcolor: catColor,
                                        flexShrink: 0,
                                      }}
                                    />

                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontWeight: 700,
                                            color: isVoided ? '#a1a1aa' : '#0f172a',
                                            fontSize: '0.78rem',
                                            textDecoration: isVoided ? 'line-through' : 'none',
                                          }}
                                        >
                                          {exp.expenseTitle}
                                        </Typography>
                                        {isVoided && (
                                          <Chip
                                            label="VOIDED"
                                            size="small"
                                            sx={{
                                              bgcolor: '#fef2f2',
                                              color: '#ef4444',
                                              fontWeight: 800,
                                              fontSize: '0.62rem',
                                              height: 18,
                                            }}
                                          />
                                        )}
                                      </Box>

                                      {/* Description / Particulars */}
                                      {exp.description && (
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: '#71717a',
                                            display: 'block',
                                            fontSize: '0.7rem',
                                            mt: 0.2,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: 420,
                                          }}
                                        >
                                          {exp.description}
                                        </Typography>
                                      )}

                                      {/* Meta Tags: Category, Vendor, Bill #, Mode */}
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mt: 0.5, flexWrap: 'wrap' }}>
                                        {/* Category Chip */}
                                        <Chip
                                          label={exp.categoryName || cat?.name || 'General'}
                                          size="small"
                                          sx={{
                                            bgcolor: `${catColor}14`,
                                            color: catColor,
                                            fontWeight: 700,
                                            fontSize: '0.65rem',
                                            height: 19,
                                            borderRadius: '9999px',
                                          }}
                                        />

                                        {/* Office Tag */}
                                        <Chip
                                          icon={<CorporateFareIcon sx={{ fontSize: '11px !important', color: '#1e40af !important' }} />}
                                          label={exp.officeName || 'Head Office'}
                                          size="small"
                                          sx={{
                                            bgcolor: '#eff6ff',
                                            color: '#1e40af',
                                            border: '1px solid #bfdbfe',
                                            fontWeight: 700,
                                            fontSize: '0.62rem',
                                            height: 19,
                                            borderRadius: '9999px',
                                            '& .MuiChip-icon': { ml: 0.5, mr: -0.3 },
                                          }}
                                        />

                                        {/* Vendor Tag */}
                                        {exp.vendor && (
                                          <Chip
                                            icon={<StorefrontIcon sx={{ fontSize: '11px !important', color: '#475569 !important' }} />}
                                            label={exp.vendor}
                                            size="small"
                                            sx={{
                                              bgcolor: '#f4f4f5',
                                              color: '#0f172a',
                                              fontWeight: 600,
                                              fontSize: '0.65rem',
                                              height: 19,
                                              borderRadius: '9999px',
                                              '& .MuiChip-icon': { ml: 0.5, mr: -0.3 },
                                            }}
                                          />
                                        )}

                                        {/* Bill / Invoice # */}
                                        {exp.billNumber && (
                                          <Typography variant="caption" sx={{ color: '#a1a1aa', fontSize: '0.65rem', fontFamily: "Space Mono, monospace" }}>
                                            #{exp.billNumber}
                                          </Typography>
                                        )}

                                        {/* Payment Mode */}
                                        <Chip
                                          icon={<PaymentsIcon sx={{ fontSize: '11px !important', color: '#64748b !important' }} />}
                                          label={exp.paymentMode}
                                          size="small"
                                          variant="outlined"
                                          sx={{
                                            borderColor: '#e4e4e7',
                                            color: '#71717a',
                                            fontWeight: 600,
                                            fontSize: '0.65rem',
                                            height: 19,
                                            borderRadius: '9999px',
                                            '& .MuiChip-icon': { ml: 0.5, mr: -0.3 },
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                  </Box>

                                  {/* Right: Receipt + Amount + Action Buttons */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 'auto' }}>
                                    {/* Receipt Button */}
                                    {exp.receiptDataUrl ? (
                                      <Tooltip title="View Receipt Attachment">
                                        <IconButton
                                          size="small"
                                          onClick={() => setPreviewReceipt({ title: exp.expenseTitle, dataUrl: exp.receiptDataUrl! })}
                                          sx={{
                                            p: 0.5,
                                            bgcolor: '#eff6ff',
                                            color: '#2563eb',
                                            border: '1px solid #bfdbfe',
                                            borderRadius: '9999px',
                                            '&:hover': { bgcolor: '#dbeafe' },
                                          }}
                                        >
                                          <AttachFileIcon sx={{ fontSize: 15 }} />
                                        </IconButton>
                                      </Tooltip>
                                    ) : (
                                      <Box sx={{ width: 28 }} />
                                    )}

                                    {/* Outflow Amount */}
                                    <Typography
                                      sx={{
                                        fontFamily: "Space Mono, monospace",
                                        fontWeight: 800,
                                        fontSize: '0.88rem',
                                        color: isVoided ? '#a1a1aa' : '#ef4444',
                                        minWidth: 95,
                                        textAlign: 'right',
                                      }}
                                    >
                                      -{formatINR(exp.amount)}
                                    </Typography>

                                    {/* Action Buttons */}
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.2,
                                        bgcolor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '9999px',
                                        p: 0.2,
                                      }}
                                    >
                                      <Tooltip title="View Details">
                                        <IconButton size="small" onClick={() => setViewDetailModal(exp)} sx={{ p: 0.4 }}>
                                          <VisibilityIcon sx={{ fontSize: 15, color: '#71717a' }} />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Edit Expense">
                                        <IconButton
                                          size="small"
                                          onClick={() => {
                                            setEditingExpense(exp);
                                            setOpenAddModal(true);
                                          }}
                                          sx={{ p: 0.4 }}
                                        >
                                          <EditIcon sx={{ fontSize: 15, color: '#2563eb' }} />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title={isVoided ? 'Unvoid / Restore Expense' : 'Void Expense'}>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleToggleVoid(exp)}
                                          sx={{ p: 0.4 }}
                                        >
                                          {isVoided ? (
                                            <RestoreIcon sx={{ fontSize: 15, color: '#22c55e' }} />
                                          ) : (
                                            <BlockIcon sx={{ fontSize: 15, color: '#f59e0b' }} />
                                          )}
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Delete Expense">
                                        <IconButton size="small" onClick={() => handleDelete(exp.id)} sx={{ p: 0.4 }}>
                                          <DeleteIcon sx={{ fontSize: 15, color: '#ef4444' }} />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        </Collapse>
                      </Card>
                    );
                  })}
                </Box>
              )}

              {/* VIEW STYLE 2: Compact Statement Ledger Table */}
              {dayViewStyle === 'compact' && (
                <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', overflow: 'hidden' }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ py: 0.8, fontSize: '0.72rem', fontWeight: 700 }}>PARTICULARS & NOTES</TableCell>
                          <TableCell sx={{ py: 0.8, fontSize: '0.72rem', fontWeight: 700 }}>CATEGORY</TableCell>
                          <TableCell sx={{ py: 0.8, fontSize: '0.72rem', fontWeight: 700 }}>VENDOR / STORE</TableCell>
                          <TableCell sx={{ py: 0.8, fontSize: '0.72rem', fontWeight: 700 }}>PAYMENT MODE</TableCell>
                          <TableCell align="center" sx={{ py: 0.8, fontSize: '0.72rem', fontWeight: 700 }}>RECEIPT</TableCell>
                          <TableCell align="right" sx={{ py: 0.8, fontSize: '0.72rem', fontWeight: 700 }}>OUTFLOW (INR)</TableCell>
                          <TableCell align="center" sx={{ py: 0.8, fontSize: '0.72rem', fontWeight: 700 }}>ACTIONS</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedDayWiseList.map((dayGroup) => {
                          const isCollapsed = !!collapsedDays[dayGroup.date];
                          const isExpanded = !isCollapsed;

                          return (
                            <React.Fragment key={dayGroup.date}>
                              {/* Day Header Row */}
                              <TableRow
                                onClick={() => toggleDay(dayGroup.date)}
                                sx={{
                                  bgcolor: isExpanded ? '#f4f4f5' : '#f8fafc',
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: '#e4e4e7' },
                                  userSelect: 'none',
                                  borderTop: '1px solid #e2e8f0',
                                }}
                              >
                                <TableCell colSpan={5} sx={{ py: 0.7 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton
                                      size="small"
                                      sx={{
                                        p: 0.2,
                                        color: '#71717a',
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.15s ease',
                                      }}
                                    >
                                      <ExpandMoreIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                    <CalendarMonthIcon sx={{ color: '#2563eb', fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>
                                      {formatDate(dayGroup.date)} ({dayGroup.dayOfWeek})
                                    </Typography>
                                    <Chip
                                      label={`${dayGroup.expenseCount} vouchers`}
                                      size="small"
                                      sx={{ bgcolor: '#e4e4e7', color: '#0f172a', fontWeight: 700, fontSize: '0.65rem', height: 18 }}
                                    />
                                  </Box>
                                </TableCell>
                                <TableCell align="right" colSpan={2} sx={{ py: 0.7 }}>
                                  <Chip
                                    label={`Day Total: -${formatINR(dayGroup.totalAmount)}`}
                                    size="small"
                                    sx={{
                                      bgcolor: '#fef2f2',
                                      color: '#ef4444',
                                      fontWeight: 800,
                                      fontSize: '0.75rem',
                                      fontFamily: "Space Mono, monospace",
                                      border: '1px solid #fecaca',
                                      height: 22,
                                    }}
                                  />
                                </TableCell>
                              </TableRow>

                              {/* Day Expenses Rows (if expanded) */}
                              {isExpanded &&
                                dayGroup.expenses.map((exp, expIdx) => {
                                  const cat = exp.categoryId ? categoryMap.get(exp.categoryId) : undefined;
                                  const catColor = cat?.color || '#2563eb';
                                  const isVoided = exp.status === 'Void';

                                  return (
                                    <TableRow
                                      key={exp.id || expIdx}
                                      hover
                                      sx={{
                                        bgcolor: isVoided ? '#f8fafc' : '#ffffff',
                                        opacity: isVoided ? 0.6 : 1,
                                        '&:last-child td, &:last-child th': { borderBottom: '1px solid #e2e8f0' },
                                      }}
                                    >
                                      <TableCell sx={{ py: 0.6, pl: 3.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: catColor, flexShrink: 0 }} />
                                          <Box>
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                fontWeight: 700,
                                                color: isVoided ? '#a1a1aa' : '#0f172a',
                                                fontSize: '0.8rem',
                                                textDecoration: isVoided ? 'line-through' : 'none',
                                              }}
                                            >
                                              {exp.expenseTitle}
                                            </Typography>
                                            {exp.description && (
                                              <Typography variant="caption" sx={{ color: '#71717a', display: 'block', fontSize: '0.68rem' }}>
                                                {exp.description}
                                              </Typography>
                                            )}
                                          </Box>
                                        </Box>
                                      </TableCell>
                                      <TableCell sx={{ py: 0.6 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, alignItems: 'flex-start' }}>
                                          <Chip
                                            label={exp.categoryName || cat?.name || 'General'}
                                            size="small"
                                            sx={{
                                              bgcolor: `${catColor}14`,
                                              color: catColor,
                                              fontWeight: 700,
                                              fontSize: '0.65rem',
                                              height: 19,
                                              borderRadius: '9999px',
                                            }}
                                          />
                                          <Chip
                                            icon={<CorporateFareIcon sx={{ fontSize: '10px !important', color: '#1e40af !important' }} />}
                                            label={exp.officeName || 'Head Office'}
                                            size="small"
                                            sx={{
                                              bgcolor: '#eff6ff',
                                              color: '#1e40af',
                                              border: '1px solid #bfdbfe',
                                              fontWeight: 600,
                                              fontSize: '0.6rem',
                                              height: 17,
                                              borderRadius: '3px',
                                              '& .MuiChip-icon': { ml: 0.4, mr: -0.3 },
                                            }}
                                          />
                                        </Box>
                                      </TableCell>
                                      <TableCell sx={{ py: 0.6 }}>
                                        {exp.vendor ? (
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <StorefrontIcon sx={{ fontSize: 13, color: '#71717a' }} />
                                            <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#0f172a' }}>
                                              {exp.vendor}
                                            </Typography>
                                            {exp.billNumber && (
                                              <Typography variant="caption" sx={{ color: '#a1a1aa', fontSize: '0.65rem', fontFamily: "Space Mono, monospace" }}>
                                                #{exp.billNumber}
                                              </Typography>
                                            )}
                                          </Box>
                                        ) : (
                                          <Typography variant="body2" sx={{ color: '#a1a1aa', fontSize: '0.78rem' }}>—</Typography>
                                        )}
                                      </TableCell>
                                      <TableCell sx={{ py: 0.6 }}>
                                        <Chip
                                          icon={<PaymentsIcon sx={{ fontSize: '11px !important', color: '#64748b !important' }} />}
                                          label={exp.paymentMode}
                                          size="small"
                                          variant="outlined"
                                          sx={{
                                            borderColor: '#e4e4e7',
                                            color: '#71717a',
                                            fontWeight: 600,
                                            fontSize: '0.65rem',
                                            height: 19,
                                            borderRadius: '9999px',
                                            '& .MuiChip-icon': { ml: 0.5, mr: -0.3 },
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell align="center" sx={{ py: 0.6 }}>
                                        {exp.receiptDataUrl ? (
                                          <Tooltip title="View Receipt">
                                            <IconButton
                                              size="small"
                                              onClick={() => setPreviewReceipt({ title: exp.expenseTitle, dataUrl: exp.receiptDataUrl! })}
                                              sx={{ p: 0.3, color: '#2563eb' }}
                                            >
                                              <AttachFileIcon sx={{ fontSize: 15 }} />
                                            </IconButton>
                                          </Tooltip>
                                        ) : (
                                          <Typography variant="caption" color="text.secondary">—</Typography>
                                        )}
                                      </TableCell>
                                      <TableCell align="right" sx={{ py: 0.6, fontWeight: 800, color: isVoided ? '#a1a1aa' : '#ef4444', fontFamily: "Space Mono, monospace", fontSize: '0.85rem' }}>
                                        -{formatINR(exp.amount)}
                                      </TableCell>
                                      <TableCell align="center" sx={{ py: 0.6 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.2 }}>
                                          <Tooltip title="View Details">
                                            <IconButton size="small" onClick={() => setViewDetailModal(exp)} sx={{ p: 0.3 }}>
                                              <VisibilityIcon sx={{ fontSize: 14, color: '#71717a' }} />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Edit Expense">
                                            <IconButton
                                              size="small"
                                              onClick={() => {
                                                setEditingExpense(exp);
                                                setOpenAddModal(true);
                                              }}
                                              sx={{ p: 0.3 }}
                                            >
                                              <EditIcon sx={{ fontSize: 14, color: '#2563eb' }} />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title={isVoided ? 'Unvoid / Restore Expense' : 'Void Expense'}>
                                            <IconButton
                                              size="small"
                                              onClick={() => handleToggleVoid(exp)}
                                              sx={{ p: 0.3 }}
                                            >
                                              {isVoided ? (
                                                <RestoreIcon sx={{ fontSize: 14, color: '#22c55e' }} />
                                              ) : (
                                                <BlockIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                                              )}
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Delete Expense">
                                            <IconButton size="small" onClick={() => handleDelete(exp.id)} sx={{ p: 0.3 }}>
                                              <DeleteIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              )}

              {/* Day-Wise Pagination Bar */}
              <Card sx={{ mt: 1.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <TablePagination
                  component="div"
                  count={filteredDayWiseList.length}
                  page={dayPage}
                  onPageChange={(_, newPage) => setDayPage(newPage)}
                  rowsPerPage={daysPerPage}
                  onRowsPerPageChange={(e) => {
                    setDaysPerPage(parseInt(e.target.value, 10));
                    setDayPage(0);
                  }}
                  rowsPerPageOptions={[5, 7, 10, 14, 30]}
                  labelRowsPerPage="Days per page:"
                  labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count} Days`}
                  sx={{
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#71717a',
                    },
                    '& .MuiTablePagination-select': {
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    },
                  }}
                />
              </Card>
            </>
          )}
        </Box>
      )}

      {/* Tab 1: All Records Data Table */}
      {tabValue === 1 && (
        <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ py: 0.8, fontSize: '0.72rem' }}>DATE</TableCell>
                  <TableCell sx={{ py: 0.8, fontSize: '0.72rem' }}>EXPENSE TITLE & NOTES</TableCell>
                  <TableCell sx={{ py: 0.8, fontSize: '0.72rem' }}>CATEGORY</TableCell>
                  <TableCell sx={{ py: 0.8, fontSize: '0.72rem' }}>VENDOR & BILL #</TableCell>
                  <TableCell sx={{ py: 0.8, fontSize: '0.72rem' }}>PAYMENT MODE</TableCell>
                  <TableCell align="center" sx={{ py: 0.8, fontSize: '0.72rem' }}>RECEIPT</TableCell>
                  <TableCell align="right" sx={{ py: 0.8, fontSize: '0.72rem' }}>AMOUNT</TableCell>
                  <TableCell align="center" sx={{ py: 0.8, fontSize: '0.72rem' }}>STATUS</TableCell>
                  <TableCell align="center" sx={{ py: 0.8, fontSize: '0.72rem' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No records match the filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ py: 0.6, fontSize: '0.78rem' }}>{formatDate(item.expenseDate)}</TableCell>
                        <TableCell sx={{ py: 0.6 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                            {item.expenseTitle}
                          </Typography>
                          {item.description && (
                            <Typography variant="caption" sx={{ color: '#5b616e', display: 'block', fontSize: '0.68rem' }}>
                              {item.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 0.6 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, alignItems: 'flex-start' }}>
                            <Chip
                              label={item.categoryName || 'General'}
                              size="small"
                              sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '0.68rem', height: 20 }}
                            />
                            <Chip
                              icon={<CorporateFareIcon sx={{ fontSize: '10px !important', color: '#1e40af !important' }} />}
                              label={item.officeName || 'Head Office'}
                              size="small"
                              sx={{ bgcolor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontWeight: 600, fontSize: '0.62rem', height: 18 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 0.6 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{item.vendor || '—'}</Typography>
                          {item.billNumber && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                              Inv: {item.billNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 0.6 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>{item.paymentMode}</Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 0.6 }}>
                          {item.receiptDataUrl ? (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setPreviewReceipt({ title: item.expenseTitle, dataUrl: item.receiptDataUrl! })}
                              sx={{ p: 0.3 }}
                            >
                              <AttachFileIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          ) : (
                            <Typography variant="caption" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: item.status === 'Void' ? '#a1a1aa' : '#ef4444', fontFamily: "Space Mono, monospace", fontSize: '0.82rem', py: 0.6 }}>
                          -{formatINR(item.amount)}
                        </TableCell>
                        <TableCell align="center" sx={{ py: 0.6 }}>
                          <Chip
                            label={item.status}
                            size="small"
                            color={item.status === 'Completed' ? 'success' : 'default'}
                            variant={item.status === 'Completed' ? 'filled' : 'outlined'}
                            sx={{ minWidth: 60, height: 20, fontSize: '0.68rem' }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ py: 0.6 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => setViewDetailModal(item)} sx={{ p: 0.4 }}>
                                <VisibilityIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Expense">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setEditingExpense(item);
                                  setOpenAddModal(true);
                                }}
                                sx={{ p: 0.4 }}
                              >
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={item.status === 'Void' ? 'Unvoid / Restore Expense' : 'Void Expense'}>
                              <IconButton
                                size="small"
                                color={item.status === 'Void' ? 'success' : 'warning'}
                                onClick={() => handleToggleVoid(item)}
                                sx={{ p: 0.4 }}
                              >
                                {item.status === 'Void' ? (
                                  <RestoreIcon sx={{ fontSize: 16, color: '#22c55e' }} />
                                ) : (
                                  <BlockIcon sx={{ fontSize: 16 }} />
                                )}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDelete(item.id)} sx={{ p: 0.4 }}>
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredExpenses.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Card>
      )}

      {/* Add / Edit Dialog */}
      <AddExpenseDialog
        open={openAddModal}
        expenseToEdit={editingExpense}
        onClose={() => {
          setOpenAddModal(false);
          setEditingExpense(null);
        }}
        onSuccess={loadData}
      />

      {/* View Detail Modal */}
      <Dialog sx={{ "& .MuiDialog-paper": { borderRadius: "24px" } }} open={Boolean(viewDetailModal)} onClose={() => setViewDetailModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Expense Details
          </Typography>
          <IconButton onClick={() => setViewDetailModal(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          {viewDetailModal && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">EXPENSE TITLE</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{viewDetailModal.expenseTitle}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">AMOUNT</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#ef4444' }}>
                  -{formatINR(viewDetailModal.amount)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">CATEGORY</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewDetailModal.categoryName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">DATE</Typography>
                <Typography variant="body2">{formatDate(viewDetailModal.expenseDate)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">VENDOR & BILL NO</Typography>
                <Typography variant="body2">{viewDetailModal.vendor || 'N/A'} {viewDetailModal.billNumber ? `(Inv: ${viewDetailModal.billNumber})` : ''}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">PAYMENT MODE</Typography>
                <Typography variant="body2">{viewDetailModal.paymentMode}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">STATUS</Typography>
                <Box sx={{ mt: 0.3 }}>
                  <Chip
                    label={viewDetailModal.status === 'Void' ? 'VOIDED (Excluded from balance)' : 'COMPLETED (Active)'}
                    size="small"
                    sx={{
                      bgcolor: viewDetailModal.status === 'Void' ? '#fef2f2' : '#f0fdf4',
                      color: viewDetailModal.status === 'Void' ? '#ef4444' : '#15803d',
                      fontWeight: 800,
                      fontSize: '0.68rem',
                    }}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">DESCRIPTION</Typography>
                <Typography variant="body2">{viewDetailModal.description || 'No description entered.'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={viewDetailModal?.status === 'Void' ? <RestoreIcon /> : <BlockIcon />}
              variant="outlined"
              color={viewDetailModal?.status === 'Void' ? 'success' : 'warning'}
              size="small"
              onClick={async () => {
                const exp = viewDetailModal;
                if (exp) {
                  setViewDetailModal(null);
                  await handleToggleVoid(exp);
                }
              }}
              sx={{ fontWeight: 700 }}
            >
              {viewDetailModal?.status === 'Void' ? 'Unvoid / Restore' : 'Void Expense'}
            </Button>
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              size="small"
              onClick={() => {
                const exp = viewDetailModal;
                setViewDetailModal(null);
                setEditingExpense(exp);
                setOpenAddModal(true);
              }}
              sx={{ fontWeight: 700 }}
            >
              Edit Expense
            </Button>
          </Box>
          <Button onClick={() => setViewDetailModal(null)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Image Preview */}
      <Dialog sx={{ "& .MuiDialog-paper": { borderRadius: "24px" } }} open={Boolean(previewReceipt)} onClose={() => setPreviewReceipt(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Receipt Attachment: {previewReceipt?.title}
          </Typography>
          <IconButton onClick={() => setPreviewReceipt(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ textAlign: 'center', p: 3, bgcolor: '#f8fafc' }}>
          {previewReceipt?.dataUrl && (
            <img
              src={previewReceipt.dataUrl}
              alt="Receipt Preview"
              style={{ maxWidth: '100%', maxHeight: '550px', objectFit: 'contain', borderRadius: 8 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPreviewReceipt(null)} color="inherit">
            Close
          </Button>
          {previewReceipt?.dataUrl && (
            <Button
              variant="contained"
              component="a"
              href={previewReceipt.dataUrl}
              download={`receipt-${previewReceipt.title.replace(/\s+/g, '_')}.png`}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
