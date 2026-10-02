import { ChangeDetectorRef, Component ,ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketService } from '../../../features/services/ticket/ticket-service';
import { AppValidators, FieldError } from '../../validation';

@Component({
  selector: 'app-raise-ticket',
  standalone: true,
  imports: [FieldError, CommonModule, ReactiveFormsModule],
  templateUrl: './ticket.html',
  styleUrl: './ticket.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketComponent {

  loading = false;
  showSuccess = false;

   ticketForm: any;

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {

    this.ticketForm = this.fb.group({
      subject: ['', [AppValidators.required, AppValidators.minLength(5), AppValidators.maxLength(150)]],
      description: ['', [AppValidators.required, AppValidators.minLength(20), AppValidators.maxLength(2000)]]
    });

  }

  resetForm() {

    this.ticketForm.reset();
    this.cdr.markForCheck();

  }

  submit() {

    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.ticketService.createTicket(this.ticketForm.value).subscribe({
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
        console.log(err);
      }
    });
  }
}