import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { db } from '../database/db';
import { toPaise, fromPaise } from '../utils/currency';
import type { ExpenseRecord, IncomeRecord } from '../types';

export interface DayLedgerItem {
  date: string;
  dayOfWeek: string;
  officeName: string;
  openingBalance: number;
  type: 'Income' | 'Expense';
  categoryOrSource: string;
  titleOrDescription: string;
  vendorOrPayer: string;
  inflow: number;
  outflow: number;
  paymentMode: string;
  runningBalance: number;
  status: string;
  remarks: string;
}

/**
 * Calculates day-wise opening balance and chronological ledger
 */
export async function calculatePeriodLedger(params?: {
  startDate?: string;
  endDate?: string;
  officeId?: number | 'ALL';
}): Promise<{
  initialOpeningBalance: number;
  closingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  items: DayLedgerItem[];
}> {
  const setting = await db.settings.get('openingBalance');
  const baseOpening = setting ? Number(setting.value) || 0 : 0;
  const officeId = params?.officeId;

  let allExpenses = await db.expenseRecords
    .filter(e => e.status === 'Completed')
    .toArray();

  let allIncomes = await db.incomeRecords
    .filter(i => !i.isVoid)
    .toArray();

  if (officeId && officeId !== 'ALL') {
    allExpenses = allExpenses.filter(e => e.officeId === officeId);
    allIncomes = allIncomes.filter(i => i.officeId === officeId);
  }

  // Combine and sort chronologically
  interface RawTx {
    date: string;
    officeName: string;
    type: 'Income' | 'Expense';
    categoryOrSource: string;
    titleOrDescription: string;
    vendorOrPayer: string;
    amount: number;
    paymentMode: string;
    status: string;
    remarks: string;
  }

  const allTx: RawTx[] = [];

  for (const inc of allIncomes) {
    allTx.push({
      date: inc.transactionDate,
      officeName: inc.officeName || 'Head Office',
      type: 'Income',
      categoryOrSource: inc.receivedFrom,
      titleOrDescription: inc.description || `Fund inflow from ${inc.receivedFrom}`,
      vendorOrPayer: inc.receivedFrom,
      amount: inc.amount,
      paymentMode: inc.paymentMode,
      status: 'Completed',
      remarks: inc.referenceNumber || '',
    });
  }

  for (const exp of allExpenses) {
    allTx.push({
      date: exp.expenseDate,
      officeName: exp.officeName || 'Head Office',
      type: 'Expense',
      categoryOrSource: exp.categoryName || 'General',
      titleOrDescription: exp.expenseTitle,
      vendorOrPayer: exp.vendor || '—',
      amount: exp.amount,
      paymentMode: exp.paymentMode,
      status: exp.status,
      remarks: exp.description || exp.billNumber || '',
    });
  }

  // Sort by date ascending
  allTx.sort((a, b) => a.date.localeCompare(b.date));

  // Determine starting opening balance
  let runningPaise = toPaise(baseOpening);
  const startDate = params?.startDate;
  const endDate = params?.endDate;

  const filteredTx: RawTx[] = [];

  for (const tx of allTx) {
    if (startDate && tx.date < startDate) {
      if (tx.type === 'Income') {
        runningPaise += toPaise(tx.amount);
      } else {
        runningPaise -= toPaise(tx.amount);
      }
    } else if (
      (!startDate || tx.date >= startDate) &&
      (!endDate || tx.date <= endDate)
    ) {
      filteredTx.push(tx);
    }
  }

  const initialOpeningBalance = fromPaise(runningPaise);
  let totalInflowPaise = 0;
  let totalOutflowPaise = 0;

  // Group filtered by date to establish Day-Wise opening balance
  const dateMap = new Map<string, RawTx[]>();
  filteredTx.forEach(tx => {
    const list = dateMap.get(tx.date) || [];
    list.push(tx);
    dateMap.set(tx.date, list);
  });

  const sortedDates = Array.from(dateMap.keys()).sort();
  const items: DayLedgerItem[] = [];

  for (const dateStr of sortedDates) {
    const txs = dateMap.get(dateStr)!;
    const dayOpeningBalance = fromPaise(runningPaise);
    let dayOfWeek = '—';
    try {
      dayOfWeek = format(parseISO(dateStr), 'EEEE');
    } catch {
      // ignore
    }

    for (const tx of txs) {
      const isInc = tx.type === 'Income';
      const amtPaise = toPaise(tx.amount);

      if (isInc) {
        runningPaise += amtPaise;
        totalInflowPaise += amtPaise;
      } else {
        runningPaise -= amtPaise;
        totalOutflowPaise += amtPaise;
      }

      items.push({
        date: tx.date,
        dayOfWeek,
        officeName: tx.officeName,
        openingBalance: dayOpeningBalance,
        type: tx.type,
        categoryOrSource: tx.categoryOrSource,
        titleOrDescription: tx.titleOrDescription,
        vendorOrPayer: tx.vendorOrPayer,
        inflow: isInc ? tx.amount : 0,
        outflow: isInc ? 0 : tx.amount,
        paymentMode: tx.paymentMode,
        runningBalance: fromPaise(runningPaise),
        status: tx.status,
        remarks: tx.remarks,
      });
    }
  }

  return {
    initialOpeningBalance,
    closingBalance: fromPaise(runningPaise),
    totalInflow: fromPaise(totalInflowPaise),
    totalOutflow: fromPaise(totalOutflowPaise),
    items,
  };
}

