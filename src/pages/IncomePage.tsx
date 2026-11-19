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
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import TableChartIcon from '@mui/icons-material/TableChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  format,
} from 'date-fns';
import { getIncomes, voidIncome, unvoidIncome, deleteIncome } from '../services/incomeService';
import { downloadExcelReport } from '../services/excelService';
import { AddIncomeDialog } from '../components/AddIncomeDialog';
import { useOffice } from '../context/OfficeContext';
import type { IncomeRecord } from '../types';
import { formatINR, toPaise, fromPaise } from '../utils/currency';
import { formatDate } from '../utils/formatters';

export const IncomePage: React.FC = () => {
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Office Context
  const { offices, selectedOfficeId } = useOffice();
  const [officeFilter, setOfficeFilter] = useState<string>(String(selectedOfficeId));

  useEffect(() => {
    setOfficeFilter(String(selectedOfficeId));
    setPage(0);
  }, [selectedOfficeId]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');

  // Date & Week Filter State
  const [periodPreset, setPeriodPreset] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals
  const [openAddModal, setOpenAddModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeRecord | null>(null);
  const [viewDetailModal, setViewDetailModal] = useState<IncomeRecord | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const handlePeriodChange = (val: string) => {
    setPeriodPreset(val);
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
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setPeriodPreset('CUSTOM');
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setPaymentModeFilter('ALL');
    setOfficeFilter('ALL');
    setPeriodPreset('ALL');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const handleExportExcel = async () => {
    try {
      let periodLabel = 'Received Company Operational Capital';
      if (periodPreset === 'THIS_WEEK') periodLabel = 'This Week (Mon–Sun)';
      else if (periodPreset === 'LAST_WEEK') periodLabel = 'Last Week';
      else if (periodPreset === 'THIS_MONTH') periodLabel = 'This Month';
      else if (periodPreset === 'LAST_MONTH') periodLabel = 'Last Month';
      else if (startDate || endDate) periodLabel = `Period: ${startDate || 'Start'} to ${endDate || 'Latest'}`;

      await downloadExcelReport({
        title: 'Company Funds & Inflows - Audited Ledger',
        periodLabel,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        officeId: officeFilter !== 'ALL' ? Number(officeFilter) : undefined,
        filename: `ExpenseFlow_Funds_${periodPreset !== 'ALL' ? periodPreset : 'All'}.xlsx`,
      });
      setFeedbackNotice('2-Sheet Excel file exported successfully (OverAll & Details with Day-Wise Opening Balance)!');
    } catch (err: any) {
      setFeedbackNotice(`Export failed: ${err.message}`);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getIncomes();
      setIncomes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered incomes
  const filteredIncomes = useMemo(() => {
    return incomes.filter((item) => {
      if (officeFilter !== 'ALL' && item.officeId !== Number(officeFilter)) return false;
      if (paymentModeFilter !== 'ALL' && item.paymentMode !== paymentModeFilter) return false;
      if (startDate && item.transactionDate < startDate) return false;
      if (endDate && item.transactionDate > endDate) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mFrom = item.receivedFrom.toLowerCase().includes(q);
        const mRef = item.referenceNumber?.toLowerCase().includes(q) || false;
        const mDesc = item.description?.toLowerCase().includes(q) || false;
        const mOffice = item.officeName?.toLowerCase().includes(q) || false;
        const mAmt = item.amount.toString().includes(q);
        if (!mFrom && !mRef && !mDesc && !mOffice && !mAmt) return false;
      }
      return true;
    });
  }, [incomes, officeFilter, paymentModeFilter, startDate, endDate, searchTerm]);

  // Dynamic KPI totals based on filtered items
  const totalInflow = useMemo(() => {
    return fromPaise(
      filteredIncomes
        .filter((i) => !i.isVoid)
        .reduce((acc, curr) => acc + toPaise(curr.amount), 0)
    );
  }, [filteredIncomes]);

  const uniqueActiveDays = useMemo(() => {
    const dates = new Set(filteredIncomes.map((i) => i.transactionDate));
    return dates.size;
  }, [filteredIncomes]);

  const handleToggleVoid = async (item: IncomeRecord) => {
    if (!item.id) return;
    if (item.isVoid) {
      if (window.confirm(`Unvoid / Restore fund entry from "${item.receivedFrom}"? It will be re-added to your available balance.`)) {
        await unvoidIncome(item.id);
        loadData();
      }
    } else {
      if (window.confirm(`Voiding this income from "${item.receivedFrom}" will deduct it from the available balance. Proceed?`)) {
        await voidIncome(item.id);
        loadData();
      }
    }
  };

  const handleVoid = async (id?: number) => {
    if (!id) return;
    const found = incomes.find(i => i.id === id);
    if (found) {
      await handleToggleVoid(found);
    } else {
      if (window.confirm('Voiding this income will deduct it from the available balance. Proceed?')) {
        await voidIncome(id);
        loadData();
      }
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to permanently delete this income transaction?')) {
      await deleteIncome(id);
      loadData();
    }
  };

  return (
    <Box sx={{ pb: 3 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0a0b0d', fontSize: '1.15rem' }}>
            Income & Fund Inflows
          </Typography>
          <Typography variant="caption" sx={{ color: '#5b616e', fontSize: '0.72rem' }}>
            Record cash received from management, filter by date/week, and track balances
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TableChartIcon sx={{ fontSize: 16 }} />}
            onClick={handleExportExcel}
            sx={{
              fontWeight: 700,
              borderRadius: '6px',
              borderColor: '#05b169',
              color: '#05b169',
              height: 30,
              px: 1.2,
              fontSize: '0.75rem',
              '&:hover': { borderColor: '#048e54', bgcolor: '#f0fdf4' },
            }}
          >
            Export 2-Sheet Excel
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              setEditingIncome(null);
              setOpenAddModal(true);
            }}
            sx={{
              fontWeight: 700,
              px: 1.5,
              borderRadius: '6px',
              bgcolor: '#05b169',
              color: '#ffffff',
              height: 30,
              fontSize: '0.75rem',
              '&:hover': { bgcolor: '#048e54' }
            }}
          >
            + Add Income
          </Button>
        </Box>
      </Box>

      {feedbackNotice && (
        <Alert severity="success" onClose={() => setFeedbackNotice(null)} sx={{ mb: 1.5, py: 0.4, fontSize: '0.8rem' }}>
          {feedbackNotice}
        </Alert>
      )}

      {/* KPI Cards (Dynamically Filtered) */}
      <Grid container spacing={1.5} sx={{ mb: 1.8 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderLeft: '3px solid #05b169', borderRadius: '8px' }}>
            <CardContent sx={{ p: '12px 14px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#5b616e', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    Total Funds Inflow {periodPreset !== 'ALL' && '(Filtered)'}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#05b169', mt: 0.3, fontFamily: 'JetBrains Mono, monospace', fontSize: '1.25rem' }}>
                    {formatINR(totalInflow)}
                  </Typography>
                </Box>
                <Box sx={{ p: 0.7, bgcolor: '#f5f8ff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <TrendingUpIcon sx={{ color: '#05b169', fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#5b616e', display: 'block', mt: 0.6, fontSize: '0.7rem' }}>
                Operational capital credited in selected scope
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderLeft: '3px solid #0052ff', borderRadius: '8px' }}>
            <CardContent sx={{ p: '12px 14px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#5b616e', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    Recorded Inflows
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0052ff', mt: 0.3, fontFamily: 'JetBrains Mono, monospace', fontSize: '1.25rem' }}>
                    {filteredIncomes.length} Transactions
                  </Typography>
                </Box>
                <Box sx={{ p: 0.7, bgcolor: '#f5f8ff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <CheckCircleIcon sx={{ color: '#0052ff', fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#5b616e', display: 'block', mt: 0.6, fontSize: '0.7rem' }}>
                Matching deposits ({uniqueActiveDays} active deposit days)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderLeft: '3px solid #f59e0b', borderRadius: '8px' }}>
            <CardContent sx={{ p: '12px 14px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#5b616e', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    Primary Source
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0a0b0d', mt: 0.3, fontSize: '1.15rem' }}>
                    Sir & Management
                  </Typography>
                </Box>
                <Box sx={{ p: 0.7, bgcolor: '#fef3c7', borderRadius: '8px' }}>
                  <AccountBalanceWalletIcon sx={{ color: '#d97706', fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#5b616e', display: 'block', mt: 0.6, fontSize: '0.7rem' }}>
                Executive fund transfers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DATE, WEEK & PAYMENT MODE FILTER BAR */}
      <Card sx={{ mb: 2, borderRadius: '8px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: '12px 14px !important' }}>
          <Grid container spacing={1.2} sx={{ alignItems: 'center' }}>
            {/* 1. Search Box */}
            <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
              <TextField
                placeholder="Search source, UTR/ref #, remarks..."
                fullWidth
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            {/* 2. Date & Week Preset */}
            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
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
                        <DateRangeIcon sx={{ color: '#05b169', fontSize: 17 }} />
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
            <Grid size={{ xs: 6, sm: 3, md: 1.8 }}>
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
                  setPage(0);
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

            {/* 6. Payment Mode */}
            <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
              <TextField
                select
                label="Payment Mode"
                fullWidth
                size="small"
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Modes</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
              </TextField>
            </Grid>

            {/* Reset Button */}
            <Grid size={{ xs: 12, md: 'auto' }} sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
              {(periodPreset !== 'ALL' || officeFilter !== 'ALL' || paymentModeFilter !== 'ALL' || searchTerm.trim() || startDate || endDate) && (
                <Chip
                  label={`${filteredIncomes.length} found`}
                  size="small"
                  sx={{ bgcolor: '#ecfdf5', color: '#065f46', fontWeight: 700, fontSize: '0.72rem' }}
                />
              )}
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                onClick={handleResetFilters}
                sx={{ height: 32, fontSize: '0.75rem', fontWeight: 600, borderColor: '#e2e8f0', minWidth: 64 }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Incomes Data Table */}
      <Card sx={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ py: 0.8, fontSize: '0.72rem' }}>ID</TableCell>
                <TableCell sx={{ py: 0.8, fontSize: '0.72rem' }}>DATE</TableCell>
                <TableCell sx={{ py: 0.8, fontSize: '0.72rem' }}>RECEIVED FROM / SOURCE</TableCell>
                <TableCell sx={{ py: 0.8, fontSize: '0.72rem' }}>PAYMENT MODE</TableCell>
                <TableCell sx={{ py: 0.8, fontSize: '0.72rem' }}>REF / UTR NO</TableCell>
                <TableCell sx={{ py: 0.8, fontSize: '0.72rem' }}>PURPOSE & REMARKS</TableCell>
                <TableCell align="right" sx={{ py: 0.8, fontSize: '0.72rem' }}>AMOUNT</TableCell>
                <TableCell align="center" sx={{ py: 0.8, fontSize: '0.72rem' }}>STATUS</TableCell>
                <TableCell align="center" sx={{ py: 0.8, fontSize: '0.72rem' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredIncomes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No fund inflow records match the filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredIncomes
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ py: 0.6, fontSize: '0.75rem', color: '#64748b' }}>
                        #{String(item.id).padStart(3, '0')}
                      </TableCell>
                      <TableCell sx={{ py: 0.6, fontSize: '0.78rem' }}>{formatDate(item.transactionDate)}</TableCell>
                      <TableCell sx={{ py: 0.6 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                          {item.receivedFrom}
                        </Typography>
                        <Chip
                          icon={<CorporateFareIcon sx={{ fontSize: '10px !important', color: '#1e40af !important' }} />}
                          label={item.officeName || 'Head Office'}
                          size="small"
                          sx={{ bgcolor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontWeight: 600, fontSize: '0.62rem', height: 18, mt: 0.3 }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 0.6 }}>
                        <Chip
                          label={item.paymentMode}
                          size="small"
                          sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 0.6 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.75rem' }}>
                          {item.referenceNumber || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.6 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                          {item.description || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: item.isVoid ? '#94a3b8' : '#16a34a', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', py: 0.6 }}>
                        +{formatINR(item.amount)}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 0.6 }}>
                        <Chip
                          label={item.isVoid ? 'Voided' : 'Received'}
                          size="small"
                          color={item.isVoid ? 'default' : 'success'}
                          variant={item.isVoid ? 'outlined' : 'filled'}
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
                          <Tooltip title="Edit Income">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setEditingIncome(item);
                                setOpenAddModal(true);
                              }}
                              sx={{ p: 0.4 }}
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={item.isVoid ? "Unvoid / Restore" : "Void"}>
                            <IconButton
                              size="small"
                              color={item.isVoid ? "success" : "warning"}
                              onClick={() => handleToggleVoid(item)}
                              sx={{ p: 0.4 }}
                            >
                              {item.isVoid ? (
                                <RestoreIcon sx={{ fontSize: 16, color: '#05b169' }} />
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
          count={filteredIncomes.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Add / Edit Modal */}
      <AddIncomeDialog
        open={openAddModal}
        incomeToEdit={editingIncome}
        onClose={() => {
          setOpenAddModal(false);
          setEditingIncome(null);
        }}
        onSuccess={loadData}
      />

      {/* View Detail Modal */}
      <Dialog open={Boolean(viewDetailModal)} onClose={() => setViewDetailModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Income Transaction Details
          </Typography>
          <IconButton onClick={() => setViewDetailModal(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          {viewDetailModal && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">TRANSACTION ID</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>#FND-{String(viewDetailModal.id).padStart(3, '0')}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">RECEIVED FROM</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{viewDetailModal.receivedFrom}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">AMOUNT</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#16a34a' }}>
                  +{formatINR(viewDetailModal.amount)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">TRANSACTION DATE</Typography>
                <Typography variant="body2">{formatDate(viewDetailModal.transactionDate)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">PAYMENT MODE</Typography>
                <Typography variant="body2">{viewDetailModal.paymentMode}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">REFERENCE NUMBER</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{viewDetailModal.referenceNumber || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">REMARKS</Typography>
                <Typography variant="body2">{viewDetailModal.description || 'No remarks provided.'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={viewDetailModal?.isVoid ? <RestoreIcon /> : <BlockIcon />}
              variant="outlined"
              size="small"
              color={viewDetailModal?.isVoid ? "success" : "warning"}
              onClick={async () => {
                const item = viewDetailModal;
                if (item) {
                  setViewDetailModal(null);
                  await handleToggleVoid(item);
                }
              }}
              sx={{ fontWeight: 700 }}
            >
              {viewDetailModal?.isVoid ? 'Unvoid / Restore' : 'Void Fund Entry'}
            </Button>
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              size="small"
              color="success"
              onClick={() => {
                const item = viewDetailModal;
                setViewDetailModal(null);
                setEditingIncome(item);
                setOpenAddModal(true);
              }}
              sx={{ fontWeight: 700 }}
            >
              Edit Fund Entry
            </Button>
          </Box>
          <Button onClick={() => setViewDetailModal(null)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
