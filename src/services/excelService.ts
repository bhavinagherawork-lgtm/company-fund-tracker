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
