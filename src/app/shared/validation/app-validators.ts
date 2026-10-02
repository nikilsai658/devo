import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

// Shared validators used across the management pages. Each one returns an
// error key that FieldError (field-error.ts) knows how to turn into a
// readable message.

const isEmpty = (value: any) =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

export class AppValidators {

  // Like Validators.required, but also rejects values that are only spaces.
  static required: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return { required: true };
    }
    if (typeof value === 'string' && value.trim() === '') {
      return { whitespace: true };
    }
    return null;
  };

  // Stricter than Validators.email: requires a domain with a TLD (name@site.com).
  static email: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (isEmpty(control.value)) return null;
    const pattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return pattern.test(String(control.value).trim()) ? null : { email: true };
  };

  // Exactly 10 digits.
  static phone: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (isEmpty(control.value)) return null;
    const value = String(control.value).trim();
    if (!/^\d*$/.test(value)) {
      return { phoneDigits: true };
    }
    return value.length === 10 ? null : { phone: { actualLength: value.length } };
  };

  // Person / entity names: letters, spaces, dots, apostrophes and hyphens.
  static personName: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (isEmpty(control.value)) return null;
    return /^[A-Za-z][A-Za-z .'-]*$/.test(String(control.value).trim()) ? null : { personName: true };
  };

  // Titles and names of things (colleges, courses, domains...): must contain
  // at least one letter and no unusual symbols.
  static title: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (isEmpty(control.value)) return null;
    const value = String(control.value).trim();
    if (!/[A-Za-z]/.test(value)) return { title: true };
    return /^[A-Za-z0-9 .,&()'\/+#:_-]+$/.test(value) ? null : { title: true };
  };

  // Short identifiers such as college / department / permission codes.
  static code: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (isEmpty(control.value)) return null;
    return /^[A-Za-z0-9_-]+$/.test(String(control.value).trim()) ? null : { code: true };
  };

  static integer: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (isEmpty(control.value)) return null;
    return Number.isInteger(Number(control.value)) ? null : { integer: true };
  };

  static url: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (isEmpty(control.value)) return null;
    try {
      const url = new URL(String(control.value).trim());
      return url.protocol === 'http:' || url.protocol === 'https:' ? null : { url: true };
    } catch {
      return { url: true };
    }
  };

  // At least 8 characters with upper, lower, digit and special character.
  static strongPassword: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (isEmpty(value)) return null;
    const missing: string[] = [];
    if (!/[A-Z]/.test(value)) missing.push('an uppercase letter');
    if (!/[a-z]/.test(value)) missing.push('a lowercase letter');
    if (!/\d/.test(value)) missing.push('a number');
    if (!/[^A-Za-z0-9]/.test(value)) missing.push('a special character');
    if (/\s/.test(value)) return { passwordSpaces: true };
    if (String(value).length < 8) return { minlength: { requiredLength: 8, actualLength: String(value).length } };
    return missing.length ? { strongPassword: { missing } } : null;
  };

  static minLength = (n: number) => Validators.minLength(n);
  static maxLength = (n: number) => Validators.maxLength(n);
  static min = (n: number) => Validators.min(n);
  static max = (n: number) => Validators.max(n);

  // Group validator: marks `confirmKey` with `mismatch` when it differs from `key`.
  static matchFields(key: string, confirmKey: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const confirm = group.get(confirmKey);
      if (!confirm) return null;
      const mismatch = !!confirm.value && group.get(key)?.value !== confirm.value;
      AppValidators.toggleError(confirm, 'mismatch', mismatch);
      return mismatch ? { mismatch: true } : null;
    };
  }

  // Group validator: marks `newKey` with `sameAsOld` when it equals `oldKey`.
  static differentFrom(oldKey: string, newKey: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const newCtrl = group.get(newKey);
      if (!newCtrl) return null;
      const same = !!newCtrl.value && group.get(oldKey)?.value === newCtrl.value;
      AppValidators.toggleError(newCtrl, 'sameAsOld', same);
      return same ? { sameAsOld: true } : null;
    };
  }

  // Group validator: `toKey` must be >= `fromKey` (numbers or dates).
  static range(fromKey: string, toKey: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const from = group.get(fromKey)?.value;
      const toCtrl = group.get(toKey);
      if (!toCtrl) return null;
      const bothSet = !isEmpty(from) && !isEmpty(toCtrl.value);
      const toNum = (v: any) => (typeof v === 'string' && isNaN(Number(v)) ? new Date(v).getTime() : Number(v));
      const invalid = bothSet && toNum(toCtrl.value) < toNum(from);
      AppValidators.toggleError(toCtrl, 'range', invalid);
      return invalid ? { range: true } : null;
    };
  }

  private static toggleError(control: AbstractControl, key: string, on: boolean): void {
    const errors = { ...(control.errors ?? {}) };
    if (on) {
      if (errors[key]) return;
      errors[key] = true;
    } else {
      if (!errors[key]) return;
      delete errors[key];
    }
    control.setErrors(Object.keys(errors).length ? errors : null);
  }
}

// Keeps the last 10 digits of a stored phone number ("+91 98765 43210" -> "9876543210")
// so existing records pass the 10-digit rule when opened for editing.
export function normalizePhone(value: any): string {
  if (value === null || value === undefined) return '';
  const digits = String(value).replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}
