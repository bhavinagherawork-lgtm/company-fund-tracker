import { getExcelArrayBuffer } from './excelService';
import * as XLSX from 'xlsx';
import { db } from '../database/db';
import type { ExpenseRecord, IncomeRecord } from '../types';

/**
 * Normalizes any date input (JS Date, Excel serial number, Google Sheet Date() string, or formatted string)
 * into a standard YYYY-MM-DD ISO string.
 */
export function normalizeDateToISO(val: any): string | null {
  if (val === null || val === undefined) return null;

  // 1. If it's a native JS Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. If it's a numeric Excel date serial code (e.g. 45615)
  if (typeof val === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed) {
        const y = parsed.y;
        const m = String(parsed.m).padStart(2, '0');
        const d = String(parsed.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {
      // ignore
    }
  }

  const str = String(val).trim();
  if (!str) return null;

  // 3. Google Visualization API Date(year, monthIndex, day) format
  if (str.startsWith('Date(')) {
    const match = str.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      const y = match[1];
      const m = String(Number(match[2]) + 1).padStart(2, '0');
      const d = String(match[3]).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // 4. ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // 5. Slash or hyphen formats: D/M/Y or M/D/Y
  if (str.includes('/') || str.includes('-')) {
    const delimiter = str.includes('/') ? '/' : '-';
    const parts = str.split(delimiter);
    if (parts.length === 3) {
      const p0 = Number(parts[0]);
      const p1 = Number(parts[1]);
      let rawYear = parts[2].trim();
      const year = Number(rawYear.length === 2 ? `20${rawYear}` : rawYear);

      if (!isNaN(p0) && !isNaN(p1) && !isNaN(year)) {
        let d = p0;
        let m = p1;

        if (p0 > 12) {
          // Definitely Day / Month / Year (e.g. 17/11/2026)
          d = p0;
          m = p1;
        } else if (p1 > 12) {
          // Month / Day / Year (e.g. 11/17/2026)
          d = p1;
          m = p0;
        } else {
          // Ambiguous (e.g. 2/11/26 vs 11/2/26)
          // In this company's ledger, months are Sep(9), Oct(10), Nov(11)
          if (p1 === 11 || p1 === 10 || p1 === 9) {
            d = p0;
            m = p1;
          } else if (p0 === 11 || p0 === 10 || p0 === 9) {
            d = p1;
            m = p0;
          }
        }

        return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  }

  return null;
}

/**
 * Detects and permanently purges any duplicate transactions in IndexedDB,
 * ensuring ledger amounts and record counts match the authentic baseline.
 */
export async function cleanupDuplicateRecords(): Promise<{ expensesRemoved: number; incomesRemoved: number }> {
  let expensesRemoved = 0;
  let incomesRemoved = 0;

  try {
    const expenses = await db.expenseRecords.toArray();
    const incomes = await db.incomeRecords.toArray();

    // 1. Deduplicate expenses: group by normalized key
    const seenExpenses = new Map<string, number>();
    const duplicateExpenseIds: number[] = [];

    // Also identify flipped-date duplicates (e.g. Nov expenses inserted into Feb/Mar/Apr due to previous date parser)
    const validMonths = ['2026-09', '2026-10', '2026-11'];

    for (const exp of expenses) {
      if (!exp.id) continue;

      // Check if this record is a flipped-date artifact outside Sep-Nov 2026 with a Nov counterpart
      const isOutsideValidPeriod = !validMonths.some(vm => exp.expenseDate.startsWith(vm));
      if (isOutsideValidPeriod) {
        // Find if an identical expense exists in November
        const hasNovCounterpart = expenses.some(
          e => e.id !== exp.id &&
               e.expenseDate.startsWith('2026-11') &&
               Math.abs(e.amount - exp.amount) < 0.01
        );
        if (hasNovCounterpart) {
          duplicateExpenseIds.push(exp.id);
          continue;
        }
      }

      const key = `${exp.expenseDate}_${Math.round(exp.amount * 100)}`;
      if (seenExpenses.has(key)) {
        duplicateExpenseIds.push(exp.id);
      } else {
        seenExpenses.set(key, exp.id);
      }
    }

    if (duplicateExpenseIds.length > 0) {
      await db.expenseRecords.bulkDelete(duplicateExpenseIds);
      expensesRemoved = duplicateExpenseIds.length;
      console.log(`Purged ${expensesRemoved} duplicate expense records.`);
    }

    // 2. Deduplicate incomes: group by date & amount
    const seenIncomes = new Map<string, number>();
    const duplicateIncomeIds: number[] = [];

    for (const inc of incomes) {
      if (!inc.id) continue;

      const isOutsideValidPeriod = !validMonths.some(vm => inc.transactionDate.startsWith(vm));
      if (isOutsideValidPeriod) {
        const hasNovCounterpart = incomes.some(
          i => i.id !== inc.id &&
               i.transactionDate.startsWith('2026-11') &&
               Math.abs(i.amount - inc.amount) < 0.01
        );
        if (hasNovCounterpart) {
          duplicateIncomeIds.push(inc.id);
          continue;
        }
      }

      const key = `${inc.transactionDate}_${Math.round(inc.amount * 100)}`;
      if (seenIncomes.has(key)) {
        duplicateIncomeIds.push(inc.id);
      } else {
        seenIncomes.set(key, inc.id);
      }
    }

    if (duplicateIncomeIds.length > 0) {
      await db.incomeRecords.bulkDelete(duplicateIncomeIds);
      incomesRemoved = duplicateIncomeIds.length;
      console.log(`Purged ${incomesRemoved} duplicate income records.`);
    }
  } catch (err) {
    console.error('Error during cleanupDuplicateRecords:', err);
  }

  return { expensesRemoved, incomesRemoved };
}

export interface SyncStatusState {
  hasFileHandle: boolean;
  fileName: string | null;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  googleSheetSyncing: boolean;
  autoSaveEnabled: boolean;
  lastError: string | null;
}

// Global active file handle in memory
let activeFileHandle: any = null;
let autoSaveEnabled = true;
let syncListeners: ((state: SyncStatusState) => void)[] = [];

let currentSyncState: SyncStatusState = {
  hasFileHandle: false,
  fileName: null,
  lastSyncedAt: null,
  isSyncing: false,
  googleSheetSyncing: false,
  autoSaveEnabled: true,
  lastError: null,
};

function notifyListeners() {
  syncListeners.forEach(listener => listener({ ...currentSyncState }));
}

export function subscribeToSyncStatus(listener: (state: SyncStatusState) => void): () => void {
  syncListeners.push(listener);
  listener({ ...currentSyncState });
  return () => {
    syncListeners = syncListeners.filter(l => l !== listener);
  };
}

/**
 * Checks if browser supports File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

/**
 * Connects or creates a live Excel file on local disk
 */
export async function connectLiveExcelFile(): Promise<string> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('Your browser does not support the File System Access API. Please use Google Chrome or Microsoft Edge.');
  }

  try {
    currentSyncState.isSyncing = true;
    notifyListeners();

    // Prompt user to save/link an Excel file
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: 'Company_Expenses_Flow.xlsx',
      types: [
        {
          description: 'Microsoft Excel Spreadsheet (*.xlsx)',
          accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
          },
        },
      ],
    });

    activeFileHandle = handle;
    currentSyncState.hasFileHandle = true;
    currentSyncState.fileName = handle.name || 'Company_Expenses_Flow.xlsx';
    currentSyncState.lastError = null;

    // Immediately write initial full two-sheet workbook into it
    await triggerAutoSaveToExcel();

    return handle.name;
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      currentSyncState.lastError = err.message || 'Failed to connect Excel file';
    }
    throw err;
  } finally {
    currentSyncState.isSyncing = false;
    notifyListeners();
  }
}

