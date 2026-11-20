import { db } from '../database/db';
import type { IncomeRecord } from '../types';
import { triggerAutoSaveToExcel } from './syncService';
import { validateIncomeInput } from '../utils/validators';
import { logAuditEvent } from './auditService';

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
  const validation = validateIncomeInput({
    receivedFrom: income.receivedFrom,
    amount: income.amount,
    transactionDate: income.transactionDate,
    paymentMode: income.paymentMode,
  });

  if (!validation.isValid) {
    const firstErr = Object.values(validation.errors)[0] || 'Invalid income record.';
    throw new Error(firstErr);
  }

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

  const safeAmount = Math.round(Number(income.amount) * 100) / 100;

  const newRecord: IncomeRecord = {
    ...income,
    officeId,
    officeName,
    amount: safeAmount,
    isVoid: false,
    createdAt: new Date().toISOString(),
  };

  const id = await db.incomeRecords.add(newRecord);

  await logAuditEvent({
    action: 'ADD_INCOME',
    resource: 'income',
    username: 'Current User',
    details: `Received ₹${newRecord.amount} from ${newRecord.receivedFrom}`,
    status: 'SUCCESS',
  });

  // Auto-sync with connected Excel file
  triggerAutoSaveToExcel().catch(() => {});
  return Number(id);
}

export async function updateIncome(id: number, updates: Partial<IncomeRecord>): Promise<void> {
  if (updates.amount !== undefined || updates.receivedFrom !== undefined || updates.transactionDate !== undefined) {
    const validation = validateIncomeInput({
      receivedFrom: updates.receivedFrom !== undefined ? updates.receivedFrom : 'Valid Source',
      amount: updates.amount !== undefined ? updates.amount : 100,
      transactionDate: updates.transactionDate !== undefined ? updates.transactionDate : '2026-01-01',
      paymentMode: updates.paymentMode,
    });
    if (!validation.isValid) {
      const firstErr = Object.values(validation.errors)[0] || 'Invalid update parameters.';
      throw new Error(firstErr);
    }
  }

  if (updates.amount !== undefined) {
    updates.amount = Math.round(Number(updates.amount) * 100) / 100;
  }

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
