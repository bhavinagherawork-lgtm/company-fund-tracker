import { db } from '../database/db';
import type { FinancialSummary, DailyExpenseSummary, WeeklyReportData, MonthlyReportData } from '../types';
import { toPaise, fromPaise } from '../utils/currency';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  isWithinInterval,
  format,
  eachDayOfInterval,
  subWeeks,
} from 'date-fns';

export async function getOpeningBalance(): Promise<number> {
  const setting = await db.settings.get('openingBalance');
  return setting ? Number(setting.value) || 0 : 0;
}

export async function setOpeningBalance(amount: number): Promise<void> {
  await db.settings.put({
    key: 'openingBalance',
    value: amount,
    description: 'Initial company cash/bank opening balance',
  });
}

/**
 * Computes overall financial summary with integer paise arithmetic
 */
export async function getFinancialSummary(officeId?: number | 'ALL'): Promise<FinancialSummary> {
  const isFiltered = officeId && officeId !== 'ALL';
  const baseOpening = await getOpeningBalance();
  const openingBalance = !isFiltered ? baseOpening : (officeId === 1 ? baseOpening : 0);

  let incomes = await db.incomeRecords.filter(i => !i.isVoid).toArray();
  let expenses = await db.expenseRecords.filter(e => e.status === 'Completed').toArray();

  if (isFiltered) {
    incomes = incomes.filter(i => i.officeId === officeId);
    expenses = expenses.filter(e => e.officeId === officeId);
  }

  const totalIncomePaise = incomes.reduce((acc, i) => acc + toPaise(i.amount), 0);
  const totalExpensePaise = expenses.reduce((acc, e) => acc + toPaise(e.amount), 0);
  const openingBalancePaise = toPaise(openingBalance);
  const availableBalancePaise = openingBalancePaise + totalIncomePaise - totalExpensePaise;

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  let currentWeekExpensePaise = 0;
  let currentMonthExpensePaise = 0;

  for (const exp of expenses) {
    try {
      const d = parseISO(exp.expenseDate);
      if (isWithinInterval(d, { start: weekStart, end: weekEnd })) {
        currentWeekExpensePaise += toPaise(exp.amount);
      }
      if (isWithinInterval(d, { start: monthStart, end: monthEnd })) {
        currentMonthExpensePaise += toPaise(exp.amount);
      }
    } catch {
      // ignore
    }
  }

  return {
    openingBalance,
    totalIncome: fromPaise(totalIncomePaise),
    totalExpense: fromPaise(totalExpensePaise),
    availableBalance: fromPaise(availableBalancePaise),
    currentWeekExpense: fromPaise(currentWeekExpensePaise),
    currentMonthExpense: fromPaise(currentMonthExpensePaise),
    totalTransactions: incomes.length + expenses.length,
  };
}

/**
 * Returns expenses grouped day-by-day (Day Wise view)
 */
export async function getDayWiseExpenses(officeId?: number | 'ALL'): Promise<DailyExpenseSummary[]> {
  let expenses = await db.expenseRecords.toArray();
  if (officeId && officeId !== 'ALL') {
    expenses = expenses.filter(e => e.officeId === officeId);
  }

  const groupMap = new Map<string, { totalPaise: number; list: typeof expenses }>();

  expenses.forEach(exp => {
    const dateKey = exp.expenseDate;
    const existing = groupMap.get(dateKey) || { totalPaise: 0, list: [] };
    if (exp.status === 'Completed') {
      existing.totalPaise += toPaise(exp.amount);
    }
    existing.list.push(exp);
    groupMap.set(dateKey, existing);
  });

  const sortedDates = Array.from(groupMap.keys()).sort((a, b) => b.localeCompare(a));

  return sortedDates.map(dateKey => {
    const val = groupMap.get(dateKey)!;
    let dayOfWeek = '—';
    try {
      dayOfWeek = format(parseISO(dateKey), 'EEEE');
    } catch {
      // ignore
    }
    return {
      date: dateKey,
      dayOfWeek,
      totalAmount: fromPaise(val.totalPaise),
      expenseCount: val.list.length,
      expenses: val.list,
    };
  });
}