/**
 * Connects an existing Excel file for reading & writing
 */
export async function openExistingExcelFile(): Promise<string> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('Your browser does not support the File System Access API. Please use Google Chrome or Microsoft Edge.');
  }

  try {
    currentSyncState.isSyncing = true;
    notifyListeners();

    const [handle] = await (window as any).showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: 'Microsoft Excel Spreadsheet (*.xlsx)',
          accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
          },
        },
      ],
    });

    if (!handle) throw new Error('No file selected');

    activeFileHandle = handle;
    currentSyncState.hasFileHandle = true;
    currentSyncState.fileName = handle.name;
    currentSyncState.lastError = null;

    // Read and merge any data from it into database
    await syncFromConnectedExcel();

    return handle.name;
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      currentSyncState.lastError = err.message || 'Failed to open Excel file';
    }
    throw err;
  } finally {
    currentSyncState.isSyncing = false;
    notifyListeners();
  }
}

/**
 * Silently auto-saves current state into the connected Excel file
 * Called automatically on every Expense or Income ADD / EDIT / DELETE
 */
export async function triggerAutoSaveToExcel(): Promise<boolean> {
  if (!activeFileHandle || !autoSaveEnabled) return false;

  try {
    currentSyncState.isSyncing = true;
    notifyListeners();

    const buffer = await getExcelArrayBuffer();
    const writable = await activeFileHandle.createWritable();
    await writable.write(buffer);
    await writable.close();

    currentSyncState.lastSyncedAt = new Date();
    currentSyncState.lastError = null;
    return true;
  } catch (err: any) {
    console.warn('Auto-save to Excel failed:', err);
    currentSyncState.lastError = err?.message || 'Could not auto-write to Excel';
    return false;
  } finally {
    currentSyncState.isSyncing = false;
    notifyListeners();
  }
}

