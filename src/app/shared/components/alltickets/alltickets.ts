import { ChangeDetectorRef, Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { TicketService } from '../../../features/services/ticket/ticket-service';
import { CollegeService } from '../../../features/services/college/college-service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  transferArrayItem
} from '@angular/cdk/drag-drop';

interface KanbanColumn {
  status: string;
  label: string;
  tickets: any[];
}

@Component({
  selector: 'app-all-tickets',
  templateUrl: './alltickets.html',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DragDropModule],
  styleUrls: ['./alltickets.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllTicketsComponent implements OnInit {

  tickets: any[] = [];

  loading = false;
  errorMessage = '';

  statusOptions: string[] = ['Open', 'InProgress', 'Closed'];

  columns: KanbanColumn[] = [];

  connectedDropListIds: string[] = [];

  // ==========================
  // Filters
  // ==========================

  colleges: any[] = [];

  selectedStatus = '';
  selectedCollegeName = '';

  constructor(
    private ticketService: TicketService,
    private collegeService: CollegeService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.connectedDropListIds =
      this.statusOptions.map(status => `drop-list-${status}`);

    this.loadColleges();

    this.getTickets();
  }

  // ==========================
  // Load Colleges (filter)
  // ==========================

  loadColleges(): void {

    this.collegeService.getcollege().subscribe({

      next: (res: any) => {

        this.colleges =
          Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];

        this.cdr.markForCheck();
      },

      error: (err) => {

        console.error('Load Colleges Error:', err);

        this.colleges = [];
      }

    });

  }

  // ==========================
  // Filter Change
  // ==========================

  onFilterChange(): void {
    this.getTickets();
  }

  clearFilters(): void {

    this.selectedStatus = '';
    this.selectedCollegeName = '';

    this.getTickets();
  }

  // Get all tickets
  getTickets(): void {

    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.ticketService
      .getTickets(this.selectedStatus, this.selectedCollegeName)
      .subscribe({

      next: (res: any) => {

        // If API returns { data: [...] }
        this.tickets = res?.data || [];

        this.buildColumns();

        this.loading = false;
        this.cdr.markForCheck();
      },

      error: (error) => {

        console.error('Get tickets error:', error);

        this.tickets = [];
        this.columns = [];

        this.errorMessage =
          'Unable to load tickets. Please try again.';

        this.loading = false;
        this.cdr.markForCheck();
      }

    });

  }


  // =====================================
  // BUILD KANBAN COLUMNS
  // =====================================

  private buildColumns(): void {

    this.columns = this.statusOptions.map(status => ({

      status,

      label: status === 'InProgress' ? 'In Progress' : status,

      tickets: this.tickets.filter(ticket =>
        (ticket.status || 'Open').toLowerCase() === status.toLowerCase()
      )

    }));

  }


  // =====================================
  // DRAG & DROP — STATUS CHANGE
  // =====================================

  dropListId(status: string): string {
    return `drop-list-${status}`;
  }

  onDrop(event: CdkDragDrop<any[]>, column: KanbanColumn): void {

    if (event.previousContainer === event.container) {
      return;
    }

    const ticket = event.previousContainer.data[event.previousIndex];
    const previousStatus = ticket.status;

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    ticket.status = column.status;

    this.cdr.markForCheck();


    this.ticketService
      .updateTicketstatus(ticket.id, { status: column.status })
      .subscribe({

        next: () => {
          // status change persisted
        },

        error: (err) => {

          console.error(
            'Error updating ticket status:',
            err
          );

          ticket.status = previousStatus;

          this.buildColumns();

          this.errorMessage =
            'Unable to move ticket. Please try again.';

          this.cdr.markForCheck();

        }

      });

  }


  // Open selected ticket
  openTicket(ticketId: number): void {

    this.router.navigate([
      '/main/support-ticket-details',
      ticketId
    ]);

  }

}