/**
 * Computes weekly report (Monday to Sunday)
 */
export async function getWeeklyReport(weekOffset: number = 0, officeId?: number | 'ALL'): Promise<WeeklyReportData> {
  const baseDate = subWeeks(new Date(), weekOffset);
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });

  let expenses = await db.expenseRecords.filter(e => e.status === 'Completed').toArray();
  let incomes = await db.incomeRecords.filter(i => !i.isVoid).toArray();

  if (officeId && officeId !== 'ALL') {
    expenses = expenses.filter(e => e.officeId === officeId);
    incomes = incomes.filter(i => i.officeId === officeId);
  }

  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const dayMap = new Map<string, number>();
  daysInWeek.forEach(d => {
    dayMap.set(format(d, 'yyyy-MM-dd'), 0);
  });

  let totalExpensePaise = 0;
  let totalIncomePaise = 0;
  const categoryMap = new Map<string, { amountPaise: number; color: string }>();

  // Filter expenses for this week
  for (const exp of expenses) {
    try {
      const expDate = parseISO(exp.expenseDate);
      if (isWithinInterval(expDate, { start: weekStart, end: weekEnd })) {
        const amtPaise = toPaise(exp.amount);
        totalExpensePaise += amtPaise;

        const dateStr = exp.expenseDate;
        dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + amtPaise);

        const catName = exp.categoryName || 'General';
        const existingCat = categoryMap.get(catName) || { amountPaise: 0, color: '#3b82f6' };
        existingCat.amountPaise += amtPaise;
        categoryMap.set(catName, existingCat);
      }
    } catch {
      // ignore
    }
  }

  // Filter incomes for this week
  for (const inc of incomes) {
    try {
      const incDate = parseISO(inc.transactionDate);
      if (isWithinInterval(incDate, { start: weekStart, end: weekEnd })) {
        totalIncomePaise += toPaise(inc.amount);
      }
    } catch {
      // ignore
    }
  }

  const dayBreakdown = daysInWeek.map(d => {
    const dateStr = format(d, 'yyyy-MM-dd');
    return {
      day: format(d, 'EEE (dd MMM)'),
      date: dateStr,
      amount: fromPaise(dayMap.get(dateStr) || 0),
    };
  });

  const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, val]) => ({
    name,
    amount: fromPaise(val.amountPaise),
    color: val.color,
  }));

  const weekLabel = `${format(weekStart, 'dd MMM yyyy')} – ${format(weekEnd, 'dd MMM yyyy')}`;

  return {
    weekLabel,
    startDate: format(weekStart, 'yyyy-MM-dd'),
    endDate: format(weekEnd, 'yyyy-MM-dd'),
    totalExpense: fromPaise(totalExpensePaise),
    totalIncome: fromPaise(totalIncomePaise),
    netCashFlow: fromPaise(totalIncomePaise - totalExpensePaise),
    dayBreakdown,
    categoryBreakdown,
  };
}

/**
 * Computes monthly report for a given YYYY-MM
 */
