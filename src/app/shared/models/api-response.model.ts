// The API wraps most results as { success, message, data }. Some older endpoints return the
// array directly, or under `items` / `result`. Every list read goes through toList() so a
// missing or null list becomes [] — never the wrapper object, which *ngFor cannot iterate.
export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}

export function toList<T = any>(res: unknown): T[] {

  if (Array.isArray(res)) {
    return res;
  }

  const body = res as Record<string, unknown> | null | undefined;

  for (const key of ['data', 'items', 'result']) {
    const value = body?.[key];
    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  return [];

}

/** Body sent to POST Student/run */
export interface RunCodeRequest {
  sourceCode: string;
  languageId: number;
  stdin: string | null;
}

/** Body sent to POST Student/submit */
export interface SubmitCodeRequest extends RunCodeRequest {
  assignmentId: number;
  tabSwitchCount: number;
  fullscreenExitCount: number;
}
