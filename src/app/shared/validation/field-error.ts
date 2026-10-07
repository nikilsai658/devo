import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';

// Shows the first validation error of a control as a readable message.
//
//   <app-field-error [control]="form.get('phoneNumber')" label="Phone number" />
//
// Pass `messages` to override the text for a specific error key.
@Component({
  selector: 'app-field-error',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message) {
      <p class="field-error" role="alert">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
        </svg>
        <span>{{ message }}</span>
      </p>
    }
  `
})
export class FieldError implements OnChanges, OnDestroy {

  @Input() control: AbstractControl | null | undefined;
  @Input() label = 'This field';
  @Input() messages: Record<string, string> = {};

  message: string | null = null;

  private sub?: Subscription;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnChanges(): void {
    this.sub?.unsubscribe();
    this.update();
    // control.events fires on value, status, touched and pristine changes, so
    // the message stays in sync even inside OnPush parents.
    this.sub = this.control?.events.subscribe(() => this.update());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private update(): void {
    const c = this.control;
    const next = c && c.invalid && (c.touched || c.dirty) && c.errors
      ? this.describe(c.errors)
      : null;
    if (next !== this.message) {
      this.message = next;
      this.cd.markForCheck();
    }
  }

  private describe(errors: Record<string, any>): string {
    const key = Object.keys(errors)[0];
    if (this.messages[key]) return this.messages[key];

    const label = this.label;
    const e = errors[key];

    switch (key) {
      case 'required':
        return `${label} is required.`;
      case 'whitespace':
        return `${label} cannot be blank or contain only spaces.`;
      case 'email':
        return 'Please enter a valid email address (e.g. name@example.com).';
      case 'phoneDigits':
        return `${label} can contain digits only.`;
      case 'phone':
        return `${label} must be exactly 10 digits (${e.actualLength} entered).`;
      case 'personName':
        return `${label} can contain letters, spaces, dots, apostrophes and hyphens only.`;
      case 'title':
        return `${label} must include letters and cannot contain special symbols.`;
      case 'code':
        return `${label} can contain letters, numbers, hyphens and underscores only, without spaces.`;
      case 'integer':
        return `${label} must be a whole number.`;
      case 'url':
        return 'Please enter a valid URL starting with http:// or https://.';
      case 'minlength':
        return `${label} must be at least ${e.requiredLength} characters.`;
      case 'maxlength':
        return `${label} cannot exceed ${e.requiredLength} characters.`;
      case 'min':
        return `${label} must be ${e.min} or more.`;
      case 'max':
        return `${label} must be ${e.max} or less.`;
      case 'strongPassword':
        return `Password must include ${this.joinList(e.missing)}.`;
      case 'passwordSpaces':
        return 'Password cannot contain spaces.';
      case 'mismatch':
        return 'Passwords do not match.';
      case 'sameAsOld':
        return 'New password must be different from your current password.';
      case 'range':
        return `${label} cannot be earlier than the starting value.`;
      case 'pattern':
        return `${label} is not in a valid format.`;
      default:
        return `${label} is invalid.`;
    }
  }

  private joinList(items: string[]): string {
    if (items.length <= 1) return items.join('');
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
  }
}
