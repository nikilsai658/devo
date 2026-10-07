import { FormControl, FormGroup } from '@angular/forms';

import { AppValidators, normalizePhone } from './app-validators';

const check = (validator: (c: FormControl) => unknown, value: unknown) => validator(new FormControl(value));

describe('AppValidators', () => {
  it('personName accepts names in any language', () => {
    for (const name of ['Priya Sharma', 'José Álvarez', 'Zoë', "O'Neil", 'Siddhārth', 'Anne-Marie', 'J. R. R. Tolkien']) {
      expect(check(AppValidators.personName, name), name).toBeNull();
    }
  });

  it('personName rejects digits and symbols', () => {
    for (const name of ['R2D2', 'Bob!', '<script>', '-Bob', '1abc']) {
      expect(check(AppValidators.personName, name)).toEqual({ personName: true });
    }
  });

  it('required treats spaces as empty', () => {
    expect(check(AppValidators.required, '')).toEqual({ required: true });
    expect(check(AppValidators.required, '   ')).toEqual({ whitespace: true });
    expect(check(AppValidators.required, 'x')).toBeNull();
  });

  it('strongPassword lists what is missing', () => {
    expect(check(AppValidators.strongPassword, 'Abcdef1!')).toBeNull();
    expect(check(AppValidators.strongPassword, 'short')).toEqual({ minlength: { requiredLength: 8, actualLength: 5 } });
    expect(check(AppValidators.strongPassword, 'abcdefgh')).toEqual({
      strongPassword: { missing: ['an uppercase letter', 'a number', 'a special character'] }
    });
    expect(check(AppValidators.strongPassword, 'Abc def1!')).toEqual({ passwordSpaces: true });
  });

  it('email requires a domain with a TLD', () => {
    expect(check(AppValidators.email, 'a@b.co')).toBeNull();
    expect(check(AppValidators.email, 'a@b')).toEqual({ email: true });
  });

  it('phone needs exactly 10 digits', () => {
    expect(check(AppValidators.phone, '9876543210')).toBeNull();
    expect(check(AppValidators.phone, '98765')).toEqual({ phone: { actualLength: 5 } });
    expect(check(AppValidators.phone, '98765abcde')).toEqual({ phoneDigits: true });
  });

  it('matchFields marks the confirmation field', () => {
    const form = new FormGroup({ a: new FormControl('x'), b: new FormControl('y') }, { validators: AppValidators.matchFields('a', 'b') });
    expect(form.get('b')?.hasError('mismatch')).toBe(true);
    form.get('b')?.setValue('x');
    expect(form.get('b')?.hasError('mismatch')).toBe(false);
  });

  it('normalizePhone keeps the last 10 digits', () => {
    expect(normalizePhone('+91 98765 43210')).toBe('9876543210');
    expect(normalizePhone(null)).toBe('');
  });
});
