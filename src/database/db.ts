import Dexie, { type Table } from 'dexie';
import type { ExpenseCategory, IncomeRecord, ExpenseRecord, AppSetting, User, Office, AuditLog } from '../types';
import { initialCategories, initialIncomes, initialExpenses, initialSettings, initialUsers, initialOffices } from './seedData';

export class ExpenseFlowDB extends Dexie {
  expenseCategories!: Table<ExpenseCategory, number>;
  incomeRecords!: Table<IncomeRecord, number>;
  expenseRecords!: Table<ExpenseRecord, number>;
  settings!: Table<AppSetting, string>;
  users!: Table<User, number>;
  offices!: Table<Office, number>;
  auditLogs!: Table<AuditLog, number>;

  constructor() {
    super('ExpenseFlowDB');

    this.version(1).stores({
      expenseCategories: '++id, &name, code',
      incomeRecords: '++id, transactionDate, receivedFrom, isVoid, createdAt',
      expenseRecords: '++id, expenseDate, categoryId, status, createdAt',
      settings: 'key',
    });

    this.version(2).stores({
      users: '++id, &username, email, role, status, createdAt',
    });

    this.version(3).stores({
      offices: '++id, &name, code, isDefault, status, createdAt',
    });

    this.version(4).stores({
      auditLogs: '++id, timestamp, action, resource, username, status',
    });
  }
}

export const db = new ExpenseFlowDB();

const SEED_VERSION = 'v4_bulletproof_sync';

export async function resetDatabaseToExcelSeed(): Promise<void> {
  await db.transaction('rw', [db.expenseCategories, db.incomeRecords, db.expenseRecords, db.settings, db.users, db.offices], async () => {
    await db.expenseCategories.clear();
    await db.incomeRecords.clear();
    await db.expenseRecords.clear();
    await db.settings.clear();

    await db.expenseCategories.bulkAdd(initialCategories);
    await db.incomeRecords.bulkAdd(initialIncomes);
    await db.expenseRecords.bulkAdd(initialExpenses);
    await db.settings.bulkPut(initialSettings);

    const userCount = await db.users.count();
    if (userCount === 0) {
      await db.users.bulkAdd(initialUsers as User[]);
    }

    const officeCount = await db.offices.count();
    if (officeCount === 0) {
      await db.offices.bulkAdd(initialOffices as Office[]);
    }
  });
  console.log('Database successfully reset to Excel sheet data.');
}

let initPromise: Promise<void> | null = null;

