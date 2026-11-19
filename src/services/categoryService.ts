import { db } from '../database/db';
import type { ExpenseCategory } from '../types';
import { triggerAutoSaveToExcel } from './syncService';

export async function getCategories(): Promise<ExpenseCategory[]> {
  return await db.expenseCategories.toArray();
}

export async function addCategory(category: Omit<ExpenseCategory, 'id'>): Promise<number> {
  const id = await db.expenseCategories.add(category);
  triggerAutoSaveToExcel().catch(() => {});
  return Number(id);
}

export async function updateCategory(id: number, updates: Partial<ExpenseCategory>): Promise<void> {
  await db.expenseCategories.update(id, updates);

  // If the category name was changed, keep all existing expenses in sync
  if (updates.name) {
    const matchingExpenses = await db.expenseRecords.where('categoryId').equals(id).toArray();
    for (const exp of matchingExpenses) {
      if (exp.id) {
        await db.expenseRecords.update(exp.id, { categoryName: updates.name });
      }
    }
  }

  triggerAutoSaveToExcel().catch(() => {});
}

export async function deleteCategory(id: number, reassignToCategoryId?: number): Promise<void> {
  await db.transaction('rw', [db.expenseCategories, db.expenseRecords], async () => {
    let reassignCatName = 'Uncategorized';
    let targetId = 0;

    if (reassignToCategoryId && reassignToCategoryId > 0) {
      const targetCat = await db.expenseCategories.get(reassignToCategoryId);
      if (targetCat) {
        reassignCatName = targetCat.name;
        targetId = targetCat.id!;
      }
    }

    // Safely reassign any expenses currently referencing this category
    const matchingExpenses = await db.expenseRecords.where('categoryId').equals(id).toArray();
    for (const exp of matchingExpenses) {
      if (exp.id) {
        await db.expenseRecords.update(exp.id, {
          categoryId: targetId,
          categoryName: reassignCatName,
        });
      }
    }

    // Permanently remove the category from database
    await db.expenseCategories.delete(id);
  });

  triggerAutoSaveToExcel().catch(() => {});
}
