import { db } from '../database/db';
import type { Office } from '../types';
import { initialOffices } from '../database/seedData';

/**
 * Ensures default offices exist in the system
 */
export async function ensureDefaultOffices(): Promise<void> {
  const count = await db.offices.count();
  if (count === 0) {
    await db.offices.bulkAdd(initialOffices as Office[]);
  }
}

/**
 * Retrieves all offices
 */
export async function getOffices(): Promise<Office[]> {
  await ensureDefaultOffices();
  return await db.offices.toArray();
}

/**
 * Retrieves a single office by ID
 */
export async function getOfficeById(id: number): Promise<Office | undefined> {
  return await db.offices.get(id);
}

/**
 * Gets the designated default office (e.g. Head Office)
 */
export async function getDefaultOffice(): Promise<Office> {
  await ensureDefaultOffices();
  const def = await db.offices.filter(o => !!o.isDefault).first();
  if (def) return def;
  const first = await db.offices.toCollection().first();
  if (first) return first;
  const newId = await db.offices.add({
    name: 'Elegance Office',
    code: 'EO',
    location: 'Elegance Branch, Surat',
    isDefault: true,
    status: 'Active',
    createdAt: new Date().toISOString(),
  });
  return (await db.offices.get(newId))!;
}

/**
 * Creates a new office/branch
 */
export async function createOffice(data: Omit<Office, 'id' | 'createdAt'>): Promise<number> {
  const trimmedName = data.name.trim();
  const trimmedCode = data.code.trim().toUpperCase();

  if (!trimmedName) throw new Error('Office name is required.');
  if (!trimmedCode) throw new Error('Office code is required.');

  // Check unique name
  const existingName = await db.offices.filter(o => o.name.toLowerCase() === trimmedName.toLowerCase()).first();
  if (existingName) throw new Error(`An office with name "${trimmedName}" already exists.`);

  // Check unique code
  const existingCode = await db.offices.filter(o => o.code.toUpperCase() === trimmedCode).first();
  if (existingCode) throw new Error(`An office with code "${trimmedCode}" already exists.`);

  if (data.isDefault) {
    // Clear isDefault from other offices
    const all = await db.offices.toArray();
    for (const off of all) {
      if (off.isDefault) {
        await db.offices.update(off.id!, { isDefault: false });
      }
    }
  }

  const newOffice: Office = {
    ...data,
    name: trimmedName,
    code: trimmedCode,
    status: data.status || 'Active',
    createdAt: new Date().toISOString(),
  };

  const id = await db.offices.add(newOffice);
  return Number(id);
}

/**
 * Updates an existing office/branch
 */
export async function updateOffice(id: number, data: Partial<Office>): Promise<void> {
  const current = await db.offices.get(id);
  if (!current) throw new Error('Office not found.');

  if (data.name && data.name.trim().toLowerCase() !== current.name.toLowerCase()) {
    const existing = await db.offices.filter(o => o.name.toLowerCase() === data.name!.trim().toLowerCase()).first();
    if (existing && existing.id !== id) {
      throw new Error(`An office with name "${data.name}" already exists.`);
    }
  }

  if (data.isDefault && !current.isDefault) {
    const all = await db.offices.toArray();
    for (const off of all) {
      if (off.isDefault && off.id !== id) {
        await db.offices.update(off.id!, { isDefault: false });
      }
    }
  }

  await db.offices.update(id, data);

  // If office name updated, sync to existing records that reference this office
  if (data.name && data.name !== current.name) {
    await db.expenseRecords.where('officeId').equals(id).modify({ officeName: data.name });
    await db.incomeRecords.where('officeId').equals(id).modify({ officeName: data.name });
  }
}

/**
 * Deletes an office
 */
export async function deleteOffice(id: number): Promise<void> {
  const count = await db.offices.count();
  if (count <= 1) {
    throw new Error('Action blocked: System requires at least one Office entry.');
  }

  const office = await db.offices.get(id);
  if (office?.isDefault) {
    throw new Error('Cannot delete the default office. Please designate another office as default first.');
  }

  // Check if transactions exist
  const expCount = await db.expenseRecords.where('officeId').equals(id).count();
  const incCount = await db.incomeRecords.where('officeId').equals(id).count();
  if (expCount > 0 || incCount > 0) {
    throw new Error(`Cannot delete office "${office?.name}" because it contains ${expCount} expense(s) and ${incCount} income record(s).`);
  }

  await db.offices.delete(id);
}
