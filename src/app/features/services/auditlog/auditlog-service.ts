import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

export interface AuditLogFilter {
  action?: string;
  actor?: string;
  entityType?: string;
  entityId?: string;
  collegeCode?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  constructor(private api: Api) {}

  // Empty filters are dropped so the API only sees the ones the user filled in.
  getLogs(filter: AuditLogFilter) {
    const params: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value as string | number;
      }
    }
    return this.api.GET('AuditLog', params);
  }
}