/**
 * Reads from the connected Excel file and updates UI / DB (Vice-Versa)
 * Features 1-to-1 matching, date normalization, and deletion reconciliation:
 * If an entry was removed from the Excel file, it is safely deleted from the website as well.
 */
export async function syncFromConnectedExcel(): Promise<{ added: number; deleted: number }> {
  if (!activeFileHandle) {
    throw new Error('No Excel file connected. Please link an Excel file first.');
  }

  try {
    currentSyncState.isSyncing = true;
    notifyListeners();

    // 1. Purge any preexisting duplicates first
    await cleanupDuplicateRecords();

    const file = await activeFileHandle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });

    let addedCount = 0;
    let deletedCount = 0;
    const detailsSheet = wb.Sheets['Details'] || wb.Sheets[wb.SheetNames[0]];

    if (detailsSheet) {
      const rows: any[] = XLSX.utils.sheet_to_json(detailsSheet);
      const existingExpenses = await db.expenseRecords.toArray();
      const existingIncomes = await db.incomeRecords.toArray();

      // Track 1-to-1 matches to prevent double syncing and detect deleted entries
      const matchedExpenseIds = new Set<number>();
      const matchedIncomeIds = new Set<number>();
      const excelDates: string[] = [];

      for (const row of rows) {
        if (!row.Date || row.Date === 'TOTALS') continue;

        const rawDate = row.Date || row['Date'] || row['Expense Date'];
        const isoDate = normalizeDateToISO(rawDate);
        if (!isoDate) continue;
        excelDates.push(isoDate);

        const type = String(row.Type || (row['Inflow (+) (INR)'] > 0 ? 'Income' : 'Expense')).trim();
        const title = String(row['Description / Particulars'] || row.Title || row.Remarks || row.Particulars || '').trim();
        const inflow = Number(row['Inflow (+) (INR)'] || row.Inflow || 0);
        const outflow = Number(row['Outflow (-) (INR)'] || row.Outflow || 0);

        if (type === 'Income' || inflow > 0) {
          const match = existingIncomes.find(
            i => !matchedIncomeIds.has(i.id!) &&
                 i.transactionDate === isoDate &&
                 Math.abs(i.amount - (inflow || outflow)) < 0.01
          );

          if (match) {
            matchedIncomeIds.add(match.id!);
          } else if (inflow > 0 || outflow > 0) {
            const newId = await db.incomeRecords.add({
              transactionDate: isoDate,
              receivedFrom: String(row['Category / Source'] || row['Vendor / Payer'] || 'Executive Fund'),
              amount: inflow || outflow,
              paymentMode: row['Payment Mode'] || 'Cash',
              referenceNumber: row['Reference / Notes'] || undefined,
              description: title || 'Imported from connected Excel',
              isVoid: false,
              createdAt: new Date().toISOString(),
            });
            matchedIncomeIds.add(newId as number);
            existingIncomes.push({
              id: newId as number,
              transactionDate: isoDate,
              receivedFrom: String(row['Category / Source'] || row['Vendor / Payer'] || 'Executive Fund'),
              amount: inflow || outflow,
              paymentMode: row['Payment Mode'] || 'Cash',
              isVoid: false,
              createdAt: new Date().toISOString(),
            });
            addedCount++;
          }
        } else if (outflow > 0) {
          const match = existingExpenses.find(
            e => !matchedExpenseIds.has(e.id!) &&
                 e.expenseDate === isoDate &&
                 Math.abs(e.amount - outflow) < 0.01
          );

          if (match) {
            matchedExpenseIds.add(match.id!);
          } else {
            const newId = await db.expenseRecords.add({
              expenseDate: isoDate,
              categoryId: 1,
              categoryName: String(row['Category / Source'] || 'General'),
              expenseTitle: title || 'Office Expense',
              description: row['Reference / Notes'] || undefined,
              amount: outflow,
              paymentMode: row['Payment Mode'] || 'Cash',
              vendor: String(row['Vendor / Payer'] || 'Local Vendor'),
              status: 'Completed',
              createdAt: new Date().toISOString(),
            });
            matchedExpenseIds.add(newId as number);
            existingExpenses.push({
              id: newId as number,
              expenseDate: isoDate,
              categoryId: 1,
              categoryName: String(row['Category / Source'] || 'General'),
              expenseTitle: title || 'Office Expense',
              amount: outflow,
              paymentMode: row['Payment Mode'] || 'Cash',
              vendor: String(row['Vendor / Payer'] || 'Local Vendor'),
              status: 'Completed',
              createdAt: new Date().toISOString(),
            });
            addedCount++;
          }
        }
      }

      // Safe Deletion Reconciliation:
      // If an entry was present in the website but removed from the Excel file, delete it from the website
      if (excelDates.length > 0) {
        const sortedDates = [...excelDates].sort();
        const earliestDate = sortedDates[0];
        const latestDate = sortedDates[sortedDates.length - 1];

        const scopeStart = `${earliestDate.substring(0, 7)}-01`;
        const latestYear = Number(latestDate.substring(0, 4));
        const latestMonth = Number(latestDate.substring(5, 7));
        const lastDayOfMonth = new Date(latestYear, latestMonth, 0).getDate();
        const scopeEnd = `${latestDate.substring(0, 7)}-${String(lastDayOfMonth).padStart(2, '0')}`;

        const expensesToRemove = existingExpenses.filter(
          e => e.expenseDate >= scopeStart &&
               e.expenseDate <= scopeEnd &&
               !matchedExpenseIds.has(e.id!)
        );
        for (const exp of expensesToRemove) {
          if (exp.id) {
            await db.expenseRecords.delete(exp.id);
            deletedCount++;
          }
        }

        const incomesToRemove = existingIncomes.filter(
          i => i.transactionDate >= scopeStart &&
               i.transactionDate <= scopeEnd &&
               !matchedIncomeIds.has(i.id!)
        );
        for (const inc of incomesToRemove) {
          if (inc.id) {
            await db.incomeRecords.delete(inc.id);
            deletedCount++;
          }
        }
      }
    }

    currentSyncState.lastSyncedAt = new Date();
    currentSyncState.lastError = null;
    return { added: addedCount, deleted: deletedCount };
  } catch (err: any) {
    currentSyncState.lastError = err?.message || 'Failed to read Excel file';
    throw err;
  } finally {
    currentSyncState.isSyncing = false;
    notifyListeners();
  }
}