export async function getMonthlyReport(yearMonth?: string, officeId?: number | 'ALL'): Promise<MonthlyReportData> {
  const currentKey = yearMonth || format(new Date(), 'yyyy-MM');
  const [yearStr, monthStr] = currentKey.split('-');
  const monthDate = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  const mStart = startOfMonth(monthDate);
  const mEnd = endOfMonth(monthDate);

  let expenses = await db.expenseRecords.filter(e => e.status === 'Completed').toArray();
  let incomes = await db.incomeRecords.filter(i => !i.isVoid).toArray();

  if (officeId && officeId !== 'ALL') {
    expenses = expenses.filter(e => e.officeId === officeId);
    incomes = incomes.filter(i => i.officeId === officeId);
  }

  const rawOpening = await getOpeningBalance();
  const effectiveBaseOpening = (!officeId || officeId === 'ALL' || officeId === 1) ? rawOpening : 0;

  let priorIncomePaise = 0;
  let priorExpensePaise = 0;
  let monthIncomePaise = 0;
  let monthExpensePaise = 0;
  const catMap = new Map<string, { amountPaise: number; color: string; count: number }>();
  const monthExpensesList: typeof expenses = [];

  for (const exp of expenses) {
    try {
      const d = parseISO(exp.expenseDate);
      if (d < mStart) {
        priorExpensePaise += toPaise(exp.amount);
      } else if (isWithinInterval(d, { start: mStart, end: mEnd })) {
        const amtPaise = toPaise(exp.amount);
        monthExpensePaise += amtPaise;
        monthExpensesList.push(exp);

        const catName = exp.categoryName || 'General';
        const existing = catMap.get(catName) || { amountPaise: 0, color: '#3b82f6', count: 0 };
        existing.amountPaise += amtPaise;
        existing.count += 1;
        catMap.set(catName, existing);
      }
    } catch {
      // ignore
    }
  }

  for (const inc of incomes) {
    try {
      const d = parseISO(inc.transactionDate);
      if (d < mStart) {
        priorIncomePaise += toPaise(inc.amount);
      } else if (isWithinInterval(d, { start: mStart, end: mEnd })) {
        monthIncomePaise += toPaise(inc.amount);
      }
    } catch {
      // ignore
    }
  }

  const openingBalance = fromPaise(toPaise(effectiveBaseOpening) + priorIncomePaise - priorExpensePaise);

  const categoryBreakdown = Array.from(catMap.entries()).map(([name, val]) => ({
    name,
    amount: fromPaise(val.amountPaise),
    color: val.color,
    count: val.count,
  })).sort((a, b) => b.amount - a.amount);

  const totalExpense = fromPaise(monthExpensePaise);
  const totalIncome = fromPaise(monthIncomePaise);
  const closingBalance = openingBalance + totalIncome - totalExpense;

  return {
    monthLabel: format(monthDate, 'MMMM yyyy'),
    yearMonth: currentKey,
    openingBalance,
    totalIncome,
    totalExpense,
    closingBalance,
    categoryBreakdown,
    topExpenses: monthExpensesList.sort((a, b) => b.amount - a.amount).slice(0, 10),
  };
}

/**
 * Returns Category-wise stats for donut charts
 */
export async function getCategoryChartStats(): Promise<{ name: string; value: number; color: string }[]> {
  const categories = await db.expenseCategories.toArray();
  const expenses = await db.expenseRecords.filter(e => e.status === 'Completed').toArray();

  const map = new Map<string, { amountPaise: number; color: string }>();
  categories.forEach(c => {
    map.set(c.name, { amountPaise: 0, color: c.color });
  });

  for (const exp of expenses) {
    const catName = exp.categoryName || 'Other';
    const existing = map.get(catName) || { amountPaise: 0, color: '#94a3b8' };
    existing.amountPaise += toPaise(exp.amount);
    map.set(catName, existing);
  }

  return Array.from(map.entries())
    .filter(([_, v]) => v.amountPaise > 0)
    .map(([name, v]) => ({
      name,
      value: fromPaise(v.amountPaise),
      color: v.color,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Monthly trend comparing Income and Expense for bar charts
 */
export async function getMonthlyTrendChartStats(): Promise<{ month: string; income: number; expense: number }[]> {
  const incomes = await db.incomeRecords.filter(i => !i.isVoid).toArray();
  const expenses = await db.expenseRecords.filter(e => e.status === 'Completed').toArray();

  const map = new Map<string, { incPaise: number; expPaise: number }>();

  incomes.forEach(i => {
    const key = i.transactionDate.substring(0, 7);
    const curr = map.get(key) || { incPaise: 0, expPaise: 0 };
    curr.incPaise += toPaise(i.amount);
    map.set(key, curr);
  });

  expenses.forEach(e => {
    const key = e.expenseDate.substring(0, 7);
    const curr = map.get(key) || { incPaise: 0, expPaise: 0 };
    curr.expPaise += toPaise(e.amount);
    map.set(key, curr);
  });

  const sortedKeys = Array.from(map.keys()).sort();

  return sortedKeys.map(key => {
    const [y, m] = key.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    const label = format(d, 'MMM yy');
    const v = map.get(key)!;
    return {
      month: label,
      income: fromPaise(v.incPaise),
      expense: fromPaise(v.expPaise),
    };
  });
}
