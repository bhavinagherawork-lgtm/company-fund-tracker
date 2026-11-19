import { db } from '../database/db';
import type { ExpenseRecord } from '../types';
import { triggerAutoSaveToExcel } from './syncService';

export async function getExpenses(officeId?: number | 'ALL'): Promise<ExpenseRecord[]> {
  const all = await db.expenseRecords
    .orderBy('expenseDate')
    .reverse()
    .toArray();

  if (officeId && officeId !== 'ALL') {
    return all.filter((e) => e.officeId === officeId);
  }
  return all;
}

export async function addExpense(expense: Omit<ExpenseRecord, 'id' | 'createdAt'>): Promise<number> {
  let categoryName = expense.categoryName;
  if (!categoryName && expense.categoryId) {
    const cat = await db.expenseCategories.get(expense.categoryId);
    categoryName = cat?.name || 'General';
  }

  let officeId = expense.officeId;
  let officeName = expense.officeName;
  if (!officeId) {
    const defOffice = (await db.offices.where('isDefault').equals(1).first()) || (await db.offices.toCollection().first());
    if (defOffice) {
      officeId = defOffice.id;
      officeName = defOffice.name;
    }
  } else if (!officeName && officeId) {
    const off = await db.offices.get(officeId);
    officeName = off?.name;
  }

  const newRecord: ExpenseRecord = {
    ...expense,
    categoryName,
    officeId,
    officeName,
    amount: Number(expense.amount),
    status: expense.status || 'Completed',
    createdAt: new Date().toISOString(),
  };

  const id = await db.expenseRecords.add(newRecord);
  // Auto-sync with connected Excel file
  triggerAutoSaveToExcel().catch(() => {});
  return Number(id);
}

export async function updateExpense(id: number, updates: Partial<ExpenseRecord>): Promise<void> {
  if (updates.categoryId && !updates.categoryName) {
    const cat = await db.expenseCategories.get(updates.categoryId);
    updates.categoryName = cat?.name;
  }
  if (updates.officeId && !updates.officeName) {
    const off = await db.offices.get(updates.officeId);
    updates.officeName = off?.name;
  }
  await db.expenseRecords.update(id, updates);
  // Auto-sync with connected Excel file
  triggerAutoSaveToExcel().catch(() => {});
}

export async function voidExpense(id: number): Promise<void> {
  await db.expenseRecords.update(id, { status: 'Void' });
  triggerAutoSaveToExcel().catch(() => {});
}

export async function unvoidExpense(id: number): Promise<void> {
  await db.expenseRecords.update(id, { status: 'Completed' });
  triggerAutoSaveToExcel().catch(() => {});
}

export async function deleteExpense(id: number): Promise<void> {
  await db.expenseRecords.delete(id);
  triggerAutoSaveToExcel().catch(() => {});
}