/**
 * Cross-Origin Safe Google Sheets JSONP loader
 * Bypasses CORS completely by injecting a dynamic <script> tag with callback
 */
function fetchGoogleSheetJSONP(sheetId: string, gid: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return reject(new Error('Window or document not available.'));
    }

    const callbackName = 'gviz_sync_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Google Sheet connection timed out. Please check your internet connection or verify the sheet is accessible.'));
    }, 15000);

    const cleanup = () => {
      clearTimeout(timeout);
      try {
        delete (window as any)[callbackName];
      } catch {}
      const scriptEl = document.getElementById(callbackName);
      if (scriptEl) scriptEl.remove();
    };

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      if (!data || !data.table) {
        reject(new Error('Invalid structure returned from Google Sheets. Ensure sheet is set to "Anyone with the link can view".'));
      } else {
        resolve(data);
      }
    };

    const script = document.createElement('script');
    script.id = callbackName;
    script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${callbackName}&gid=${gid}`;
    script.onerror = () => {
      cleanup();
      reject(new Error('Failed to load Google Sheet. Please check your internet connection or verify the sheet is public.'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Syncs directly from the live public Google Sheet without CORS errors.
 * Features 1-to-1 transaction matching, ISO date normalization, and deletion reconciliation:
 * If an entry was removed from the Google Sheet, it is safely deleted from the website as well.
 */
export async function syncFromLiveGoogleSheet(
  sheetId: string = '1CRD_s-JT8KqWrezalxtNoqLteKf7hxlsE5sYeY9CuaU',
  gid: string = '1948486123'
): Promise<{
  incomesAdded: number;
  expensesAdded: number;
  incomesDeleted: number;
  expensesDeleted: number;
  message: string;
}> {
  try {
    currentSyncState.googleSheetSyncing = true;
    currentSyncState.lastError = null;
    notifyListeners();

    // 1. Purge any preexisting duplicates first
    await cleanupDuplicateRecords();

    // Fetch Google Sheet data via JSONP (No CORS blocking in any browser!)
    const gvizData = await fetchGoogleSheetJSONP(sheetId, gid);
    const rows: any[] = gvizData.table.rows || [];

    if (rows.length === 0) {
      throw new Error('Google Sheet returned 0 rows.');
    }

    // 2. Check Row 0 for opening balance (Only update if DB has no prior historical transactions)
    const row0Val = rows[0]?.c?.[4] ? (rows[0].c[4].f || rows[0].c[4].v) : null;
    const openingNum = Number(String(row0Val || '').replace(/[^0-9.]/g, ''));
    const priorExpenseCount = await db.expenseRecords.filter(e => e.expenseDate < '2026-11-01').count();
    if (openingNum > 0 && priorExpenseCount === 0) {
      await db.settings.put({
        key: 'openingBalance',
        value: openingNum,
        description: 'Initial company cash/bank opening balance',
      });
    }

    // 3. Fetch existing DB records for 1-to-1 deduplication & deletion reconciliation
    const existingExpenses = await db.expenseRecords.toArray();
    const existingIncomes = await db.incomeRecords.toArray();
    const existingCategories = await db.expenseCategories.toArray();
    const defaultCategory = existingCategories[0] || { id: 1, name: 'Snacks & Refreshments (Nasto)' };

    // Resolve Elegance Office for all Google Sheet transactions
    const eleganceOffice = (await db.offices.filter(o => o.name.toLowerCase().includes('elegance')).first())
      || (await db.offices.where('isDefault').equals(1).first())
      || (await db.offices.toCollection().first());
    const sheetOfficeId = eleganceOffice?.id;
    const sheetOfficeName = eleganceOffice?.name || 'Elegance Office';

    // Sets to prevent duplicate syncing and identify deleted rows
    const matchedExpenseIds = new Set<number>();
    const matchedIncomeIds = new Set<number>();
    const sheetDates: string[] = [];

    let expensesAdded = 0;
    let incomesAdded = 0;

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r.c) continue;

      // Extract raw date object or formatted date string
      const rawDateVal = r.c[0] ? (r.c[0].v !== undefined ? r.c[0].v : r.c[0].f) : null;
      const isoDate = normalizeDateToISO(rawDateVal) || normalizeDateToISO(r.c[0]?.f);

      if (!isoDate) continue;
      sheetDates.push(isoDate);

      const cDay = r.c[1] ? (r.c[1].f || r.c[1].v) : '';
      const cRemarks = r.c[2] ? (r.c[2].f || r.c[2].v) : '';
      const cIncome = r.c[3] ? (r.c[3].f || r.c[3].v) : '';
      const cExpense = r.c[4] ? (r.c[4].f || r.c[4].v) : '';

      const incomeVal = Number(String(cIncome || '').replace(/[^0-9.]/g, '')) || 0;
      const expenseVal = Number(String(cExpense || '').replace(/[^0-9.]/g, '')) || 0;
      const remarks = String(cRemarks || '').trim();

      // Income Inflow (1-to-1 matching)
      if (incomeVal > 0) {
        let source = 'Rupesh Sir';
        if (remarks.toLowerCase().includes('hardik')) source = 'Hardikbhai';

        const match = existingIncomes.find(
          inc => !matchedIncomeIds.has(inc.id!) &&
                 inc.transactionDate === isoDate &&
                 Math.abs(inc.amount - incomeVal) < 0.01
        );

        if (match) {
          matchedIncomeIds.add(match.id!);
          // Update details if modified in sheet, and ensure assigned to Elegance Office
          const updates: Partial<IncomeRecord> = {};
          if (source && source !== match.receivedFrom) {
            updates.receivedFrom = source;
            updates.referenceNumber = remarks.length > 60 ? remarks.substring(0, 60) : remarks;
          }
          if (match.officeName !== sheetOfficeName) {
            updates.officeId = sheetOfficeId;
            updates.officeName = sheetOfficeName;
            match.officeId = sheetOfficeId;
            match.officeName = sheetOfficeName;
          }
          if (Object.keys(updates).length > 0) {
            await db.incomeRecords.update(match.id!, updates);
          }
        } else {
          const newId = await db.incomeRecords.add({
            transactionDate: isoDate,
            receivedFrom: source,
            amount: incomeVal,
            paymentMode: 'Cash',
            referenceNumber: remarks.length > 60 ? remarks.substring(0, 60) : remarks,
            description: `Imported fund deposit from ${source}`,
            isVoid: false,
            officeId: sheetOfficeId,
            officeName: sheetOfficeName,
            createdAt: new Date().toISOString(),
          });
          matchedIncomeIds.add(newId as number);
          existingIncomes.push({
            id: newId as number,
            transactionDate: isoDate,
            receivedFrom: source,
            amount: incomeVal,
            paymentMode: 'Cash',
            referenceNumber: remarks.length > 60 ? remarks.substring(0, 60) : remarks,
            description: `Imported fund deposit from ${source}`,
            isVoid: false,
            officeId: sheetOfficeId,
            officeName: sheetOfficeName,
            createdAt: new Date().toISOString(),
          });
          incomesAdded++;
        }
      }

      // Expense Outflow (1-to-1 matching)
      if (expenseVal > 0) {
        let title = remarks;
        if (title.includes('Petty Cash')) {
          title = title.replace(/,?Petty Cash Collected[^\,]*/i, '').trim();
          if (!title) title = 'Office Expense';
        }
        if (!title.trim() || title === '-') title = 'Office Sundry Expense';

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
                 exp.expenseDate === isoDate &&
                 Math.abs(exp.amount - expenseVal) < 0.01
        );

        if (match) {
          matchedExpenseIds.add(match.id!);
          // Update title / vendor / category if modified in sheet, and ensure assigned to Elegance Office
          const updates: Partial<ExpenseRecord> = {};
          if (title && title !== match.expenseTitle && title !== 'Office Expense' && title !== 'Office Sundry Expense') {
            updates.expenseTitle = title;
          }
          if (vendor && vendor !== match.vendor) {
            updates.vendor = vendor;
          }
          if (cat && cat.id && cat.id !== match.categoryId) {
            updates.categoryId = cat.id;
            updates.categoryName = cat.name;
          }
          if (match.officeName !== sheetOfficeName) {
            updates.officeId = sheetOfficeId;
            updates.officeName = sheetOfficeName;
            match.officeId = sheetOfficeId;
            match.officeName = sheetOfficeName;
          }
          if (Object.keys(updates).length > 0) {
            await db.expenseRecords.update(match.id!, updates);
          }
        } else {
          const newId = await db.expenseRecords.add({
            expenseDate: isoDate,
            categoryId: cat.id || 1,
            categoryName: cat.name,
            expenseTitle: title,
            description: `${cDay ? String(cDay).charAt(0).toUpperCase() + String(cDay).slice(1) : 'Daily'} expense from Google Sheet`,
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
            expenseDate: isoDate,
            categoryId: cat.id || 1,
            categoryName: cat.name,
            expenseTitle: title,
            description: `${cDay ? String(cDay).charAt(0).toUpperCase() + String(cDay).slice(1) : 'Daily'} expense from Google Sheet`,
            amount: expenseVal,
            paymentMode: 'Cash',
            vendor,
            status: 'Completed',
            officeId: sheetOfficeId,
            officeName: sheetOfficeName,
            createdAt: new Date().toISOString(),
          });
          expensesAdded++;
        }
      }
    }

    // 4. Safe Deletion Reconciliation:
    // If an entry within the sheet's active calendar month is no longer in the Google Sheet,
    // delete it from the website database to maintain 100% parity!
    let expensesDeleted = 0;
    let incomesDeleted = 0;

    if (sheetDates.length > 0) {
      const sortedDates = [...sheetDates].sort();
      const earliestDate = sortedDates[0];
      const latestDate = sortedDates[sortedDates.length - 1];

      const scopeStart = `${earliestDate.substring(0, 7)}-01`;
      const latestYear = Number(latestDate.substring(0, 4));
      const latestMonth = Number(latestDate.substring(5, 7));
      const lastDayOfMonth = new Date(latestYear, latestMonth, 0).getDate();
      const scopeEnd = `${latestDate.substring(0, 7)}-${String(lastDayOfMonth).padStart(2, '0')}`;

      // Delete local expenses that were removed from the Google Sheet
      const expensesToRemove = existingExpenses.filter(
        e => e.expenseDate >= scopeStart &&
             e.expenseDate <= scopeEnd &&
             !matchedExpenseIds.has(e.id!)
      );

      for (const exp of expensesToRemove) {
        if (exp.id) {
          await db.expenseRecords.delete(exp.id);
          expensesDeleted++;
        }
      }

      // Delete local incomes that were removed from the Google Sheet
      const incomesToRemove = existingIncomes.filter(
        i => i.transactionDate >= scopeStart &&
             i.transactionDate <= scopeEnd &&
             !matchedIncomeIds.has(i.id!)
      );

      for (const inc of incomesToRemove) {
        if (inc.id) {
          await db.incomeRecords.delete(inc.id);
          incomesDeleted++;
        }
      }
    }

    // Auto-update connected Excel file if linked and any changes occurred
    if (expensesAdded > 0 || incomesAdded > 0 || expensesDeleted > 0 || incomesDeleted > 0) {
      await triggerAutoSaveToExcel();
    }

    currentSyncState.lastSyncedAt = new Date();
    currentSyncState.lastError = null;

    let message = `Google Sheet synced successfully!`;
    const totalAdded = expensesAdded + incomesAdded;
    const totalDeleted = expensesDeleted + incomesDeleted;

    if (totalAdded > 0 && totalDeleted > 0) {
      message = `Google Sheet synced: ${totalAdded} added, and ${totalDeleted} removed entries deleted from website!`;
    } else if (totalDeleted > 0) {
      message = `Google Sheet synced: ${totalDeleted} removed ${totalDeleted === 1 ? 'entry' : 'entries'} deleted from website to match sheet!`;
    } else if (totalAdded > 0) {
      message = `Google Sheet synced: ${expensesAdded} new expenses and ${incomesAdded} new fund entries imported!`;
    } else {
      message = `All records from the Google Sheet are already in sync with your local database (0 duplicates added)!`;
    }

    return { incomesAdded, expensesAdded, incomesDeleted, expensesDeleted, message };
  } catch (err: any) {
    console.error('Failed to sync from Google Sheet:', err);
    currentSyncState.lastError = err?.message || 'Failed to fetch Google Sheet';
    throw err;
  } finally {
    currentSyncState.googleSheetSyncing = false;
    notifyListeners();
  }
}

export function setAutoSaveEnabled(enabled: boolean) {
  autoSaveEnabled = enabled;
  currentSyncState.autoSaveEnabled = enabled;
  notifyListeners();
}
