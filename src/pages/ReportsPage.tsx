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
  Tabs,
  Tab,
  LinearProgress,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TableChartIcon from '@mui/icons-material/TableChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { getWeeklyReport, getMonthlyReport } from '../services/reportService';
import { exportWeeklyExcel, exportMonthlyExcel, downloadExcelReport } from '../services/excelService';
import { useOffice } from '../context/OfficeContext';
import type { WeeklyReportData, MonthlyReportData } from '../types';
import { formatINR, formatINRCompact } from '../utils/currency';
import { formatDate } from '../utils/formatters';

export const ReportsPage: React.FC = () => {
  const { selectedOfficeId, selectedOffice } = useOffice();
  const [tabValue, setTabValue] = useState(0); // 0: Weekly, 1: Monthly
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = last week
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportData | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [weekData, monthData] = await Promise.all([
        getWeeklyReport(weekOffset, selectedOfficeId),
        getMonthlyReport(selectedMonth, selectedOfficeId),
      ]);
      setWeeklyReport(weekData);
      setMonthlyReport(monthData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [weekOffset, selectedMonth, selectedOfficeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Export Weekly 2-Sheet Excel
  const handleExportWeeklyExcel = async () => {
    if (!weeklyReport) return;
    try {
      await exportWeeklyExcel(weeklyReport.startDate, weeklyReport.endDate, weeklyReport.weekLabel);
      setExportNotice(`Weekly 2-Sheet Excel exported: OverAll Summary + Details with Day-Wise Opening Balance!`);
    } catch (err: any) {
      setExportNotice(`Export failed: ${err.message}`);
    }
  };

  // Export Monthly 2-Sheet Excel
  const handleExportMonthlyExcel = async () => {
    if (!monthlyReport) return;
    try {
      await exportMonthlyExcel(selectedMonth);
      setExportNotice(`Monthly 2-Sheet Excel (${monthlyReport.monthLabel}) exported with OverAll & Details sheets!`);
    } catch (err: any) {
      setExportNotice(`Export failed: ${err.message}`);
    }
  };

  // Export Master 2-Sheet Excel
  const handleExportMasterExcel = async () => {
    try {
      await downloadExcelReport({
        title: selectedOfficeId !== 'ALL' ? `ExpenseFlow - Master Ledger (${selectedOffice?.name})` : 'ExpenseFlow - Master Company Ledger',
        periodLabel: selectedOfficeId !== 'ALL' ? `Office: ${selectedOffice?.name}` : 'All Historical Company Operations',
        officeId: selectedOfficeId !== 'ALL' ? Number(selectedOfficeId) : undefined,
        filename: `ExpenseFlow_Master_Audit_${selectedOfficeId !== 'ALL' ? (selectedOffice?.code || 'Office') : 'All'}.xlsx`,
      });
      setExportNotice(`Master Excel Workbook (OverAll + Details with Day-Wise Opening Balance) downloaded!`);
    } catch (err: any) {
      setExportNotice(`Export failed: ${err.message}`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (tabValue === 0 && weeklyReport) {
      let csv = `Week Period,${weeklyReport.weekLabel}\n`;
      csv += `Total Income,${weeklyReport.totalIncome}\n`;
      csv += `Total Expenses,${weeklyReport.totalExpense}\n`;
      csv += `Net Flow,${weeklyReport.netCashFlow}\n\n`;
      csv += `Day,Date,Expense Amount (INR)\n`;
      weeklyReport.dayBreakdown.forEach((d) => {
        csv += `${d.day},${d.date},${d.amount}\n`;
      });
      downloadCSV(csv, `Weekly_Report_${weeklyReport.startDate}.csv`);
    } else if (monthlyReport) {
      let csv = `Monthly Financial Statement,${monthlyReport.monthLabel}\n`;
      csv += `Opening Balance,${monthlyReport.openingBalance}\n`;
      csv += `Total Income Received,${monthlyReport.totalIncome}\n`;
      csv += `Total Expenses Deducted,${monthlyReport.totalExpense}\n`;
      csv += `Closing Balance,${monthlyReport.closingBalance}\n\n`;
      csv += `Category,Total Spent (INR),Records\n`;
      monthlyReport.categoryBreakdown.forEach((c) => {
        csv += `"${c.name}",${c.amount},${c.count}\n`;
      });
      downloadCSV(csv, `Monthly_Statement_${monthlyReport.yearMonth}.csv`);
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ pb: 3 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontFamily: '"Space Grotesk", sans-serif', letterSpacing: "-0.02em" }}>
              Financial Reports & Multi-Sheet Statements
            </Typography>
            {selectedOfficeId !== 'ALL' && (
              <Chip
                icon={<CorporateFareIcon sx={{ fontSize: '12px !important', color: '#1e40af !important' }} />}
                label={`Office Scope: ${selectedOffice?.name || 'Office'}`}
                size="small"
                sx={{ bgcolor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontWeight: 700, fontSize: '0.7rem', height: 22 }}
              />
            )}
          </Box>
          <Typography variant="caption" sx={{ color: '#5b616e', fontSize: '0.72rem' }}>
            Structured Monday–Sunday weekly cycles and monthly statements (Exports 2 Sheets: OverAll & Details)
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<TableChartIcon sx={{ fontSize: 16 }} />}
            onClick={tabValue === 0 ? handleExportWeeklyExcel : handleExportMonthlyExcel}
            sx={{
              fontWeight: 700,
              borderRadius: '9999px',
              bgcolor: '#2563eb',
              color: '#ffffff',
              height: 32,
              px: 1.8,
              fontSize: '0.78rem',
              '&:hover': { bgcolor: '#1d4ed8' },
            }}
          >
            Export 2-Sheet Excel (.xlsx)
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon sx={{ fontSize: 15 }} />}
            onClick={handleExportMasterExcel}
            sx={{
              fontWeight: 700,
              borderRadius: '9999px',
              borderColor: '#22c55e',
              color: '#22c55e',
              height: 30,
              px: 1.2,
              fontSize: '0.75rem',
              '&:hover': { borderColor: '#22c55e', bgcolor: '#f0fdf4' },
            }}
          >
            Export Master Excel
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon sx={{ fontSize: 15 }} />}
            onClick={handleExportCSV}
            sx={{ fontWeight: 700, borderRadius: '9999px', borderColor: '#e4e4e7', color: '#5b616e', height: 30, px: 1, fontSize: '0.75rem' }}
          >
            CSV
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon sx={{ fontSize: 15 }} />}
            onClick={() => window.print()}
            sx={{ fontWeight: 700, borderRadius: '9999px', borderColor: '#e4e4e7', color: '#5b616e', height: 30, px: 1, fontSize: '0.75rem' }}
          >
            Print
          </Button>
        </Box>
      </Box>

      {exportNotice && (
        <Alert severity="success" onClose={() => setExportNotice(null)} sx={{ mb: 1.5, py: 0.4, fontSize: '0.8rem' }}>
          {exportNotice}
        </Alert>
      )}

      {/* 2-Sheet Architecture Info Pill */}
      <Card sx={{ p: 1.2, mb: 1.8, bgcolor: '#f8fafc', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TableChartIcon sx={{ color: '#2563eb', fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.8rem' }}>
              Two-Sheet Excel Architecture:
            </Typography>
            <Typography variant="caption" sx={{ color: '#1e3a8a', fontSize: '0.75rem' }}>
              Every export generates <strong>Sheet 1: OverAll</strong> (Executive Summary & Category Breakdown) and <strong>Sheet 2: Details</strong> (Itemized rows with <strong>Day-Wise Opening Balance</strong> column).
            </Typography>
          </Box>
          <Chip label="2 Sheets / 1 File" size="small" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
        </Box>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.8 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.6, fontSize: '0.8rem' } }}>
          <Tab icon={<DateRangeIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Weekly Report (Mon – Sun)" sx={{ fontWeight: 700 }} />
          <Tab icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Monthly Financial Statement" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>

      {/* TAB 0: WEEKLY REPORT */}
      {tabValue === 0 && weeklyReport && (
        <Box>
          {/* Week Navigation Header */}
          <Card sx={{ p: 1.2, mb: 1.5, bgcolor: '#ffffff', borderRadius: '16px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />}
                onClick={() => setWeekOffset((prev) => prev + 1)}
                sx={{ fontSize: '0.72rem', py: 0.3, px: 1, borderRadius: '9999px' }}
              >
                Previous Week
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                  {weeklyReport.weekLabel}
                </Typography>
                <Typography variant="caption" sx={{ color: '#5b616e', fontSize: '0.68rem' }}>
                  {weekOffset === 0 ? 'Active Current Week (Mon–Sun)' : `${weekOffset} Weeks Ago`}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  disabled={weekOffset === 0}
                  onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
                  sx={{ fontSize: '0.72rem', py: 0.3, px: 1, borderRadius: '9999px' }}
                >
                  Next Week
                </Button>
              </Box>
            </Box>
          </Card>

          {/* Weekly Summary KPIs (60-30-10 Highlighter Rule) */}
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ border: '1px solid #e4e4e7', borderRadius: '16px' }}>
                <CardContent sx={{ p: '12px 14px !important' }}>
                  <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    Total Weekly Expense
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#ef4444', mt: 0.3, fontFamily: '"Space Mono", monospace', fontSize: '1.25rem' }}>
                    -{formatINR(weeklyReport.totalExpense)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                    Mon through Sun total outflow
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ border: '1px solid #e4e4e7', borderRadius: '16px' }}>
                <CardContent sx={{ p: '12px 14px !important' }}>
                  <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    Total Inflow Received
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#22c55e', mt: 0.3, fontFamily: '"Space Mono", monospace', fontSize: '1.25rem' }}>
                    +{formatINR(weeklyReport.totalIncome)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                    Funds credited during this week
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ border: '1px solid #e4e4e7', borderRadius: '16px' }}>
                <CardContent sx={{ p: '12px 14px !important' }}>
                  <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    Net Cash Position
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: weeklyReport.netCashFlow >= 0 ? '#15803d' : '#ef4444',
                      mt: 0.3,
                      fontFamily: '"Space Mono", monospace',
                      fontSize: '1.25rem',
                    }}
                  >
                    {formatINR(weeklyReport.netCashFlow)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                    Inflow minus outflow difference
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Daily Breakdown Chart & Table */}
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card sx={{ height: '100%', borderRadius: '16px' }}>
                <CardContent sx={{ p: '12px 14px !important' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5 }}>
                    Day-by-Day Expenditure (Mon – Sun)
                  </Typography>

                  <Box sx={{ width: '100%', height: 210 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyReport.dayBreakdown} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" stroke="#5b616e" fontSize={10.5} tickLine={false} />
                        <YAxis stroke="#5b616e" fontSize={10.5} tickLine={false} axisLine={false} tickFormatter={(v) => formatINRCompact(v)} />
                        <RechartsTooltip
                          formatter={(v: any) => [formatINR(Number(v)), 'Spent']}
                          contentStyle={{ borderRadius: '9999px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        />
                        <Bar dataKey="amount" fill="#0052ff" radius={[3, 3, 0, 0]} maxBarSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Card sx={{ height: '100%', borderRadius: '16px' }}>
                <CardContent sx={{ p: '12px 14px !important' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5 }}>
                    Day-Wise Audit Log
                  </Typography>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ py: 0.6, fontSize: '0.7rem' }}>DAY</TableCell>
                          <TableCell sx={{ py: 0.6, fontSize: '0.7rem' }}>DATE</TableCell>
                          <TableCell align="right" sx={{ py: 0.6, fontSize: '0.7rem' }}>AMOUNT</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {weeklyReport.dayBreakdown.map((row) => (
                          <TableRow key={row.date} hover>
                            <TableCell sx={{ fontWeight: 700, py: 0.6, fontSize: '0.78rem' }}>{row.day.split(' ')[0]}</TableCell>
                            <TableCell sx={{ py: 0.6, fontSize: '0.78rem' }}>{formatDate(row.date)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: row.amount > 0 ? '#ef4444' : '#a1a1aa', py: 0.6, fontFamily: '"Space Mono", monospace', fontSize: '0.8rem' }}>
                              {row.amount > 0 ? `-${formatINR(row.amount)}` : '₹0.00'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* TAB 1: MONTHLY FINANCIAL REPORT */}
      {tabValue === 1 && monthlyReport && (
        <Box>
          {/* Executive Ledger Statement Card */}
          <Card sx={{ mb: 1.5, p: 1.8, bgcolor: '#ffffff', borderRadius: '16px' }}>
            <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.2, mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                  Financial Statement: {monthlyReport.monthLabel}
                </Typography>
                <Typography variant="caption" sx={{ color: '#5b616e', fontSize: '0.7rem' }}>
                  Rolling Opening Balance, Funds Received, and Expenditures (Export includes OverAll & Details)
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControl size="small" sx={{ minWidth: 170 }}>
                  <InputLabel id="month-select-label" sx={{ fontSize: '0.78rem' }}>Statement Month</InputLabel>
                  <Select
                    labelId="month-select-label"
                    value={selectedMonth}
                    label="Statement Month"
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    sx={{ fontWeight: 700, bgcolor: '#ffffff', height: 32, fontSize: '0.78rem' }}
                  >
                    <MenuItem value="2026-11" sx={{ fontSize: '0.8rem' }}>November 2026</MenuItem>
                    <MenuItem value="2026-10" sx={{ fontSize: '0.8rem' }}>October 2026</MenuItem>
                    <MenuItem value="2026-09" sx={{ fontSize: '0.8rem' }}>September 2026</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  size="small"
                  startIcon={<TableChartIcon sx={{ fontSize: 15 }} />}
                  onClick={handleExportMonthlyExcel}
                  sx={{ bgcolor: '#2563eb', color: '#ffffff', fontWeight: 700, height: 32, fontSize: '0.75rem', '&:hover': { bgcolor: '#1d4ed8' } }}
                >
                  Export {monthlyReport.monthLabel} Excel
                </Button>
              </Box>
            </Box>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ p: '10px 12px', bgcolor: '#f8fafc', borderRadius: '9999px', border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#5b616e', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    1. Opening Balance
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.3, fontFamily: '"Space Mono", monospace', fontSize: '1.05rem' }}>
                    {formatINR(monthlyReport.openingBalance)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#5b616e', fontSize: '0.68rem' }}>
                    Month start balance
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ p: '10px 12px', bgcolor: '#f8fafc', borderRadius: '9999px', border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#5b616e', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    2. Funds Received
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#22c55e', mt: 0.3, fontFamily: '"Space Mono", monospace', fontSize: '1.05rem' }}>
                    +{formatINR(monthlyReport.totalIncome)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#5b616e', fontSize: '0.68rem' }}>
                    Inflow credits
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ p: '10px 12px', bgcolor: '#f8fafc', borderRadius: '9999px', border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#5b616e', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    3. Total Expenses
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#ef4444', mt: 0.3, fontFamily: '"Space Mono", monospace', fontSize: '1.05rem' }}>
                    -{formatINR(monthlyReport.totalExpense)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#5b616e', fontSize: '0.68rem' }}>
                    Outflow posted
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ p: '10px 12px', bgcolor: '#f0fdf4', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                  <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    4. Closing Available Balance
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#22c55e', mt: 0.3, fontFamily: '"Space Mono", monospace', fontSize: '1.05rem' }}>
                    {formatINR(monthlyReport.closingBalance)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#15803d', fontSize: '0.68rem' }}>
                    = (1) + (2) - (3)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>

          {/* Breakdown Columns */}
          <Grid container spacing={1.5}>
            {/* Category Expense Breakdown */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%', borderRadius: '16px' }}>
                <CardContent sx={{ p: '12px 14px !important' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1 }}>
                    Category Expenditure Breakdown ({monthlyReport.monthLabel})
                  </Typography>

                  {monthlyReport.categoryBreakdown.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                      No expenses posted for this month.
                    </Typography>
                  ) : (
                    monthlyReport.categoryBreakdown.map((cat) => {
                      const percentage = monthlyReport.totalExpense > 0
                        ? Math.round((cat.amount / monthlyReport.totalExpense) * 100)
                        : 0;

                      return (
                        <Box key={cat.name} sx={{ mb: 1.2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem' }}>
                              {cat.name} ({cat.count} tx)
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: '"Space Mono", monospace', fontSize: '0.78rem' }}>
                              {formatINR(cat.amount)} ({percentage}%)
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                              height: 5,
                              borderRadius: 3,
                              bgcolor: '#f4f4f5',
                              '& .MuiLinearProgress-bar': { bgcolor: cat.color || '#2563eb', borderRadius: 3 },
                            }}
                          />
                        </Box>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Top 10 Major Expenses */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%', borderRadius: '16px' }}>
                <CardContent sx={{ p: '12px 14px !important' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1 }}>
                    Top Expense Items ({monthlyReport.monthLabel})
                  </Typography>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ py: 0.6, fontSize: '0.7rem' }}>DATE</TableCell>
                          <TableCell sx={{ py: 0.6, fontSize: '0.7rem' }}>TITLE / VENDOR</TableCell>
                          <TableCell sx={{ py: 0.6, fontSize: '0.7rem' }}>CATEGORY</TableCell>
                          <TableCell align="right" sx={{ py: 0.6, fontSize: '0.7rem' }}>AMOUNT</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {monthlyReport.topExpenses.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 2, color: 'text.secondary', fontSize: '0.75rem' }}>
                              No items recorded for this month.
                            </TableCell>
                          </TableRow>
                        ) : (
                          monthlyReport.topExpenses.map((item) => (
                            <TableRow key={item.id} hover>
                              <TableCell sx={{ py: 0.6, fontSize: '0.75rem' }}>{formatDate(item.expenseDate)}</TableCell>
                              <TableCell sx={{ py: 0.6 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                                  {item.expenseTitle}
                                </Typography>
                                {item.vendor && (
                                  <Typography variant="caption" sx={{ color: '#5b616e', fontSize: '0.65rem' }}>
                                    {item.vendor}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ py: 0.6 }}>
                                <Chip
                                  label={item.categoryName || 'General'}
                                  size="small"
                                  sx={{ fontSize: '0.65rem', height: 18, bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ py: 0.6, fontWeight: 800, color: '#ef4444', fontFamily: '"Space Mono", monospace', fontSize: '0.78rem' }}>
                                -{formatINR(item.amount)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};
