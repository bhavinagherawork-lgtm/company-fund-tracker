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
import { formatINR } from '../utils/currency';
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
    setOfficeFilter('ALL');
    setPaymentModeFilter('ALL');
    setPeriodPreset('ALL');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const handleExportExcel = async () => {
    try {
      let periodLabel = 'Direct Fund Inflows Ledger';
      if (periodPreset === 'THIS_WEEK') periodLabel = 'This Week (Mon–Sun)';
      else if (periodPreset === 'LAST_WEEK') periodLabel = 'Last Week';
      else if (periodPreset === 'THIS_MONTH') periodLabel = 'This Month';
      else if (periodPreset === 'LAST_MONTH') periodLabel = 'Last Month';
      else if (startDate || endDate) periodLabel = `Period: ${startDate || 'Start'} to ${endDate || 'Latest'}`;

      await downloadExcelReport({
        title: 'Company Fund Inflows - Management Deposits',
        periodLabel,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        officeId: officeFilter !== 'ALL' ? Number(officeFilter) : undefined,
        filename: `ExpenseFlow_Incomes_${periodPreset !== 'ALL' ? periodPreset : 'All'}.xlsx`,
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

  // Filtered dataset
  const filteredIncomes = useMemo(() => {
    return incomes.filter((item) => {
      // 1. Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchSource = item.receivedFrom.toLowerCase().includes(term);
        const matchRef = item.referenceNumber?.toLowerCase().includes(term);
        const matchDesc = item.description?.toLowerCase().includes(term);
        if (!matchSource && !matchRef && !matchDesc) return false;
      }

      // 2. Office filter
      if (officeFilter !== 'ALL') {
        if (String(item.officeId || 1) !== String(officeFilter)) return false;
      }

      // 3. Payment mode
      if (paymentModeFilter !== 'ALL' && item.paymentMode !== paymentModeFilter) {
        return false;
      }

      // 4. Date range filter
      if (startDate && item.transactionDate < startDate) return false;
      if (endDate && item.transactionDate > endDate) return false;

      return true;
    });
  }, [incomes, searchTerm, officeFilter, paymentModeFilter, startDate, endDate]);

  const totalInflow = useMemo(() => {
    return filteredIncomes.reduce(
      (sum, item) => (item.isVoid ? sum : sum + item.amount),
      0
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#09090b', fontFamily: '"Space Grotesk", sans-serif', letterSpacing: '-0.02em' }}>
            Income & Fund Inflows
          </Typography>
          <Typography variant="body2" sx={{ color: '#71717a', fontSize: '0.82rem', mt: 0.2 }}>
            Record cash received from management, filter by date/week, and track balances
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TableChartIcon sx={{ fontSize: 16 }} />}
            onClick={handleExportExcel}
            sx={{
              fontWeight: 600,
              borderRadius: '9999px',
              borderColor: '#e4e4e7',
              color: '#09090b',
              height: 34,
              px: 1.6,
              fontSize: '0.78rem',
              '&:hover': { borderColor: '#18181b', bgcolor: '#ffffff' },
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
              fontWeight: 600,
              px: 1.8,
              borderRadius: '9999px',
              bgcolor: '#22c55e',
              color: '#ffffff',
              height: 34,
              fontSize: '0.78rem',
              '&:hover': { bgcolor: '#16a34a' }
            }}
          >
            + Add Income
          </Button>
        </Box>
      </Box>

      {feedbackNotice && (
        <Alert severity="success" onClose={() => setFeedbackNotice(null)} sx={{ mb: 2, borderRadius: '12px', py: 0.5, fontSize: '0.8rem' }}>
          {feedbackNotice}
        </Alert>
      )}

      {/* KPI Cards (Reui Soft Card 16px Radius) */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: '16px', bgcolor: '#ffffff', border: '1px solid #e4e4e7', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
            <CardContent sx={{ p: '18px 20px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: '"Space Grotesk", sans-serif' }}>
                    Total Funds Inflow {periodPreset !== 'ALL' && '(Filtered)'}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#22c55e', mt: 0.6, fontFamily: '"Space Mono", monospace', fontSize: '1.45rem', letterSpacing: '-0.02em' }}>
                    {formatINR(totalInflow)}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, bgcolor: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  <TrendingUpIcon sx={{ color: '#22c55e', fontSize: 22 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mt: 1, fontSize: '0.74rem' }}>
                Operational capital credited in selected scope
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: '16px', bgcolor: '#ffffff', border: '1px solid #e4e4e7', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
            <CardContent sx={{ p: '18px 20px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: '"Space Grotesk", sans-serif' }}>
                    Recorded Inflows
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#09090b', mt: 0.6, fontFamily: '"Space Mono", monospace', fontSize: '1.45rem', letterSpacing: '-0.02em' }}>
                    {filteredIncomes.length} Entries
                  </Typography>
                </Box>
                <Box sx={{ p: 1, bgcolor: 'rgba(24, 24, 27, 0.06)', borderRadius: '12px', border: '1px solid #e4e4e7' }}>
                  <CheckCircleIcon sx={{ color: '#18181b', fontSize: 22 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mt: 1, fontSize: '0.74rem' }}>
                Matching deposits ({uniqueActiveDays} active deposit days)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: '16px', bgcolor: '#ffffff', border: '1px solid #e4e4e7', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
            <CardContent sx={{ p: '18px 20px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: '"Space Grotesk", sans-serif' }}>
                    Primary Source
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#09090b', mt: 0.6, fontSize: '1.2rem', fontFamily: '"Space Grotesk", sans-serif' }}>
                    Executive Transfer
                  </Typography>
                </Box>
                <Box sx={{ p: 1, bgcolor: 'rgba(234, 179, 8, 0.15)', borderRadius: '12px', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                  <AccountBalanceWalletIcon sx={{ color: '#eab308', fontSize: 22 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mt: 1, fontSize: '0.74rem' }}>
                Authorized office management funds
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FILTER BAR (Reui Soft Card 16px) */}
      <Card sx={{ mb: 2, borderRadius: '16px', border: '1px solid #e4e4e7', bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
        <CardContent sx={{ p: '16px 20px !important' }}>
          <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
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
                        <SearchIcon sx={{ color: '#71717a', fontSize: 18 }} />
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
                        <DateRangeIcon sx={{ color: '#18181b', fontSize: 17 }} />
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
                  sx={{ bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 600, fontSize: '0.74rem', border: '1px solid #bbf7d0', borderRadius: '9999px' }}
                />
              )}
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                onClick={handleResetFilters}
                sx={{ height: 34, fontSize: '0.78rem', fontWeight: 600, borderColor: '#e4e4e7', minWidth: 70, borderRadius: '9999px', '&:hover': { borderColor: '#18181b', bgcolor: '#fafafa' } }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Incomes Data Table (16px Soft Card) */}
      <Card sx={{ borderRadius: '16px', border: '1px solid #e4e4e7', bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: 1.1 }}>ID</TableCell>
                <TableCell sx={{ py: 1.1 }}>DATE</TableCell>
                <TableCell sx={{ py: 1.1 }}>RECEIVED FROM / SOURCE</TableCell>
                <TableCell sx={{ py: 1.1 }}>PAYMENT MODE</TableCell>
                <TableCell sx={{ py: 1.1 }}>REF / UTR NO</TableCell>
                <TableCell sx={{ py: 1.1 }}>PURPOSE & REMARKS</TableCell>
                <TableCell align="right" sx={{ py: 1.1 }}>AMOUNT</TableCell>
                <TableCell align="center" sx={{ py: 1.1 }}>STATUS</TableCell>
                <TableCell align="center" sx={{ py: 1.1 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredIncomes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#71717a' }}>
                    No fund inflow records match the filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredIncomes
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow key={item.id} hover sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                      <TableCell sx={{ py: 0.9, fontSize: '0.78rem', color: '#71717a', fontFamily: '"Space Mono", monospace' }}>
                        #{String(item.id).padStart(3, '0')}
                      </TableCell>
                      <TableCell sx={{ py: 0.9, fontSize: '0.8rem', fontWeight: 600 }}>{formatDate(item.transactionDate)}</TableCell>
                      <TableCell sx={{ py: 0.9 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#09090b', fontSize: '0.84rem' }}>
                          {item.receivedFrom}
                        </Typography>
                        <Chip
                          icon={<CorporateFareIcon sx={{ fontSize: '11px !important', color: '#71717a !important' }} />}
                          label={item.officeName || 'Head Office'}
                          size="small"
                          sx={{ bgcolor: '#fafafa', color: '#71717a', border: '1px solid #e4e4e7', fontWeight: 600, fontSize: '0.64rem', height: 19, mt: 0.3, borderRadius: '9999px' }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 0.9 }}>
                        <Chip
                          label={item.paymentMode}
                          size="small"
                          sx={{ bgcolor: '#f4f4f5', color: '#18181b', fontWeight: 600, fontSize: '0.72rem', height: 22, borderRadius: '9999px', border: '1px solid #e4e4e7' }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 0.9 }}>
                        <Typography variant="body2" sx={{ fontFamily: '"Space Mono", monospace', color: '#71717a', fontSize: '0.78rem' }}>
                          {item.referenceNumber || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.9 }}>
                        <Typography variant="body2" sx={{ color: '#71717a', fontSize: '0.8rem' }}>
                          {item.description || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: item.isVoid ? '#a1a1aa' : '#22c55e', fontFamily: '"Space Mono", monospace', fontSize: '0.88rem', py: 0.9 }}>
                        +{formatINR(item.amount)}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 0.9 }}>
                        <Chip
                          label={item.isVoid ? 'Voided' : 'Received'}
                          size="small"
                          sx={{
                            minWidth: 64,
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            borderRadius: '9999px',
                            bgcolor: item.isVoid ? '#f4f4f5' : '#f0fdf4',
                            color: item.isVoid ? '#71717a' : '#15803d',
                            border: `1px solid ${item.isVoid ? '#e4e4e7' : '#bbf7d0'}`,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 0.9 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => setViewDetailModal(item)} sx={{ p: 0.5, borderRadius: '9999px', '&:hover': { bgcolor: '#f4f4f5' } }}>
                              <VisibilityIcon sx={{ fontSize: 17, color: '#71717a' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Income">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingIncome(item);
                                setOpenAddModal(true);
                              }}
                              sx={{ p: 0.5, borderRadius: '9999px', '&:hover': { bgcolor: '#f4f4f5' } }}
                            >
                              <EditIcon sx={{ fontSize: 17, color: '#18181b' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={item.isVoid ? "Unvoid / Restore" : "Void"}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleVoid(item)}
                              sx={{ p: 0.5, borderRadius: '9999px', '&:hover': { bgcolor: '#f4f4f5' } }}
                            >
                              {item.isVoid ? (
                                <RestoreIcon sx={{ fontSize: 17, color: '#22c55e' }} />
                              ) : (
                                <BlockIcon sx={{ fontSize: 17, color: '#eab308' }} />
                              )}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(item.id)} sx={{ p: 0.5, borderRadius: '9999px', '&:hover': { bgcolor: '#fee2e2' } }}>
                              <DeleteIcon sx={{ fontSize: 17, color: '#ef4444' }} />
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

      {/* View Detail Modal (24px Radius Reui Overlay) */}
      <Dialog open={Boolean(viewDetailModal)} onClose={() => setViewDetailModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e4e4e7' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif', fontSize: '1.05rem', color: '#09090b' }}>
            Income Transaction Details
          </Typography>
          <IconButton onClick={() => setViewDetailModal(null)} size="small" sx={{ borderRadius: '9999px' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          {viewDetailModal && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>TRANSACTION ID</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: '"Space Mono", monospace', mt: 0.2 }}>#FND-{String(viewDetailModal.id).padStart(3, '0')}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>RECEIVED FROM</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#09090b', mt: 0.2 }}>{viewDetailModal.receivedFrom}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>AMOUNT</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#22c55e', fontFamily: '"Space Mono", monospace', mt: 0.2 }}>
                  +{formatINR(viewDetailModal.amount)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>TRANSACTION DATE</Typography>
                <Typography variant="body2" sx={{ color: '#09090b', fontWeight: 500, mt: 0.2 }}>{formatDate(viewDetailModal.transactionDate)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>PAYMENT MODE</Typography>
                <Typography variant="body2" sx={{ color: '#09090b', fontWeight: 500, mt: 0.2 }}>{viewDetailModal.paymentMode}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>REFERENCE NUMBER</Typography>
                <Typography variant="body2" sx={{ fontFamily: '"Space Mono", monospace', color: '#71717a', mt: 0.2 }}>{viewDetailModal.referenceNumber || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>REMARKS</Typography>
                <Typography variant="body2" sx={{ color: '#09090b', mt: 0.2 }}>{viewDetailModal.description || 'No remarks provided.'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e4e4e7', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={viewDetailModal?.isVoid ? <RestoreIcon /> : <BlockIcon />}
              variant="outlined"
              size="small"
              onClick={async () => {
                const item = viewDetailModal;
                if (item) {
                  setViewDetailModal(null);
                  await handleToggleVoid(item);
                }
              }}
              sx={{ fontWeight: 600, borderRadius: '9999px', borderColor: '#e4e4e7' }}
            >
              {viewDetailModal?.isVoid ? 'Restore' : 'Void'}
            </Button>
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              size="small"
              onClick={() => {
                const item = viewDetailModal;
                setViewDetailModal(null);
                setEditingIncome(item);
                setOpenAddModal(true);
              }}
              sx={{ fontWeight: 600, borderRadius: '9999px', borderColor: '#e4e4e7' }}
            >
              Edit
            </Button>
          </Box>
          <Button onClick={() => setViewDetailModal(null)} variant="contained" sx={{ bgcolor: '#18181b', borderRadius: '9999px' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