/**
 * Creates multi-sheet Excel Workbook with 'OverAll' and 'Details'
 */
export async function createTwoSheetWorkbook(options?: {
  title?: string;
  periodLabel?: string;
  startDate?: string;
  endDate?: string;
  officeId?: number | 'ALL';
}): Promise<XLSX.WorkBook> {
  const periodLabel = options?.periodLabel || 'All Recorded Operations';
  const reportTitle = options?.title || 'ExpenseFlow - Company Fund & Expense Audit Report';

  const ledger = await calculatePeriodLedger({
    startDate: options?.startDate,
    endDate: options?.endDate,
    officeId: options?.officeId,
  });

  // Calculate category breakdown
  const categoryMap = new Map<string, { count: number; totalPaise: number }>();
  const sourceMap = new Map<string, { count: number; totalPaise: number }>();

  for (const item of ledger.items) {
    if (item.type === 'Expense') {
      const cat = item.categoryOrSource || 'General';
      const cur = categoryMap.get(cat) || { count: 0, totalPaise: 0 };
      cur.count += 1;
      cur.totalPaise += toPaise(item.outflow);
      categoryMap.set(cat, cur);
    } else {
      const src = item.categoryOrSource || 'General';
      const cur = sourceMap.get(src) || { count: 0, totalPaise: 0 };
      cur.count += 1;
      cur.totalPaise += toPaise(item.inflow);
      sourceMap.set(src, cur);
    }
  }

  // --- SHEET 1: OverAll ---
  const overallRows: (string | number)[][] = [
    [reportTitle],
    [`Report Scope / Period:`, periodLabel],
    [`Generated On:`, format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
    [],
    [`========================================================`],
    [`EXECUTIVE FINANCIAL SUMMARY (OVERALL)`],
    [`========================================================`],
    [`Metric Description`, `Amount (INR)`, `Notes`],
    [`Period Opening Balance`, ledger.initialOpeningBalance, `Funds available at start of period`],
    [`Total Funds Inflow (+)`, ledger.totalInflow, `Incoming company funds & petty cash`],
    [`Total Expenses Outflow (-)`, ledger.totalOutflow, `Operational & day-wise expenditures`],
    [`Net Period Cash Flow`, ledger.totalInflow - ledger.totalOutflow, `Inflow minus Outflow`],
    [`Closing Available Balance`, ledger.closingBalance, `Available ending balance`],
    [`Total Logged Transactions`, ledger.items.length, `Count of all audited entries`],
    [],
    [`========================================================`],
    [`CATEGORY-WISE EXPENSE BREAKDOWN`],
    [`========================================================`],
    [`Category Name`, `Transactions Count`, `Total Spent (INR)`, `% of Total Expense`],
  ];

  const totalExpensePaise = toPaise(ledger.totalOutflow);
  const sortedCategories = Array.from(categoryMap.entries()).sort(
    (a, b) => b[1].totalPaise - a[1].totalPaise
  );

  for (const [catName, data] of sortedCategories) {
    const amt = fromPaise(data.totalPaise);
    const pct = totalExpensePaise > 0 ? ((data.totalPaise / totalExpensePaise) * 100).toFixed(1) + '%' : '0%';
    overallRows.push([catName, data.count, amt, pct]);
  }

  overallRows.push([], [`========================================================`], [`FUNDS INFLOW (RECEIVED FROM) SUMMARY`], [`========================================================`], [`Fund Source / Contributor`, `Transfer Count`, `Total Received (INR)`]);

  const sortedSources = Array.from(sourceMap.entries()).sort(
    (a, b) => b[1].totalPaise - a[1].totalPaise
  );
  for (const [srcName, data] of sortedSources) {
    overallRows.push([srcName, data.count, fromPaise(data.totalPaise)]);
  }

  const wsOverall = XLSX.utils.aoa_to_sheet(overallRows);
  wsOverall['!cols'] = [
    { wch: 32 },
    { wch: 22 },
    { wch: 36 },
    { wch: 20 },
  ];

  // --- SHEET 2: Details ---
  const detailsRows: (string | number)[][] = [
    [
      'Date',
      'Day',
      'Office / Branch',
      'Day Opening Balance (INR)',
      'Type',
      'Category / Source',
      'Description / Particulars',
      'Vendor / Payer',
      'Inflow (+) (INR)',
      'Outflow (-) (INR)',
      'Payment Mode',
      'Running Balance (INR)',
      'Status',
      'Reference / Notes',
    ],
  ];

  for (const row of ledger.items) {
    detailsRows.push([
      row.date,
      row.dayOfWeek,
      row.officeName || 'Head Office',
      row.openingBalance,
      row.type,
      row.categoryOrSource,
      row.titleOrDescription,
      row.vendorOrPayer,
      row.inflow > 0 ? row.inflow : 0,
      row.outflow > 0 ? row.outflow : 0,
      row.paymentMode,
      row.runningBalance,
      row.status,
      row.remarks,
    ]);
  }

  // Details Summary Row
  detailsRows.push([
    'TOTALS',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ledger.totalInflow,
    ledger.totalOutflow,
    '',
    ledger.closingBalance,
    '',
    '',
  ]);

  const wsDetails = XLSX.utils.aoa_to_sheet(detailsRows);
  wsDetails['!cols'] = [
    { wch: 12 }, // Date
    { wch: 11 }, // Day
    { wch: 25 }, // Day Opening Balance
    { wch: 10 }, // Type
    { wch: 26 }, // Category
    { wch: 32 }, // Description
    { wch: 20 }, // Vendor
    { wch: 16 }, // Inflow
    { wch: 16 }, // Outflow
    { wch: 14 }, // Payment Mode
    { wch: 22 }, // Running Balance
    { wch: 12 }, // Status
    { wch: 28 }, // Notes
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsOverall, 'OverAll');
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Details');

  return wb;
}

/**
 * Downloads a multi-sheet Excel file directly
 */
export async function downloadExcelReport(options?: {
  title?: string;
  periodLabel?: string;
  filename?: string;
  startDate?: string;
  endDate?: string;
  officeId?: number | 'ALL';
}): Promise<void> {
  const wb = await createTwoSheetWorkbook(options);
  const defaultFilename = options?.filename || `ExpenseFlow_Audit_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
  XLSX.writeFile(wb, defaultFilename);
}

/**
 * Exports Monthly Report as 2-sheet Excel
 */
export async function exportMonthlyExcel(yearMonth: string): Promise<void> {
  const [yearStr, monthStr] = yearMonth.split('-');
  const monthDate = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  const monthLabel = format(monthDate, 'MMMM yyyy');
  const startDate = `${yearMonth}-01`;
  const nextMonth = new Date(Number(yearStr), Number(monthStr), 0);
  const endDate = format(nextMonth, 'yyyy-MM-dd');

  await downloadExcelReport({
    title: `Monthly Financial Statement - ${monthLabel}`,
    periodLabel: monthLabel,
    startDate,
    endDate,
    filename: `ExpenseFlow_${monthLabel.replace(/\s+/g, '_')}_Statement.xlsx`,
  });
}

/**
 * Exports Weekly Report as 2-sheet Excel
 */
export async function exportWeeklyExcel(startDate: string, endDate: string, label: string): Promise<void> {
  await downloadExcelReport({
    title: `Weekly Financial Audit - ${label}`,
    periodLabel: label,
    startDate,
    endDate,
    filename: `ExpenseFlow_Weekly_${startDate}_to_${endDate}.xlsx`,
  });
}

/**
 * Generates Excel buffer for Live Auto-Sync / writing to connected file handle
 */
export async function getExcelArrayBuffer(): Promise<ArrayBuffer> {
  const wb = await createTwoSheetWorkbook();
  const raw = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return raw;
}

const MONTH_NAMES_LIST = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES_LIST = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Generates and downloads the Month-Wise Master Template Workbook (.xlsx)
 * with Summary sheet, tabs for each month (Nov-2026, Oct-2026, Sep-2026, etc.), and Month_Template
 */
export async function downloadMonthWiseTemplate(): Promise<void> {
  const allExpenses = await db.expenseRecords.toArray();
  const allIncomes = await db.incomeRecords.toArray();
  const setting = await db.settings.get('openingBalance');
  const baseOpening = setting ? Number(setting.value) || 0 : 2670;

  interface TxItem {
    date: string;
    day: string;
    office: string;
    type: 'Expense' | 'Fund Inflow';
    category: string;
    title: string;
    description: string;
    vendorOrPayer: string;
    paymentMode: string;
    inflow: number;
    outflow: number;
    runningBalance?: number;
    status: string;
    notes: string;
  }

  const allTx: TxItem[] = [];

  for (const inc of allIncomes) {
    const d = new Date(inc.transactionDate + 'T00:00:00');
    allTx.push({
      date: inc.transactionDate,
      day: DAY_NAMES_LIST[d.getDay()] || '',
      office: inc.officeName || 'Elegance Office',
      type: 'Fund Inflow',
      category: 'Company Fund / Deposit',
      title: `Petty Cash Deposit from ${inc.receivedFrom}`,
      description: inc.description || `Cash receipt from ${inc.receivedFrom}`,
      vendorOrPayer: inc.receivedFrom,
      paymentMode: inc.paymentMode || 'Cash',
      inflow: inc.amount,
      outflow: 0,
      status: inc.isVoid ? 'Void' : 'Completed',
      notes: inc.referenceNumber || '',
    });
  }

  for (const exp of allExpenses) {
    const d = new Date(exp.expenseDate + 'T00:00:00');
    allTx.push({
      date: exp.expenseDate,
      day: DAY_NAMES_LIST[d.getDay()] || '',
      office: exp.officeName || 'Elegance Office',
      type: 'Expense',
      category: exp.categoryName || 'General',
      title: exp.expenseTitle,
      description: exp.description || 'Operational office expense',
      vendorOrPayer: exp.vendor || 'Local Vendor',
      paymentMode: exp.paymentMode || 'Cash',
      inflow: 0,
      outflow: exp.amount,
      status: exp.status || 'Completed',
      notes: exp.billNumber || exp.description || '',
    });
  }

  allTx.sort((a, b) => a.date.localeCompare(b.date));

  let runningPaise = toPaise(baseOpening);
  allTx.forEach((tx) => {
    if (tx.status !== 'Void') {
      if (tx.inflow > 0) runningPaise += toPaise(tx.inflow);
      if (tx.outflow > 0) runningPaise -= toPaise(tx.outflow);
    }
    tx.runningBalance = fromPaise(runningPaise);
  });

  const monthGroups = new Map<string, TxItem[]>();
  allTx.forEach((tx) => {
    const m = tx.date.substring(0, 7);
    const existing = monthGroups.get(m) || [];
    existing.push(tx);
    monthGroups.set(m, existing);
  });

  const wb = XLSX.utils.book_new();

  const headers = [
    'Date',
    'Day',
    'Office / Branch',
    'Type',
    'Category / Source',
    'Item / Expense Title',
    'Description / Particulars',
    'Vendor / Payer',
    'Payment Mode',
    'Inflow (+) (INR)',
    'Outflow (-) (INR)',
    'Running Balance (INR)',
    'Status',
    'Reference / Notes',
  ];

  const colWidths = [
    { wch: 13 },
    { wch: 12 },
    { wch: 18 },
    { wch: 14 },
    { wch: 28 },
    { wch: 34 },
    { wch: 32 },
    { wch: 20 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 12 },
    { wch: 24 },
  ];

  const summaryRows: (string | number)[][] = [
    ['EXPENSEFLOW: OPERATIONS & AUDITED FUNDS MANAGER'],
    ['Central Multi-Month Master Sheet (Google Sheets & Excel Template)'],
    [`Generated On: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`],
    [],
    ['========================================================================'],
    ['MONTH-WISE FINANCIAL PERFORMANCE SUMMARY'],
    ['========================================================================'],
    ['Month Period', 'Transactions', 'Total Inflows (INR)', 'Total Outflows (INR)', 'Net Cash Flow (INR)', 'Month End Balance (INR)'],
  ];

  const sortedMonthKeys = Array.from(monthGroups.keys()).sort();

  for (const m of sortedMonthKeys) {
    const txList = monthGroups.get(m)!;
    const [yStr, mStr] = m.split('-');
    const mIdx = parseInt(mStr, 10) - 1;
    const sheetName = `${MONTH_NAMES_LIST[mIdx] || 'Mon'}-${yStr}`;

    let monthInflowPaise = 0;
    let monthOutflowPaise = 0;
    txList.forEach((t) => {
      if (t.status !== 'Void') {
        monthInflowPaise += toPaise(t.inflow);
        monthOutflowPaise += toPaise(t.outflow);
      }
    });

    const monthClosing = txList[txList.length - 1].runningBalance || 0;
    summaryRows.push([
      sheetName,
      txList.length,
      fromPaise(monthInflowPaise),
      fromPaise(monthOutflowPaise),
      fromPaise(monthInflowPaise - monthOutflowPaise),
      monthClosing,
    ]);

    const sheetRows: (string | number)[][] = [headers];
    for (const t of txList) {
      sheetRows.push([
        t.date,
        t.day,
        t.office,
        t.type,
        t.category,
        t.title,
        t.description,
        t.vendorOrPayer,
        t.paymentMode,
        t.inflow > 0 ? t.inflow : '',
        t.outflow > 0 ? t.outflow : '',
        t.runningBalance || 0,
        t.status,
        t.notes,
      ]);
    }

    sheetRows.push([
      'TOTALS',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      fromPaise(monthInflowPaise),
      fromPaise(monthOutflowPaise),
      monthClosing,
      '',
      `Total Records: ${txList.length}`,
    ]);

    const ws = XLSX.utils.aoa_to_sheet(sheetRows);
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const allInflowPaise = allTx.reduce((sum, t) => sum + (t.status !== 'Void' ? toPaise(t.inflow) : 0), 0);
  const allOutflowPaise = allTx.reduce((sum, t) => sum + (t.status !== 'Void' ? toPaise(t.outflow) : 0), 0);
  const finalBalance = allTx.length > 0 ? (allTx[allTx.length - 1].runningBalance || 0) : baseOpening;

  summaryRows.push([
    'ALL-TIME TOTAL',
    allTx.length,
    fromPaise(allInflowPaise),
    fromPaise(allOutflowPaise),
    fromPaise(allInflowPaise - allOutflowPaise),
    finalBalance,
  ]);

  const templateRows: (string | number)[][] = [
    headers,
    ['2026-12-01', 'Tuesday', 'Elegance Office', 'Fund Inflow', 'Company Fund / Deposit', 'Initial Month Deposit', 'Monthly Petty Cash', 'Rupesh Sir', 'Cash', 20000, '', 20000, 'Completed', 'REC-001'],
    ['2026-12-01', 'Tuesday', 'Elegance Office', 'Expense', 'Snacks & Refreshments (Nasto)', 'Tea & Snacks', 'Morning office tea', 'TeaPost', 'Cash', '', 120, 19880, 'Completed', 'EXP-001'],
    ['TOTALS', '', '', '', '', '', '', '', '', 20000, 120, 19880, '', 'Template Sample'],
  ];

  const wsTemplate = XLSX.utils.aoa_to_sheet(templateRows);
  wsTemplate['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Month_Template');

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 24 },
  ];

  wb.SheetNames.unshift('Summary');
  wb.Sheets['Summary'] = wsSummary;
  wb.SheetNames = ['Summary', ...sortedMonthKeys.map((m) => {
    const [y, mm] = m.split('-');
    return `${MONTH_NAMES_LIST[parseInt(mm, 10) - 1] || 'Mon'}-${y}`;
  }), 'Month_Template'];

  XLSX.writeFile(wb, 'Company_Expense_Master_Template_MonthWise.xlsx');
}
