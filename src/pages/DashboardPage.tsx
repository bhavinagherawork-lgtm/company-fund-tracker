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
  Slider,
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
import CalculateIcon from '@mui/icons-material/Calculate';
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
  const [simulatedBurn, setSimulatedBurn] = useState<number>(25000);

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
      if (sum.currentMonthExpense > 0) {
        setSimulatedBurn(Math.round(sum.currentMonthExpense));
      }
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
        <Typography variant="body2" sx={{ color: '#71717a' }}>
          Loading financial metrics...
        </Typography>
      </Box>
    );
  }

  // Palette for Charts
  const REUI_CHART_COLORS = [
    '#2563eb', // User Primary Blue
    '#4d4d4d', // User Secondary Charcoal
    '#16a34a', // Inflow Green
    '#dc2626', // Outflow Red
    '#0284c7', // Sky
    '#f59e0b', // Amber
    '#7c3aed', // Violet
    '#0d9488', // Teal
  ];

  return (
    <Box sx={{ pb: 3 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#09090b', fontFamily: '"Space Grotesk", sans-serif', letterSpacing: '-0.02em' }}>
              Financial Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: '#71717a', fontSize: '0.82rem', mt: 0.2 }}>
              Real-time balance, categorized spending analytics, and cash flow
            </Typography>
          </Box>
          {selectedOfficeId !== 'ALL' && (
            <Chip
              icon={<CorporateFareIcon sx={{ fontSize: '13px !important', color: '#eab308 !important' }} />}
              label={`Active Office: ${selectedOffice?.name || 'Office'}`}
              size="small"
              sx={{ bgcolor: '#ffffff', color: '#09090b', border: '1px solid #e4e4e7', fontWeight: 600, fontSize: '0.74rem', height: 26, borderRadius: '9999px' }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Tooltip title="Refresh metrics">
            <IconButton onClick={loadData} size="small" sx={{ border: '1px solid #e4e4e7', borderRadius: '9999px', p: 0.8, bgcolor: '#ffffff', '&:hover': { bgcolor: '#f4f4f5', borderColor: '#18181b' } }}>
              <RefreshIcon sx={{ color: '#18181b', fontSize: 18 }} />
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
              fontWeight: 600,
              borderRadius: '9999px',
              borderColor: '#e4e4e7',
              color: '#09090b',
              height: 34,
              px: 1.6,
              fontSize: '0.78rem',
              display: { xs: 'none', sm: 'inline-flex' },
              '&:hover': { bgcolor: '#fafafa', borderColor: '#18181b' },
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
              fontWeight: 600,
              borderRadius: '9999px',
              bgcolor: '#16a34a',
              color: '#ffffff',
              height: 34,
              px: 1.8,
              fontSize: '0.78rem',
              '&:hover': { bgcolor: '#15803d', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)' }
            }}
          >
            Add Income
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<ReceiptLongIcon sx={{ fontSize: 16 }} />}
            onClick={() => setOpenExpenseModal(true)}
            sx={{
              fontWeight: 600,
              borderRadius: '9999px',
              bgcolor: '#2563eb',
              color: '#ffffff',
              height: 34,
              px: 1.8,
              fontSize: '0.78rem',
              '&:hover': { bgcolor: '#1d4ed8', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }
            }}
          >
            Add Expense
          </Button>
        </Box>
      </Box>

      {/* KPI Metric Cards */}
      <Grid container spacing={2}>
        {/* 1. Flagship Hero Card: Available Balance */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
              border: '1px solid #3b82f6',
              borderRadius: '16px',
              boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              color: '#ffffff',
            }}
          >
            <CardContent sx={{ p: '18px 20px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#dbeafe', letterSpacing: '0.04em', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Available Balance
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.6, color: '#ffffff', fontFamily: '"Space Mono", monospace', fontSize: '1.45rem', letterSpacing: '-0.02em' }}>
                    {formatINR(summary.availableBalance)}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '12px', p: 1, border: '1px solid rgba(255, 255, 255, 0.25)' }}>
                  <AccountBalanceWalletIcon sx={{ color: '#ffffff', fontSize: 22 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#dbeafe', display: 'block', mt: 1, fontSize: '0.74rem' }}>
                Opening Balance: <span style={{ fontFamily: '"Space Mono", monospace', color: '#ffffff', fontWeight: 600 }}>{formatINR(summary.openingBalance)}</span>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 2. Total Inflow / Funds Received */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', borderRadius: '16px', bgcolor: '#ffffff', border: '1px solid #e6e6e6', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
            <CardContent sx={{ p: '18px 20px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#71717a', letterSpacing: '0.04em', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Total Inflow
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.6, color: '#22c55e', fontFamily: '"Space Mono", monospace', fontSize: '1.45rem', letterSpacing: '-0.02em' }}>
                    {formatINR(summary.totalIncome)}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#f0fdf4', borderRadius: '12px', p: 1, border: '1px solid #bbf7d0' }}>
                  <TrendingUpIcon sx={{ color: '#22c55e', fontSize: 22 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mt: 1, fontSize: '0.74rem' }}>
                Cash provided by management
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 3. Total Expense Outflow */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', borderRadius: '16px', bgcolor: '#ffffff', border: '1px solid #e4e4e7', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
            <CardContent sx={{ p: '18px 20px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#71717a', letterSpacing: '0.04em', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Total Expenses
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.6, color: '#ef4444', fontFamily: '"Space Mono", monospace', fontSize: '1.45rem', letterSpacing: '-0.02em' }}>
                    {formatINR(summary.totalExpense)}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fef2f2', borderRadius: '12px', p: 1, border: '1px solid #fecaca' }}>
                  <TrendingDownIcon sx={{ color: '#ef4444', fontSize: 22 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mt: 1, fontSize: '0.74rem' }}>
                Operational deductions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 4. Current Month Expense */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', borderRadius: '16px', bgcolor: '#ffffff', border: '1px solid #e4e4e7', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
            <CardContent sx={{ p: '18px 20px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#71717a', letterSpacing: '0.04em', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    This Month Outflow
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.6, color: '#09090b', fontFamily: '"Space Mono", monospace', fontSize: '1.45rem', letterSpacing: '-0.02em' }}>
                    {formatINR(summary.currentMonthExpense)}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#f4f4f5', borderRadius: '12px', p: 1, border: '1px solid #e4e4e7' }}>
                  <CalendarMonthIcon sx={{ color: '#71717a', fontSize: 22 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mt: 1, fontSize: '0.74rem' }}>
                Current month active spending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Visual Analytics Charts */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {/* Chart 1: Inflow vs Outflow by Month */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: 280, borderRadius: '16px', border: '1px solid #e4e4e7', bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <CardContent sx={{ height: '100%', p: '18px 20px !important', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.92rem', fontFamily: '"Space Grotesk", sans-serif', color: '#0f172a' }}>
                  Inflow vs Outflow by Month
                </Typography>
                <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.72rem', fontWeight: 500 }}>
                  Active Operational Trends
                </Typography>
              </Box>

              <Box sx={{ flexGrow: 1, width: '100%', minHeight: 190 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend} margin={{ top: 5, right: 15, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis dataKey="month" stroke="#71717a" fontSize={11.5} tickLine={false} fontFamily="Inter, sans-serif" />
                    <YAxis
                      stroke="#71717a"
                      fontSize={11.5}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => formatINRCompact(val)}
                      fontFamily="'Space Mono', monospace"
                    />
                    <RechartsTooltip
                      formatter={(val: any) => [formatINR(Number(val)), '']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', fontSize: '12px', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.1)', fontFamily: "'Space Mono', monospace" }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 4, fontSize: '11px', fontFamily: 'Inter, sans-serif' }} />
                    <Bar dataKey="income" name="Income" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="expense" name="Expense" fill="#dc2626" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Chart 2: Category Breakdown Donut */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: 280, borderRadius: '16px', border: '1px solid #e6e6e6', bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <CardContent sx={{ height: '100%', p: '18px 20px !important', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.92rem', fontFamily: '"Space Grotesk", sans-serif', color: '#1a1a1a' }}>
                  Category Breakdown
                </Typography>
              </Box>

              <Box sx={{ flexGrow: 1, width: '100%', minHeight: 190, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {categoryData.length === 0 ? (
                  <Typography variant="caption" sx={{ color: '#4d4d4d' }}>No expenses recorded yet</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="42%"
                        innerRadius={46}
                        outerRadius={72}
                        paddingAngle={3}
                      >
                        {categoryData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color || REUI_CHART_COLORS[idx % REUI_CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: any) => [formatINR(Number(val)), 'Spent']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e6e6e6', fontSize: '12px', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.08)', fontFamily: "'Space Mono', monospace" }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '10.5px', maxHeight: 48, overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Chart 3: Weekly Day-by-Day Flow */}
        <Grid size={{ xs: 12, lg: 12 }}>
          <Card sx={{ height: 230, borderRadius: '16px', border: '1px solid #e6e6e6', bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <CardContent sx={{ height: '100%', p: '18px 20px !important', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.92rem', fontFamily: '"Space Grotesk", sans-serif', color: '#1a1a1a' }}>
                  Active Week Flow (Mon – Sun)
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  onClick={() => onNavigate('Reports')}
                  sx={{ color: '#2563eb', fontWeight: 600, fontSize: '0.75rem', py: 0.3, px: 1.2, borderRadius: '9999px', '&:hover': { bgcolor: '#f8fafc' } }}
                >
                  View Reports
                </Button>
              </Box>

              <Box sx={{ flexGrow: 1, width: '100%', minHeight: 145 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 5, right: 15, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWeek" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="day" stroke="#4d4d4d" fontSize={11} tickLine={false} fontFamily="Inter, sans-serif" />
                    <YAxis
                      stroke="#4d4d4d"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => formatINRCompact(val)}
                      fontFamily="'Space Mono', monospace"
                    />
                    <RechartsTooltip
                      formatter={(val: any) => [formatINR(Number(val)), 'Spent']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e6e6e6', fontSize: '12px', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.08)', fontFamily: "'Space Mono', monospace" }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2.4} fill="url(#colorWeek)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Rule 5: The Free Sample (IKEA Effect) - Interactive Cash Runway & Burn Estimator */}
      {(() => {
        const runwayMonths = simulatedBurn > 0 ? Number((summary.availableBalance / simulatedBurn).toFixed(1)) : 999;
        const dailySafe = simulatedBurn > 0 ? Math.round(simulatedBurn / 30) : 0;
        const statusConfig =
          runwayMonths >= 6
            ? { label: 'Healthy Liquidity', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' }
            : runwayMonths >= 3
            ? { label: 'Moderate Runway', color: '#a16207', bg: '#fefce8', border: '#fef08a' }
            : { label: 'Attention Advised', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' };

        return (
          <Card
            sx={{
              mt: 2,
              borderRadius: '16px',
              border: '1px solid #e4e4e7',
              bgcolor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <CardContent sx={{ p: '18px 22px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      bgcolor: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CalculateIcon sx={{ color: '#ffffff', fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        fontFamily: '"Space Grotesk", sans-serif',
                        color: '#1a1a1a',
                      }}
                    >
                      Interactive Cash Runway & Burn Estimator
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.72rem' }}>
                      Simulate operating burn rate to project runway months & daily operational ceilings
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={statusConfig.label}
                  size="small"
                  sx={{
                    bgcolor: statusConfig.bg,
                    color: statusConfig.color,
                    border: `1px solid ${statusConfig.border}`,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 24,
                    borderRadius: '9999px',
                  }}
                />
              </Box>

              <Grid container spacing={2.5} alignItems="center">
                <Grid size={{ xs: 12, md: 5 }}>
                  <Box sx={{ px: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#4d4d4d', fontWeight: 600, fontSize: '0.74rem' }}>
                        Simulated Monthly Operating Burn:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: '#1a1a1a',
                          fontFamily: '"Space Mono", monospace',
                          fontSize: '0.84rem',
                        }}
                      >
                        {formatINR(simulatedBurn)} / month
                      </Typography>
                    </Box>
                    <Slider
                      value={simulatedBurn}
                      min={5000}
                      max={Math.max(150000, Math.round(summary.totalExpense * 1.5) || 100000)}
                      step={2500}
                      onChange={(_, val) => setSimulatedBurn(val as number)}
                      sx={{
                        color: '#2563eb',
                        height: 6,
                        '& .MuiSlider-thumb': {
                          width: 16,
                          height: 16,
                          bgcolor: '#ffffff',
                          border: '2.5px solid #2563eb',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: '0 0 0 6px rgba(37, 99, 235, 0.2)',
                          },
                        },
                        '& .MuiSlider-rail': {
                          bgcolor: '#e6e6e6',
                        },
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -0.5 }}>
                      <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.68rem' }}>
                        Min: {formatINR(5000)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.68rem' }}>
                        Max: {formatINR(Math.max(150000, Math.round(summary.totalExpense * 1.5) || 100000))}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 4 }}>
                      <Box
                        sx={{
                          p: 1.2,
                          borderRadius: '12px',
                          bgcolor: '#f8fafc',
                          border: '1px solid #e6e6e6',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                          Projected Runway
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: statusConfig.color,
                            fontFamily: '"Space Mono", monospace',
                            fontSize: '1.2rem',
                            mt: 0.3,
                          }}
                        >
                          {runwayMonths > 99 ? '> 99' : runwayMonths} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Mo</span>
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 4 }}>
                      <Box
                        sx={{
                          p: 1.2,
                          borderRadius: '12px',
                          bgcolor: '#f8fafc',
                          border: '1px solid #e6e6e6',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                          Daily Safe Burn
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: '#1a1a1a',
                            fontFamily: '"Space Mono", monospace',
                            fontSize: '1.05rem',
                            mt: 0.3,
                          }}
                        >
                          {formatINR(dailySafe)}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 4 }}>
                      <Box
                        sx={{
                          p: 1.2,
                          borderRadius: '12px',
                          bgcolor: '#f8fafc',
                          border: '1px solid #e6e6e6',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                          Available Reserve
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: '#16a34a',
                            fontFamily: '"Space Mono", monospace',
                            fontSize: '1.05rem',
                            mt: 0.3,
                          }}
                        >
                          {formatINR(summary.availableBalance)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      })()}

      {/* Recent Day-Wise Expenditures Table (Soft Card 16px) */}
      <Card sx={{ mt: 2, borderRadius: '16px', border: '1px solid #e6e6e6', bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <Box sx={{ px: 2.2, py: 1.6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e6e6e6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <ReceiptLongIcon sx={{ color: '#2563eb', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.92rem', fontFamily: '"Space Grotesk", sans-serif', color: '#1a1a1a' }}>
              Recent Expenditures
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
            onClick={() => onNavigate('Expenses')}
            sx={{ fontSize: '0.76rem', py: 0.4, px: 1.4, borderRadius: '9999px', borderColor: '#e6e6e6', color: '#1a1a1a', '&:hover': { borderColor: '#2563eb', bgcolor: '#f8fafc' } }}
          >
            All Expenses
          </Button>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: 1.1 }}>DATE</TableCell>
                <TableCell sx={{ py: 1.1 }}>TITLE</TableCell>
                <TableCell sx={{ py: 1.1 }}>CATEGORY</TableCell>
                <TableCell sx={{ py: 1.1 }}>PAYMENT</TableCell>
                <TableCell sx={{ py: 1.1 }}>VENDOR</TableCell>
                <TableCell align="right" sx={{ py: 1.1 }}>AMOUNT</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#71717a' }}>
                    No expenses recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentExpenses.map((exp) => (
                  <TableRow key={exp.id} hover sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                    <TableCell sx={{ fontWeight: 600, color: '#09090b', py: 1, fontSize: '0.8rem', fontFamily: 'Inter, sans-serif' }}>
                      {formatDate(exp.expenseDate)}
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#09090b', fontSize: '0.84rem' }}>
                        {exp.expenseTitle}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, alignItems: 'flex-start' }}>
                        <Chip
                          label={exp.categoryName || 'General'}
                          size="small"
                          sx={{ bgcolor: '#f4f4f5', color: '#09090b', fontWeight: 600, fontSize: '0.7rem', height: 22, borderRadius: '9999px', border: '1px solid #e4e4e7' }}
                        />
                        <Chip
                          icon={<CorporateFareIcon sx={{ fontSize: '11px !important', color: '#71717a !important' }} />}
                          label={exp.officeName || 'Head Office'}
                          size="small"
                          sx={{ bgcolor: '#f8fafc', color: '#71717a', border: '1px solid #e4e4e7', fontWeight: 600, fontSize: '0.64rem', height: 19, borderRadius: '9999px' }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1, fontSize: '0.8rem', color: '#71717a' }}>
                      {exp.paymentMode}
                    </TableCell>
                    <TableCell sx={{ py: 1, fontSize: '0.8rem', color: '#71717a' }}>
                      {exp.vendor || '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#ef4444', py: 1, fontFamily: '"Space Mono", monospace', fontSize: '0.85rem' }}>
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
