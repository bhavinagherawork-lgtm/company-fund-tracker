import { db } from '../database/db';
import type { IncomeRecord } from '../types';
import { triggerAutoSaveToExcel } from './syncService';

export async function getIncomes(officeId?: number | 'ALL'): Promise<IncomeRecord[]> {
  const all = await db.incomeRecords
    .orderBy('transactionDate')
    .reverse()
    .toArray();

  if (officeId && officeId !== 'ALL') {
    return all.filter((i) => i.officeId === officeId);
  }
  return all;
}

export async function addIncome(income: Omit<IncomeRecord, 'id' | 'createdAt'>): Promise<number> {
  let officeId = income.officeId;
  let officeName = income.officeName;
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

  const newRecord: IncomeRecord = {
    ...income,
    officeId,
    officeName,
    amount: Number(income.amount),
    isVoid: false,
    createdAt: new Date().toISOString(),
  };

  const id = await db.incomeRecords.add(newRecord);
  // Auto-sync with connected Excel file
  triggerAutoSaveToExcel().catch(() => {});
  return Number(id);
}

export async function updateIncome(id: number, updates: Partial<IncomeRecord>): Promise<void> {
  if (updates.officeId && !updates.officeName) {
    const off = await db.offices.get(updates.officeId);
    updates.officeName = off?.name;
  }
  await db.incomeRecords.update(id, updates);
  // Auto-sync with connected Excel file
  triggerAutoSaveToExcel().catch(() => {});
}

export async function voidIncome(id: number, _reason?: string): Promise<void> {
  await db.incomeRecords.update(id, { isVoid: true });
  triggerAutoSaveToExcel().catch(() => {});
}

export async function unvoidIncome(id: number): Promise<void> {
  await db.incomeRecords.update(id, { isVoid: false });
  triggerAutoSaveToExcel().catch(() => {});
}

export async function deleteIncome(id: number): Promise<void> {
  await db.incomeRecords.delete(id);
  triggerAutoSaveToExcel().catch(() => {});
}
