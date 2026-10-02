import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';

import {
  CdkDragDrop,
  DragDropModule,
  transferArrayItem
} from '@angular/cdk/drag-drop';

import { Router } from '@angular/router';

import { TicketService } from '../../../features/services/ticket/ticket-service';

interface KanbanColumn {
  status: string;
  label: string;
  tickets: any[];
}

@Component({
  selector: 'app-my-ticket',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule
  ],

  templateUrl: './mytickets.html',
  styleUrl: './mytickets.css',

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyTicketComponent implements OnInit {

  // =====================================
  // TICKETS
  // =====================================

  tickets: any[] = [];

  loading = false;

  errorMessage = '';

  statusOptions: string[] =
    ['Open', 'InProgress', 'Closed'];

  columns: KanbanColumn[] = [];

  connectedDropListIds: string[] = [];


  constructor(
    private ticketService: TicketService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}


  // =====================================
  // INIT
  // =====================================

  ngOnInit(): void {

    this.connectedDropListIds =
      this.statusOptions.map(status => `drop-list-${status}`);

    this.getMyTickets();

  }


  // =====================================
  // GET MY TICKETS
  // =====================================

  getMyTickets(): void {

    this.loading = true;

    this.errorMessage = '';

    this.cdr.markForCheck();


    this.ticketService
      .getticketmy()
      .subscribe({

        next: (res: any) => {

          this.tickets =
            res?.data || [];

          this.buildColumns();

          this.loading = false;

          this.cdr.markForCheck();

        },


        error: (err) => {

          console.error(
            'Error getting tickets:',
            err
          );


          this.tickets = [];

          this.columns = [];

          this.loading = false;

          this.errorMessage =
            'Unable to load your tickets. Please try again.';


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


  // =====================================
  // OPEN TICKET
  // =====================================

  openTicket(ticketId: number): void {

    this.router.navigate([
      '/main/replyticket',
      ticketId
    ]);

  }
  Raise_ticket(): void {
    this.router.navigate(['/main/ticket']);
  }
}
