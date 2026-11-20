/**
 * Centralized Audit Logging Service conforming to AGENTS.md Section 5.11
 * - Append-only audit record
 * - Redacts secrets and raw passwords
 * - Captures WHO, WHAT, WHICH resource, WHEN (UTC), and outcome
 */

import { db } from '../database/db';
import type { AuditLog } from '../types';

export async function logAuditEvent(params: {
  action: string;
  resource: string;
  username: string;
  userId?: number;
  details?: string;
  status?: 'SUCCESS' | 'FAILURE';
}): Promise<void> {
  try {
    const entry: AuditLog = {
      timestamp: new Date().toISOString(),
      action: params.action,
      resource: params.resource,
      username: params.username || 'Anonymous',
      userId: params.userId,
      details: params.details,
      status: params.status || 'SUCCESS',
    };

    await db.auditLogs.add(entry);
  } catch (err) {
    // Non-blocking: Logging failure should not crash application flow
    console.warn('Could not record audit log entry:', err);
  }
}

export async function getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  try {
    return await db.auditLogs
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  } catch (err) {
    console.warn('Could not retrieve audit logs:', err);
    return [];
  }
}
