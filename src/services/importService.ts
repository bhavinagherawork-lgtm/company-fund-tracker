import { db } from '../database/db';
import type { IncomeRecord, ExpenseRecord } from '../types';

function parseCSVLine(line: string): string[] {
  const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
  const cols: string[] = [];
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match.index === regex.lastIndex) regex.lastIndex++;
    cols.push((match[1] || match[2] || '').trim());
  }
  return cols;
}

export async function importGoogleSheetCSV(content: string): Promise<{ incomesAdded: number; expensesAdded: number }> {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const existingExpenses = await db.expenseRecords.toArray();
  const existingIncomes = await db.incomeRecords.toArray();
  const existingCategories = await db.expenseCategories.toArray();
  const defaultCategory = existingCategories[0] || { id: 1, name: 'Snacks & Refreshments (Nasto)' };

  const eleganceOffice = (await db.offices.filter(o => o.name.toLowerCase().includes('elegance')).first())
    || (await db.offices.where('isDefault').equals(1).first())
    || (await db.offices.toCollection().first());
  const sheetOfficeId = eleganceOffice?.id;
  const sheetOfficeName = eleganceOffice?.name || 'Elegance Office';

  const matchedExpenseIds = new Set<number>();
  const matchedIncomeIds = new Set<number>();
  let expensesAdded = 0;
  let incomesAdded = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().startsWith('date,') || line.startsWith(',,,,') || !line.includes(',')) continue;

    const cols = parseCSVLine(line);
    const [rawDate, day, rawRemarks, rawIncome, rawExpense] = cols;

    if (!rawDate || !rawDate.includes('/')) continue;

    const parts = rawDate.split('/');
    let p0 = Number(parts[0]);
    let p1 = Number(parts[1]);
    let p2 = Number(parts[2] ? (parts[2].length === 2 ? `20${parts[2]}` : parts[2]) : '2026');

    let d = p0;
    let m = p1;
    if (p0 > 12) { d = p0; m = p1; }
    else if (p1 > 12) { d = p1; m = p0; }
    else {
      if (p1 === 11 || p1 === 10 || p1 === 9) { d = p0; m = p1; }
      else if (p0 === 11 || p0 === 10 || p0 === 9) { d = p1; m = p0; }
    }

    const dateFormatted = `${p2}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const incomeVal = Number(String(rawIncome || '').replace(/[^0-9.]/g, '')) || 0;
    const expenseVal = Number(String(rawExpense || '').replace(/[^0-9.]/g, '')) || 0;
    const remarks = rawRemarks || '';

    if (incomeVal > 0) {
      let source = 'Rupesh Sir';
      if (remarks.toLowerCase().includes('hardik')) {
        source = 'Hardikbhai';
      }

      const match = existingIncomes.find(
        inc => !matchedIncomeIds.has(inc.id!) &&
               inc.transactionDate === dateFormatted &&
               Math.abs(inc.amount - incomeVal) < 0.01
      );

      if (match) {
        matchedIncomeIds.add(match.id!);
      } else {
        const newId = await db.incomeRecords.add({
          transactionDate: dateFormatted,
          receivedFrom: source,
          amount: incomeVal,
          paymentMode: 'Cash',
          referenceNumber: remarks.length > 60 ? remarks.substring(0, 60) : remarks,
          description: `Imported Petty Cash from ${source}`,
          isVoid: false,
          officeId: sheetOfficeId,
          officeName: sheetOfficeName,
          createdAt: new Date().toISOString(),
        });
        matchedIncomeIds.add(newId as number);
        existingIncomes.push({
          id: newId as number,
          transactionDate: dateFormatted,
          receivedFrom: source,
          amount: incomeVal,
          paymentMode: 'Cash',
          isVoid: false,
          createdAt: new Date().toISOString(),
        });
        incomesAdded++;
      }
    }

    if (expenseVal > 0) {
      let title = remarks;
      if (title.includes('Petty Cash')) {
        title = title.replace(/,?Petty Cash Collected[^\,]*/i, '').trim();
        if (!title) title = 'Office Expense';
      }
      if (!title.trim()) title = 'Office Sundry Expense';

      let cat = defaultCategory;
      const lower = title.toLowerCase();
      if (lower.includes('tea') || lower.includes('coffee') || lower.includes('soda') || lower.includes('drink')) {
        cat = existingCategories.find(c => c.id === 2) || defaultCategory;
      } else if (lower.includes('post') || lower.includes('courier')) {
        cat = existingCategories.find(c => c.id === 6) || defaultCategory;
      } else if (lower.includes('tape') || lower.includes('stapler') || lower.includes('stationery') || lower.includes('bag')) {
        cat = existingCategories.find(c => c.id === 3) || defaultCategory;
      } else if (lower.includes('repair') || lower.includes('cleaning') || lower.includes('saaf') || lower.includes('bathroom')) {
        cat = existingCategories.find(c => c.id === 4) || defaultCategory;
      } else if (lower.includes('client') || lower.includes('guest')) {
        cat = existingCategories.find(c => c.id === 5) || defaultCategory;
      }

      let vendor = title.split('(')[0].split(',')[0].trim();
      if (!vendor || vendor.length < 2) vendor = 'Local Vendor';

      const match = existingExpenses.find(
        exp => !matchedExpenseIds.has(exp.id!) &&
               exp.expenseDate === dateFormatted &&
               Math.abs(exp.amount - expenseVal) < 0.01
      );

      if (match) {
        matchedExpenseIds.add(match.id!);
      } else {
        const newId = await db.expenseRecords.add({
          expenseDate: dateFormatted,
          categoryId: cat.id!,
          categoryName: cat.name,
          expenseTitle: title,
          description: `${day ? day.charAt(0).toUpperCase() + day.slice(1) : 'Daily'} expense imported from sheet`,
          amount: expenseVal,
          paymentMode: 'Cash',
          vendor,
          status: 'Completed',
          officeId: sheetOfficeId,
          officeName: sheetOfficeName,
          createdAt: new Date().toISOString(),
        });
        matchedExpenseIds.add(newId as number);
        existingExpenses.push({
          id: newId as number,
          expenseDate: dateFormatted,
          categoryId: cat.id!,
          categoryName: cat.name,
          expenseTitle: title,
          amount: expenseVal,
          paymentMode: 'Cash',
          vendor,
          status: 'Completed',
          createdAt: new Date().toISOString(),
        });
        expensesAdded++;
      }
    }
  }

  return { incomesAdded, expensesAdded };
}
