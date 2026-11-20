export type PaymentMode = 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Card';

export type TransactionStatus = 'Completed' | 'Pending' | 'Void';

export interface ExpenseCategory {
  id?: number;
  name: string;
  code: string;
  color: string;
  icon?: string;
  description?: string;
  isDefault?: boolean;
}

export interface Office {
  id?: number;
  name: string;
  code: string;
  location?: string;
  isDefault?: boolean;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface IncomeRecord {
  id?: number;
  transactionDate: string; // YYYY-MM-DD
  receivedFrom: string;    // e.g. "Sir", "Company Account", "Director", "Client"
  amount: number;          // in INR
  paymentMode: PaymentMode;
  referenceNumber?: string;
  description?: string;
  isVoid?: boolean;
  officeId?: number;
  officeName?: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id?: number;
  expenseDate: string;     // YYYY-MM-DD
  categoryId: number;
  categoryName?: string;
  expenseTitle: string;
  description?: string;
  amount: number;          // in INR
  paymentMode: PaymentMode;
  vendor?: string;
  billNumber?: string;
  receiptDataUrl?: string; // stored Base64 for offline receipt view
  receiptFileName?: string;
  status: TransactionStatus;
  officeId?: number;
  officeName?: string;
  createdAt: string;
}

export interface AppSetting {
  key: string;
  value: any;
  description?: string;
}

export interface FinancialSummary {
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  availableBalance: number;
  currentWeekExpense: number;
  currentMonthExpense: number;
  totalTransactions: number;
}

export interface DailyExpenseSummary {
  date: string;
  dayOfWeek: string;
  totalAmount: number;
  expenseCount: number;
  expenses: ExpenseRecord[];
}

export interface WeeklyReportData {
  weekLabel: string;
  startDate: string;
  endDate: string;
  totalExpense: number;
  totalIncome: number;
  netCashFlow: number;
  dayBreakdown: { day: string; date: string; amount: number }[];
  categoryBreakdown: { name: string; amount: number; color: string }[];
}

export interface MonthlyReportData {
  monthLabel: string;
  yearMonth: string;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  categoryBreakdown: { name: string; amount: number; color: string; count: number }[];
  topExpenses: ExpenseRecord[];
}

export type UserRole = 'Admin' | 'Manager' | 'Accountant' | 'Viewer';

export type UserStatus = 'Active' | 'Inactive';

export interface User {
  id?: number;
  username: string;
  fullName: string;
  email: string;
  passwordHash: string; // Stored securely for client authentication
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  id?: number;
  timestamp: string; // UTC ISO-8601
  userId?: number;
  username: string;
  action: string;
  resource: string;
  details?: string;
  status: 'SUCCESS' | 'FAILURE';
}