export async function initializeDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const versionSetting = await db.settings.get('seedVersion');
      const count = await db.expenseCategories.count();

      if (count === 0 || !versionSetting || versionSetting.value !== SEED_VERSION) {
        console.log('Seeding / updating database with authentic Excel sheet records...');
        await resetDatabaseToExcelSeed();
      } else {
        // Automatic duplicate safeguard: purge any duplicate rows if present
        const validMonths = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
        const expenses = await db.expenseRecords.toArray();
        const seenExp = new Set<string>();
        const dupExpIds: number[] = [];
        for (const exp of expenses) {
          if (!exp.id) continue;
          // Purge flipped-date artifact outside valid company period (Jun-Nov 2026)
          const isValidMonth = validMonths.some(vm => exp.expenseDate.startsWith(vm));
          if (!isValidMonth) {
            dupExpIds.push(exp.id);
            continue;
          }
          const key = `${exp.expenseDate}_${Math.round(exp.amount * 100)}`;
          if (seenExp.has(key)) {
            dupExpIds.push(exp.id);
          } else {
            seenExp.add(key);
          }
        }
        if (dupExpIds.length > 0) {
          await db.expenseRecords.bulkDelete(dupExpIds);
          console.log(`Auto-purged ${dupExpIds.length} duplicate expenses on startup.`);
        }

        const incomes = await db.incomeRecords.toArray();
        const seenInc = new Set<string>();
        const dupIncIds: number[] = [];
        for (const inc of incomes) {
          if (!inc.id) continue;
          const isValidMonth = validMonths.some(vm => inc.transactionDate.startsWith(vm));
          if (!isValidMonth) {
            dupIncIds.push(inc.id);
            continue;
          }
          const key = `${inc.transactionDate}_${Math.round(inc.amount * 100)}`;
          if (seenInc.has(key)) {
            dupIncIds.push(inc.id);
          } else {
            seenInc.add(key);
          }
        }
        if (dupIncIds.length > 0) {
          await db.incomeRecords.bulkDelete(dupIncIds);
          console.log(`Auto-purged ${dupIncIds.length} duplicate incomes on startup.`);
        }
      }

      // Ensure Drinking Water Supply category exists
      const waterCat = await db.expenseCategories.filter(c => c.code === 'WATER' || c.name.toLowerCase().includes('water')).first();
      if (!waterCat) {
        await db.expenseCategories.add({
          id: 7,
          name: "Drinking Water Supply",
          code: "WATER",
          color: "#0284c7",
          isDefault: true,
          description: "Daily 20L drinking water jugs and dispensers"
        });
      }

      // Mandatory User check: Always ensure at least one user entry exists in User table
      const userCount = await db.users.count();
      if (userCount === 0) {
        console.log('Mandatory User safeguard: Seeding initial administrator user...');
        await db.users.bulkAdd(initialUsers as User[]);
      }

      // Office check & migration for Elegance Office:
      // All records are from the Elegance Office, not Head Office.
      const officeCount = await db.offices.count();
      if (officeCount === 0) {
        console.log('Seeding initial offices (Elegance Office, Head Office, Branch Office 1, Branch Office 2)...');
        await db.offices.bulkAdd(initialOffices as Office[]);
      }

      // Check if Elegance Office exists; if not, rename Head Office to Elegance Office
      let eleganceOffice = await db.offices.filter((o) => o.name.toLowerCase().includes('elegance')).first();
      let headOffice = await db.offices.filter((o) => o.name.toLowerCase() === 'head office').first();

      if (!eleganceOffice) {
        if (headOffice) {
          await db.offices.update(headOffice.id!, {
            name: 'Elegance Office',
            code: 'EO',
            location: 'Elegance Branch, Surat',
            isDefault: true,
          });
          eleganceOffice = await db.offices.get(headOffice.id!);
          headOffice = undefined; // Original was renamed
        } else {
          const id = await db.offices.add({
            name: 'Elegance Office',
            code: 'EO',
            location: 'Elegance Branch, Surat',
            isDefault: true,
            status: 'Active',
            createdAt: new Date().toISOString(),
          });
          eleganceOffice = await db.offices.get(id);
        }
      }

      // Ensure Head Office still exists as an available branch
      const hoExists = await db.offices.filter((o) => o.name.toLowerCase() === 'head office').first();
      if (!hoExists) {
        await db.offices.add({
          name: 'Head Office',
          code: 'HO',
          location: 'Corporate HQ, Surat',
          isDefault: false,
          status: 'Active',
          createdAt: new Date().toISOString(),
        });
      }

      // Ensure Elegance Office is marked default
      if (eleganceOffice) {
        await db.offices.where('isDefault').equals(1).modify({ isDefault: false });
        await db.offices.update(eleganceOffice.id!, { isDefault: true });
        eleganceOffice = await db.offices.get(eleganceOffice.id!);
      }

      // Re-assign all records originally assigned to Head Office or without officeId to Elegance Office
      if (eleganceOffice && eleganceOffice.id) {
        const targetOfficeId = eleganceOffice.id;
        const targetOfficeName = eleganceOffice.name;

        // 1. Update any expenses with 'Head Office' or undefined officeId
        const expensesToMigrate = await db.expenseRecords
          .filter((e) => Boolean(!e.officeId || e.officeName === 'Head Office' || (headOffice?.id && e.officeId === headOffice.id)))
          .toArray();

        for (const exp of expensesToMigrate) {
          await db.expenseRecords.update(exp.id!, {
            officeId: targetOfficeId,
            officeName: targetOfficeName,
          });
        }
        if (expensesToMigrate.length > 0) {
          console.log(`Migrated ${expensesToMigrate.length} expenses to ${targetOfficeName}.`);
        }

        // 2. Update any incomes with 'Head Office' or undefined officeId
        const incomesToMigrate = await db.incomeRecords
          .filter((i) => Boolean(!i.officeId || i.officeName === 'Head Office' || (headOffice?.id && i.officeId === headOffice.id)))
          .toArray();

        for (const inc of incomesToMigrate) {
          await db.incomeRecords.update(inc.id!, {
            officeId: targetOfficeId,
            officeName: targetOfficeName,
          });
        }
        if (incomesToMigrate.length > 0) {
          console.log(`Migrated ${incomesToMigrate.length} incomes to ${targetOfficeName}.`);
        }
      }
    } catch (err) {
      console.error('Error initializing database:', err);
    }
  })();

  return initPromise;
}
