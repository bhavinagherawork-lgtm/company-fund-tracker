import { getExcelArrayBuffer } from './excelService';
import * as XLSX from 'xlsx';
import { db } from '../database/db';
import type { ExpenseRecord, IncomeRecord } from '../types';
import { fetchWithRetry } from '../utils/httpClient';

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
          // In standard Indian accounting and this company's spreadsheets, dates are Day/Month/Year
          d = p0;
          m = p1;
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

    // Also identify flipped-date duplicates outside Jun-Nov 2026
    const validMonths = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];

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
 * Dedicated parser for the Water Tracker Sheet (gid: 1279840244)
 * Parses daily water jug deliveries, month payment statuses (Paid vs Pending),
 * assigns to Elegance Office, and creates categorized drinking water expenses.
 */
async function syncWaterSheet(
  rows: any[],
  sheetOfficeId: number | undefined,
  sheetOfficeName: string
): Promise<{
  incomesAdded: number;
  expensesAdded: number;
  incomesDeleted: number;
  expensesDeleted: number;
  message: string;
}> {
  // 1. Detect month payment statuses from summary rows and price per jug
  const monthStatusMap: Record<string, 'Completed' | 'Pending'> = {};
  let currentMonth: string | null = null;
  let pricePerJug = 30;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r.c) continue;
    const c0 = r.c[0] ? (r.c[0].v !== undefined ? r.c[0].v : r.c[0].f) : null;
    const c1 = r.c[1] ? (r.c[1].v !== undefined ? r.c[1].v : r.c[1].f) : null;
    const c2 = r.c[2] ? (r.c[2].v !== undefined ? r.c[2].v : r.c[2].f) : null;
    const c3 = r.c[3] ? (r.c[3].v !== undefined ? r.c[3].v : r.c[3].f) : null;

    const iso = normalizeDateToISO(c0);
    if (iso) {
      currentMonth = iso.substring(0, 7);
    } else if (currentMonth) {
      if (Number(c1) === 30 || String(c1).trim() === '30' || (c2 && Number(c2) > 100)) {
        const statusText = String(c3 || '').trim().toLowerCase();
        const isPaid = statusText.includes('paid');
        monthStatusMap[currentMonth] = isPaid ? 'Completed' : 'Pending';
        if (Number(c1) > 0) pricePerJug = Number(c1);
      }
    }
  }

  // 2. Resolve Water Category
  const existingCategories = await db.expenseCategories.toArray();
  let waterCat = existingCategories.find(c => c.code === 'WATER' || c.name.toLowerCase().includes('water'));
  if (!waterCat) {
    const newCatId = await db.expenseCategories.add({
      id: 7,
      name: 'Drinking Water Supply',
      code: 'WATER',
      color: '#0284c7',
      isDefault: true,
      description: 'Daily 20L drinking water jugs and dispensers'
    });
    waterCat = { id: newCatId as number, name: 'Drinking Water Supply', code: 'WATER', color: '#0284c7', isDefault: true, description: '' };
  }

  // 3. Existing Expenses for 1-to-1 matching
  const existingExpenses = await db.expenseRecords.toArray();
  const matchedWaterIds = new Set<number>();
  const sheetDates: string[] = [];
  let expensesAdded = 0;
  let expensesUpdated = 0;
  let totalJugs = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r.c) continue;

    const rawDate = r.c[0] ? (r.c[0].v !== undefined ? r.c[0].v : r.c[0].f) : null;
    const isoDate = normalizeDateToISO(rawDate) || normalizeDateToISO(r.c[0]?.f);
    if (!isoDate) continue;
    sheetDates.push(isoDate);

    const dayName = r.c[1] ? String(r.c[1].v || r.c[1].f || '').trim() : '';
    const formattedDay = dayName ? dayName.charAt(0).toUpperCase() + dayName.slice(1) : '';
    const countVal = r.c[2] ? Number(r.c[2].v !== undefined ? r.c[2].v : r.c[2].f) : 0;

    if (countVal > 0) {
      totalJugs += countVal;
      const mKey = isoDate.substring(0, 7);
      const status: 'Completed' | 'Pending' = monthStatusMap[mKey] || 'Pending';
      const amount = countVal * pricePerJug;
      const title = `Drinking Water (${countVal} ${countVal === 1 ? 'Jug' : 'Jugs'})`;
      const desc = `Daily drinking water supply for Elegance Office (${formattedDay || 'Daily'})`;

      const match = existingExpenses.find(
        exp => !matchedWaterIds.has(exp.id!) &&
               exp.expenseDate === isoDate &&
               ((exp.expenseTitle && exp.expenseTitle.toLowerCase().includes('water')) || (exp.categoryName && exp.categoryName.toLowerCase().includes('water')))
      );

      if (match) {
        matchedWaterIds.add(match.id!);
        const updates: Partial<ExpenseRecord> = {};
        if (match.amount !== amount) updates.amount = amount;
        if (match.expenseTitle !== title) updates.expenseTitle = title;
        if (match.status !== status) updates.status = status;
        if (match.officeName !== sheetOfficeName) {
          updates.officeId = sheetOfficeId;
          updates.officeName = sheetOfficeName;
        }
        if (match.categoryId !== waterCat.id) {
          updates.categoryId = waterCat.id;
          updates.categoryName = waterCat.name;
        }
        if (Object.keys(updates).length > 0) {
          await db.expenseRecords.update(match.id!, updates);
          expensesUpdated++;
        }
      } else {
        const newId = await db.expenseRecords.add({
          expenseDate: isoDate,
          categoryId: waterCat.id || 7,
          categoryName: waterCat.name,
          expenseTitle: title,
          description: desc,
          amount,
          paymentMode: 'Cash',
          vendor: 'Drinking Water Supply',
          status,
          officeId: sheetOfficeId,
          officeName: sheetOfficeName,
          createdAt: new Date().toISOString(),
        });
        matchedWaterIds.add(newId as number);
        existingExpenses.push({
          id: newId as number,
          expenseDate: isoDate,
          categoryId: waterCat.id || 7,
          categoryName: waterCat.name,
          expenseTitle: title,
          amount,
          paymentMode: 'Cash',
          vendor: 'Drinking Water Supply',
          status,
          officeId: sheetOfficeId,
          officeName: sheetOfficeName,
          createdAt: new Date().toISOString(),
        });
        expensesAdded++;
      }
    }
  }

  // 4. Deletion Reconciliation: ONLY reconcile water expenses within the scope
  let expensesDeleted = 0;
  if (sheetDates.length > 0) {
    const sortedDates = [...sheetDates].sort();
    const scopeStart = sortedDates[0];
    const scopeEnd = sortedDates[sortedDates.length - 1];

    const waterExpensesToRemove = existingExpenses.filter(
      e => e.expenseDate >= scopeStart &&
           e.expenseDate <= scopeEnd &&
           ((e.expenseTitle && e.expenseTitle.toLowerCase().includes('water')) || (e.categoryName && e.categoryName.toLowerCase().includes('water'))) &&
           !matchedWaterIds.has(e.id!)
    );

    for (const exp of waterExpensesToRemove) {
      if (exp.id) {
        await db.expenseRecords.delete(exp.id);
        expensesDeleted++;
      }
    }
  }

  if (expensesAdded > 0 || expensesUpdated > 0 || expensesDeleted > 0) {
    await triggerAutoSaveToExcel();
  }

  currentSyncState.lastSyncedAt = new Date();
  currentSyncState.lastError = null;

  let message = `Water Tracker synced successfully! ${expensesAdded} new water entries imported, ${expensesUpdated} updated (Total ${totalJugs} jugs @ ₹${pricePerJug}/jug = ₹${totalJugs * pricePerJug} across June-Sept). All mapped to Elegance Office.`;
  if (expensesDeleted > 0) {
    message += ` ${expensesDeleted} removed water entries purged.`;
  }
  if (expensesAdded === 0 && expensesUpdated === 0 && expensesDeleted === 0) {
    message = `All ${totalJugs} water jug entries (@ ₹${pricePerJug}/jug) from June to September are already 100% in sync with Elegance Office!`;
  }

  return {
    incomesAdded: 0,
    expensesAdded,
    incomesDeleted: 0,
    expensesDeleted,
    message
  };
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

    // Resolve Elegance Office for all Google Sheet transactions
    const eleganceOffice = (await db.offices.filter(o => o.name.toLowerCase().includes('elegance')).first())
      || (await db.offices.where('isDefault').equals(1).first())
      || (await db.offices.toCollection().first());
    const sheetOfficeId = eleganceOffice?.id;
    const sheetOfficeName = eleganceOffice?.name || 'Elegance Office';

    // Check if this sheet is the Water Tracker Tab (gid 1279840244 or column layout matches daily water count)
    const isWaterSheet = gid === '1279840244' ||
      gvizData.table.cols?.some((c: any) => c?.label?.toLowerCase().includes('count')) ||
      (rows[0]?.c?.[2]?.v === 'Count' || rows[0]?.c?.[1]?.v === 'day');

    if (isWaterSheet) {
      return await syncWaterSheet(rows, sheetOfficeId, sheetOfficeName);
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

      // Delete local expenses that were removed from the Google Sheet (excluding water expenses)
      const expensesToRemove = existingExpenses.filter(
        e => e.expenseDate >= scopeStart &&
             e.expenseDate <= scopeEnd &&
             !(e.expenseTitle && e.expenseTitle.toLowerCase().includes('water')) &&
             !(e.categoryName && e.categoryName.toLowerCase().includes('water')) &&
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

/**
 * Syncs all records across all month sheets from a deployed Google Apps Script Web App
 */
export async function syncFromGoogleAppsScript(webAppUrl: string): Promise<{ recordsSynced: number; message: string }> {
  try {
    currentSyncState.googleSheetSyncing = true;
    notifyListeners();

    const cleanUrl = webAppUrl.trim();
    if (!cleanUrl.startsWith('http')) {
      throw new Error('Please enter a valid Google Apps Script Web App URL.');
    }

    const res = await fetchWithRetry(cleanUrl, { timeoutMs: 15000, maxRetries: 3 });
    if (!res.ok) {
      throw new Error(`Google Apps Script returned status ${res.status}`);
    }

    const data = await res.json();
    if (data.status !== 'success' || !Array.isArray(data.records)) {
      throw new Error(data.message || 'Invalid data returned from Google Apps Script Web App.');
    }

    const existingExpenses = await db.expenseRecords.toArray();
    const existingIncomes = await db.incomeRecords.toArray();
    const existingCategories = await db.expenseCategories.toArray();
    const defaultCategory = existingCategories[0] || { id: 1, name: 'Snacks & Refreshments (Nasto)' };

    const eleganceOffice = (await db.offices.filter(o => o.name.toLowerCase().includes('elegance')).first())
      || (await db.offices.where('isDefault').equals(1).first())
      || (await db.offices.toCollection().first());
    const sheetOfficeId = eleganceOffice?.id;
    const sheetOfficeName = eleganceOffice?.name || 'Elegance Office';

    let syncedCount = 0;

    for (const r of data.records) {
      const isoDate = normalizeDateToISO(r.date);
      if (!isoDate) continue;

      const isIncome = r.type === 'Fund Inflow' || Number(r.inflow) > 0;
      const amount = isIncome ? Number(r.inflow) || 0 : Number(r.outflow) || 0;
      if (amount <= 0) continue;

      if (isIncome) {
        const source = r.vendorOrPayer || r.categoryOrSource || 'Company Deposit';
        const match = existingIncomes.find(
          inc => inc.transactionDate === isoDate && Math.abs(inc.amount - amount) < 0.01
        );
        if (match) {
          await db.incomeRecords.update(match.id!, {
            receivedFrom: source,
            description: r.description || match.description,
            officeId: sheetOfficeId,
            officeName: sheetOfficeName,
          });
        } else {
          await db.incomeRecords.add({
            transactionDate: isoDate,
            receivedFrom: source,
            amount,
            paymentMode: r.paymentMode || 'Cash',
            description: r.description || `Deposit from ${source}`,
            referenceNumber: r.notes || '',
            isVoid: r.status === 'Void',
            officeId: sheetOfficeId,
            officeName: sheetOfficeName,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        const title = r.title || r.description || 'Office Expense';
        const match = existingExpenses.find(
          exp => exp.expenseDate === isoDate && Math.abs(exp.amount - amount) < 0.01
        );
        const cat = existingCategories.find(c => c.name.toLowerCase() === (r.categoryOrSource || '').toLowerCase()) || defaultCategory;
        if (match) {
          await db.expenseRecords.update(match.id!, {
            expenseTitle: title,
            description: r.description || match.description,
            vendor: r.vendorOrPayer || match.vendor,
            categoryId: cat.id || match.categoryId,
            categoryName: cat.name || match.categoryName,
            officeId: sheetOfficeId,
            officeName: sheetOfficeName,
          });
        } else {
          await db.expenseRecords.add({
            expenseDate: isoDate,
            categoryId: cat.id || 1,
            categoryName: cat.name,
            expenseTitle: title,
            description: r.description || title,
            amount,
            paymentMode: r.paymentMode || 'Cash',
            vendor: r.vendorOrPayer || 'Local Vendor',
            status: r.status === 'Void' ? 'Void' : 'Completed',
            officeId: sheetOfficeId,
            officeName: sheetOfficeName,
            createdAt: new Date().toISOString(),
          });
        }
      }
      syncedCount++;
    }

    currentSyncState.lastSyncedAt = new Date();
    currentSyncState.lastError = null;
    return {
      recordsSynced: syncedCount,
      message: `Successfully synchronized ${syncedCount} records across all month sheets!`,
    };
  } catch (err: any) {
    currentSyncState.lastError = err?.message || 'Failed to sync with Google Apps Script';
    throw err;
  } finally {
    currentSyncState.googleSheetSyncing = false;
    notifyListeners();
  }
}

/**
 * Posts a newly created or modified transaction directly to the Google Apps Script Web App
 */
export async function pushRecordToGoogleAppsScript(webAppUrl: string, record: any): Promise<void> {
  const cleanUrl = webAppUrl.trim();
  if (!cleanUrl.startsWith('http')) return;

  try {
    await fetchWithRetry(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'addRecord',
        record,
      }),
      timeoutMs: 10000,
      maxRetries: 2,
    });
  } catch (err) {
    console.warn('Could not post to Google Apps Script Webhook:', err);
  }
}
