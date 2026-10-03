import { ChangeDetectorRef, Component ,ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketService } from '../../../features/services/ticket/ticket-service';
import { AppValidators, FieldError } from '../../validation';

interface TicketCategory {
  key: string;
  label: string;
  hint: string;
  icon: string;
}

// The API only stores subject + description, so the chosen category is sent
// as a "[Category]" prefix on the subject. Keep labels short: the prefix plus
// SUBJECT_MAX must stay within the 150-char server limit.
const CATEGORIES: TicketCategory[] = [
  { key: 'assignment', label: 'Assignment', hint: 'Submissions, grading, deadlines',
    icon: 'M9 12h6M9 16h4M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 0v5h5' },
  { key: 'course', label: 'Course', hint: 'Content, access, enrolment',
    icon: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 16a2 2 0 0 1 2-2h13' },
  { key: 'account', label: 'Account', hint: 'Login, profile, password',
    icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0' },
  { key: 'technical', label: 'Technical', hint: 'Bugs, errors, page not loading',
    icon: 'M12 9v4m0 4h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z' },
  { key: 'other', label: 'Other', hint: 'Anything else',
    icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-3-9h.01M12 12h.01M15 12h.01' },
];

const DESCRIPTION_TEMPLATE =
`What happened:


What I expected:


Steps to reproduce:
1. `;

@Component({
  selector: 'app-raise-ticket',
  standalone: true,
  imports: [FieldError, CommonModule, ReactiveFormsModule],
  templateUrl: './ticket.html',
  styleUrl: './ticket.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketComponent {

  readonly SUBJECT_MAX = 120;
  readonly DESCRIPTION_MIN = 20;
  readonly DESCRIPTION_MAX = 2000;
  readonly categories = CATEGORIES;

  loading = false;
  showSuccess = false;
  errorMessage = '';
  selectedCategory: TicketCategory | null = null;

   ticketForm: any;

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {

    this.ticketForm = this.fb.group({
      subject: ['', [AppValidators.required, AppValidators.minLength(5), AppValidators.maxLength(this.SUBJECT_MAX)]],
      description: ['', [AppValidators.required, AppValidators.minLength(this.DESCRIPTION_MIN), AppValidators.maxLength(this.DESCRIPTION_MAX)]]
    });

  }

  get subjectLength(): number {
    return this.ticketForm.get('subject')?.value?.length || 0;
  }

  get descriptionLength(): number {
    return this.ticketForm.get('description')?.value?.length || 0;
  }

  get subjectValid(): boolean {
    return !!this.ticketForm.get('subject')?.valid;
  }

  get descriptionValid(): boolean {
    return !!this.ticketForm.get('description')?.valid;
  }

  /** Subject exactly as it will be stored, including the category prefix. */
  get finalSubject(): string {
    const subject = (this.ticketForm.get('subject')?.value || '').trim();
    return this.selectedCategory ? `[${this.selectedCategory.label}] ${subject}` : subject;
  }

  selectCategory(category: TicketCategory) {
    this.selectedCategory = this.selectedCategory?.key === category.key ? null : category;
  }

  insertTemplate() {
    const control = this.ticketForm.get('description');
    if (control.value) return;
    control.setValue(DESCRIPTION_TEMPLATE);
    control.markAsDirty();
  }

  resetForm() {

    this.ticketForm.reset();
    this.selectedCategory = null;
    this.errorMessage = '';
    this.cdr.markForCheck();

  }

  submit() {

    if (this.loading) return;

    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = {
      subject: this.finalSubject,
      description: this.ticketForm.value.description.trim()
    };

    this.ticketService.createTicket(payload).subscribe({
      next: () => {

        this.loading = false;
        this.showSuccess = true;
        this.cdr.markForCheck();

        setTimeout(() => {
          this.showSuccess = false;
          this.cdr.markForCheck();
          this.router.navigate(['/main/mytickets']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'We couldn\'t raise your ticket. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }
}
