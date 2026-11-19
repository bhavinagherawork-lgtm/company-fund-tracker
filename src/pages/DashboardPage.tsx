import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid2 as Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TableChartIcon from '@mui/icons-material/TableChart';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { initializeDatabase } from '../database/db';
import {
  getFinancialSummary,
  getCategoryChartStats,
  getMonthlyTrendChartStats,
  getWeeklyReport,
} from '../services/reportService';
import { getExpenses } from '../services/expenseService';
import { downloadExcelReport } from '../services/excelService';
import { AddExpenseDialog } from '../components/AddExpenseDialog';
import { AddIncomeDialog } from '../components/AddIncomeDialog';
import { useOffice } from '../context/OfficeContext';
import type { FinancialSummary, ExpenseRecord } from '../types';
import { formatINR, formatINRCompact } from '../utils/currency';
import { formatDate } from '../utils/formatters';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { selectedOfficeId, selectedOffice } = useOffice();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary>({
    openingBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    availableBalance: 0,
    currentWeekExpense: 0,
    currentMonthExpense: 0,
    totalTransactions: 0,
  });

  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; income: number; expense: number }[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; amount: number }[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<ExpenseRecord[]>([]);

  const [openExpenseModal, setOpenExpenseModal] = useState(false);
  const [openIncomeModal, setOpenIncomeModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await initializeDatabase();

      const [sum, cats, trends, weekRep, exps] = await Promise.all([
        getFinancialSummary(selectedOfficeId),
        getCategoryChartStats(),
        getMonthlyTrendChartStats(),
        getWeeklyReport(0, selectedOfficeId),
        getExpenses(selectedOfficeId),
      ]);

      setSummary(sum);
      setCategoryData(cats);
      setMonthlyTrend(trends);
      setWeeklyData(weekRep.dayBreakdown.map(d => ({ day: d.day.split(' ')[0], amount: d.amount })));
      setRecentExpenses(exps.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedOfficeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="body2" sx={{ color: '#5b616e' }}>
          Loading financial metrics...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0a0b0d', fontSize: '1.15rem' }}>
              Financial Dashboard
            </Typography>
            <Typography variant="caption" sx={{ color: '#5b616e', fontSize: '0.72rem' }}>
              Real-time balance, categorized spending analytics, and cash flow
            </Typography>
          </Box>
          {selectedOfficeId !== 'ALL' && (
            <Chip
              icon={<CorporateFareIcon sx={{ fontSize: '12px !important', color: '#1e40af !important' }} />}
              label={`Active Office: ${selectedOffice?.name || 'Office'}`}
              size="small"
              sx={{ bgcolor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontWeight: 700, fontSize: '0.7rem', height: 24 }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadData} size="small" sx={{ border: '1px solid #e2e8f0', borderRadius: '6px', p: 0.6 }}>
              <RefreshIcon sx={{ color: '#0052ff', fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            size="small"
            startIcon={<TableChartIcon sx={{ fontSize: 16 }} />}
            onClick={() =>
              downloadExcelReport({
                title: selectedOfficeId !== 'ALL' ? `ExpenseFlow - Master Ledger (${selectedOffice?.name})` : 'ExpenseFlow - Complete Master Ledger',
                periodLabel: selectedOfficeId !== 'ALL' ? `Office: ${selectedOffice?.name}` : 'All Recorded Operations',
                officeId: selectedOfficeId !== 'ALL' ? Number(selectedOfficeId) : undefined,
                filename: `ExpenseFlow_Master_Ledger_${selectedOfficeId !== 'ALL' ? (selectedOffice?.code || 'Office') : 'All'}.xlsx`,
              })
            }
            sx={{
              fontWeight: 700,
              borderRadius: '6px',
              borderColor: '#0052ff',
              color: '#0052ff',
              height: 30,
              px: 1.2,
              fontSize: '0.75rem',
              display: { xs: 'none', sm: 'inline-flex' },
              '&:hover': { bgcolor: '#f5f8ff' },
            }}
          >
            Export 2-Sheet Excel
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<AccountBalanceWalletIcon sx={{ fontSize: 16 }} />}
            onClick={() => setOpenIncomeModal(true)}
            sx={{
              fontWeight: 700,
              borderRadius: '6px',
              bgcolor: '#05b169',
              color: '#ffffff',
              height: 30,
              px: 1.2,
              fontSize: '0.75rem',
              '&:hover': { bgcolor: '#048e54' }
            }}
          >
            + Add Income
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<ReceiptLongIcon sx={{ fontSize: 16 }} />}
            onClick={() => setOpenExpenseModal(true)}
            sx={{
              fontWeight: 700,
              borderRadius: '6px',
              bgcolor: '#0052ff',
              color: '#ffffff',
              height: 30,
              px: 1.2,
              fontSize: '0.75rem',
              '&:hover': { bgcolor: '#0042cc' }
            }}
          >
            + Add Expense
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={1.5}>
        {/* 1. Available Balance */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              height: '100%',
              bgcolor: '#f5f8ff',
              border: '1.5px solid #0052ff',
              borderRadius: '8px',
            }}
          >
            <CardContent sx={{ p: '12px 14px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#0052ff', letterSpacing: 0.5, fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    Available Balance
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.3, color: '#0052ff', fontFamily: 'JetBrains Mono, monospace', fontSize: '1.25rem' }}>
                    {formatINR(summary.availableBalance)}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: 'rgba(0, 82, 255, 0.1)', borderRadius: '6px', p: 0.7 }}>
                  <AccountBalanceWalletIcon sx={{ color: '#0052ff', fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#5b616e', display: 'block', mt: 0.6, fontSize: '0.7rem' }}>
                Opening: {formatINR(summary.openingBalance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 2. Total Inflow / Funds Received */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', borderLeft: '3px solid #05b169', borderRadius: '8px', bgcolor: '#ffffff' }}>
            <CardContent sx={{ p: '12px 14px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#5b616e', letterSpacing: 0.5, fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    Total Inflow
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.3, color: '#05b169', fontFamily: 'JetBrains Mono, monospace', fontSize: '1.25rem' }}>
                    {formatINR(summary.totalIncome)}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#f5f8ff', borderRadius: '6px', p: 0.7, border: '1px solid #e2e8f0' }}>
                  <TrendingUpIcon sx={{ color: '#05b169', fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#5b616e', display: 'block', mt: 0.6, fontSize: '0.7rem' }}>
                Cash provided by management
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 3. Total Expense Outflow */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', borderLeft: '3px solid #dc2626', borderRadius: '8px', bgcolor: '#ffffff' }}>
            <CardContent sx={{ p: '12px 14px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#5b616e', letterSpacing: 0.5, fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    Total Expenses
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.3, color: '#dc2626', fontFamily: 'JetBrains Mono, monospace', fontSize: '1.25rem' }}>
                    {formatINR(summary.totalExpense)}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fee2e2', borderRadius: '6px', p: 0.7 }}>
                  <TrendingDownIcon sx={{ color: '#dc2626', fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#5b616e', display: 'block', mt: 0.6, fontSize: '0.7rem' }}>
                Operational deductions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 4. Current Month Expense */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', borderLeft: '3px solid #f59e0b', borderRadius: '8px', bgcolor: '#ffffff' }}>
            <CardContent sx={{ p: '12px 14px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#5b616e', letterSpacing: 0.5, fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    This Month (Nov)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.3, color: '#d97706', fontFamily: 'JetBrains Mono, monospace', fontSize: '1.25rem' }}>
                    {formatINR(summary.currentMonthExpense)}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fef3c7', borderRadius: '6px', p: 0.7 }}>
                  <CalendarMonthIcon sx={{ color: '#d97706', fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#5b616e', display: 'block', mt: 0.6, fontSize: '0.7rem' }}>
                Current month outflow
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Visual Charts */}
      <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
        {/* Chart 1: Income vs Expense Comparison */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: 260, borderRadius: '8px' }}>
            <CardContent sx={{ height: '100%', p: '12px 14px !important', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Inflow vs Outflow by Month
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                  Sep, Oct & Nov 2026
                </Typography>
              </Box>

              <Box sx={{ flexGrow: 1, width: '100%', minHeight: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend} margin={{ top: 5, right: 15, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#5b616e" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#5b616e"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => formatINRCompact(val)}
                    />
                    <RechartsTooltip
                      formatter={(val: any) => [formatINR(Number(val)), '']}
                      contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 2, fontSize: '11px', fontFamily: 'Plus Jakarta Sans, sans-serif' }} />
                    <Bar dataKey="income" name="Income" fill="#05b169" radius={[3, 3, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="expense" name="Expense" fill="#dc2626" radius={[3, 3, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Chart 2: Category Breakdown Donut */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: 260, borderRadius: '8px' }}>
            <CardContent sx={{ height: '100%', p: '12px 14px !important', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Category Breakdown
                </Typography>
              </Box>

              <Box sx={{ flexGrow: 1, width: '100%', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {categoryData.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">No expenses yet</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="42%"
                        innerRadius={42}
                        outerRadius={68}
                        paddingAngle={2}
                      >
                        {categoryData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: any) => [formatINR(Number(val)), 'Spent']}
                        contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconSize={7}
                        wrapperStyle={{ fontSize: '10px', maxHeight: 48, overflowY: 'auto' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Chart 3: Weekly Day-by-Day Flow (Mon - Sun) */}
        <Grid size={{ xs: 12, lg: 12 }}>
          <Card sx={{ height: 210, borderRadius: '8px' }}>
            <CardContent sx={{ height: '100%', p: '12px 14px !important', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Active Week Flow (Mon – Sun)
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  onClick={() => onNavigate('Reports')}
                  sx={{ color: '#0052ff', fontWeight: 700, fontSize: '0.72rem', py: 0.2 }}
                >
                  View Reports
                </Button>
              </Box>

              <Box sx={{ flexGrow: 1, width: '100%', minHeight: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 5, right: 15, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWeek" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0052ff" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0052ff" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#5b616e" fontSize={10.5} tickLine={false} />
                    <YAxis
                      stroke="#5b616e"
                      fontSize={10.5}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => formatINRCompact(val)}
                    />
                    <RechartsTooltip
                      formatter={(val: any) => [formatINR(Number(val)), 'Spent']}
                      contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#0052ff" strokeWidth={2} fill="url(#colorWeek)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Day-Wise Expenses Table */}
      <Card sx={{ mt: 1.5, borderRadius: '8px' }}>
        <Box sx={{ px: 1.8, py: 1.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <ReceiptLongIcon sx={{ color: '#0052ff', fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
              Recent Expenditures
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
            onClick={() => onNavigate('Expenses')}
            sx={{ fontSize: '0.72rem', py: 0.3, px: 1, borderRadius: '6px', borderColor: '#0052ff', color: '#0052ff' }}
          >
            All Expenses
          </Button>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: 0.8 }}>DATE</TableCell>
                <TableCell sx={{ py: 0.8 }}>TITLE</TableCell>
                <TableCell sx={{ py: 0.8 }}>CATEGORY</TableCell>
                <TableCell sx={{ py: 0.8 }}>PAYMENT</TableCell>
                <TableCell sx={{ py: 0.8 }}>VENDOR</TableCell>
                <TableCell align="right" sx={{ py: 0.8 }}>AMOUNT</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                    No expenses recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentExpenses.map((exp) => (
                  <TableRow key={exp.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: '#334155', py: 0.7, fontSize: '0.78rem' }}>
                      {formatDate(exp.expenseDate)}
                    </TableCell>
                    <TableCell sx={{ py: 0.7 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0a0b0d', fontSize: '0.8rem' }}>
                        {exp.expenseTitle}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.7 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, alignItems: 'flex-start' }}>
                        <Chip
                          label={exp.categoryName || 'General'}
                          size="small"
                          sx={{ bgcolor: '#f5f8ff', color: '#0052ff', fontWeight: 600, fontSize: '0.68rem', height: 20 }}
                        />
                        <Chip
                          icon={<CorporateFareIcon sx={{ fontSize: '10px !important', color: '#1e40af !important' }} />}
                          label={exp.officeName || 'Head Office'}
                          size="small"
                          sx={{ bgcolor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontWeight: 600, fontSize: '0.6rem', height: 17 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 0.7, fontSize: '0.78rem', color: '#5b616e' }}>
                      {exp.paymentMode}
                    </TableCell>
                    <TableCell sx={{ py: 0.7, fontSize: '0.78rem', color: '#5b616e' }}>
                      {exp.vendor || '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#dc2626', py: 0.7, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem' }}>
                      -{formatINR(exp.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Quick Dialogs */}
      <AddExpenseDialog
        open={openExpenseModal}
        onClose={() => setOpenExpenseModal(false)}
        onSuccess={loadData}
      />
      <AddIncomeDialog
        open={openIncomeModal}
        onClose={() => setOpenIncomeModal(false)}
        onSuccess={loadData}
      />
    </Box>
  );
};
