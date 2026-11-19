import { format, parseISO, isValid } from 'date-fns';

export function formatDate(dateString?: string | Date, pattern: string = 'dd MMM yyyy'): string {
  if (!dateString) return '—';
  try {
    const d = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    if (!isValid(d)) return String(dateString);
    return format(d, pattern);
  } catch {
    return String(dateString);
  }
}

export function formatDateTime(dateString?: string | Date): string {
  return formatDate(dateString, 'dd MMM yyyy, hh:mm a');
}

export function getTodayISODate(): string {
  return new Date().toISOString().split('T')[0];
}
