import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';

import { CommonModule } from '@angular/common';

import {
  TicketService
} from '../../../features/services/ticket/ticket-service';


@Component({
  selector: 'app-support-ticket-details',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],

  templateUrl: './support-ticket-details.html',

  styleUrls: ['./support-ticket-details.css'],

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupportTicketDetailsComponent
  implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('chatScrollContainer')
  chatScrollContainer?: ElementRef<HTMLDivElement>;

  @ViewChild('composer')
  composer?: ElementRef<HTMLTextAreaElement>;

  readonly maxMessageLength = 1000;

  // ==========================================
  // TICKET
  // ==========================================

  ticketId!: number;

  ticket: any = null;


  // ==========================================
  // MESSAGES
  // ==========================================

  messages: any[] = [];

  message = '';


  // ==========================================
  // LOADING
  // ==========================================

  loading = false;

  messagesLoading = false;

  sending = false;

  updatingStatus = false;


  // ==========================================
  // ERROR
  // ==========================================

  errorMessage = '';


  // ==========================================
  // STATUS
  // ==========================================

  selectedStatus = '';


  // ==========================================
  // LAST MESSAGE ID
  // ==========================================

  lastMessageId = 0;


  // ==========================================
  // POLLING
  // ==========================================

  private pollHandle: any = null;

  private polling = false;

  private readonly POLL_INTERVAL_MS = 2000;

  private forceScrollOnNextLoad = false;

  private loadGeneration = 0;


  // ==========================================
  // SCROLL (WHATSAPP-STYLE STICK TO BOTTOM)
  // ==========================================

  // True while the admin is at the latest message;
  // turns off when they scroll up to read history.
  stickToBottom = true;

  // Messages that arrived while scrolled up.
  unreadCount = 0;

  private pendingScroll = false;

  private statusPolling = false;

  private statusGeneration = 0;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService,
    private cdr: ChangeDetectorRef
  ) {}


  // ==========================================
  // INIT
  // ==========================================

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      const id = Number(params.get('id'));

      if (!id) {

        this.errorMessage =
          'Invalid ticket ID.';

        this.cdr.markForCheck();

        return;
      }

      this.ticketId = id;

      this.getTicket();

      this.getMessages();

      this.startPolling();

    });

  }


  // ==========================================
  // DESTROY
  // ==========================================

  ngOnDestroy(): void {

    this.stopPolling();

  }


  // ==========================================
  // START / STOP POLLING
  // ==========================================

  startPolling(): void {

    this.stopPolling();

    this.pollHandle = setInterval(() => {

      this.pollMessages();

      this.refreshTicketStatus();

    }, this.POLL_INTERVAL_MS);

  }

  stopPolling(): void {

    if (this.pollHandle) {

      clearInterval(this.pollHandle);

      this.pollHandle = null;

    }

  }


  // ==========================================
  // POLL FOR NEW MESSAGES
  // ==========================================

  pollMessages(): void {

    if (
      this.polling ||
      !this.ticketId
    ) {

      return;

    }

    this.polling = true;

    const generation = this.loadGeneration;

    this.ticketService
      .getMessages(this.ticketId, this.lastMessageId)
      .subscribe({

        next: (res: any) => {

          if (generation !== this.loadGeneration) {

            return;

          }

          this.mergeMessages(
            this.extractMessages(res)
          );

          this.polling = false;

          this.messagesLoading = false;

          this.cdr.markForCheck();

        },

        error: (error) => {

          if (generation !== this.loadGeneration) {

            return;

          }

          console.error(
            'Poll messages error:',
            error
          );

          this.polling = false;

          this.messagesLoading = false;

          this.cdr.markForCheck();

        }

      });

  }


  // ==========================================
  // REFRESH TICKET STATUS (SILENT)
  // ==========================================

  refreshTicketStatus(): void {

    // Don't overwrite a status change the admin is making.
    if (
      this.statusPolling ||
      this.updatingStatus ||
      !this.ticketId
    ) {

      return;

    }

    this.statusPolling = true;

    const generation = this.statusGeneration;

    this.ticketService
      .getTicketById(this.ticketId)
      .subscribe({

        next: (res: any) => {

          const latest = res?.data || res;

          if (
            generation === this.statusGeneration &&
            !this.updatingStatus &&
            latest?.status &&
            latest.status !== this.ticket?.status
          ) {

            this.setStatus(latest.status);

          }

          this.statusPolling = false;

        },

        error: () => {

          this.statusPolling = false;

        }

      });

  }

  private setStatus(status: string): void {

    this.selectedStatus = status;

    // New object reference so OnPush re-renders immediately.
    this.ticket = {
      ...this.ticket,
      status
    };

    if (status.toLowerCase() === 'closed') {

      this.message = '';

    }

    this.cdr.markForCheck();

  }


  // ==========================================
  // MERGE NEW MESSAGES (NO DUPLICATES)
  // ==========================================

  private extractMessages(res: any): any[] {

    const data = res?.data ?? res;

    return Array.isArray(data) ? data : [];

  }

  private mergeMessages(newMessages: any[]): void {

    const previousLength =
      this.messages.length;

    const existingIds = new Set(
      this.messages.map(msg => Number(msg.id))
    );

    const added = newMessages.filter(
      msg => !existingIds.has(Number(msg.id))
    );

    if (added.length) {

      this.messages = [
        ...this.messages,
        ...added
      ];

      this.updateLastMessageId();

    }

    if (!added.length) {

      return;

    }

    /*
     * Stick to the last message on first load,
     * after the admin's own reply, or when the
     * admin is already at the bottom. Otherwise
     * leave their position alone and show a
     * "new messages" button instead.
     */
    if (
      previousLength === 0 ||
      this.forceScrollOnNextLoad ||
      this.stickToBottom
    ) {

      this.forceScrollOnNextLoad = false;

      this.scrollToBottom();

    } else {

      this.unreadCount += added.length;

    }

  }


  // ==========================================
  // SCROLL TO BOTTOM
  // ==========================================

  /*
   * The actual scroll happens in ngAfterViewChecked,
   * i.e. after Angular has rendered the new messages
   * (and after the chat box itself exists — it only
   * renders once the ticket has loaded).
   */
  scrollToBottom(): void {

    this.stickToBottom = true;

    this.unreadCount = 0;

    this.pendingScroll = true;

    this.cdr.markForCheck();

  }

  ngAfterViewChecked(): void {

    if (!this.pendingScroll) {

      return;

    }

    const el = this.chatScrollContainer?.nativeElement;

    if (!el) {

      // Chat box not rendered yet; try again next check.
      return;

    }

    el.scrollTop = el.scrollHeight;

    this.pendingScroll = false;

  }

  onChatScroll(): void {

    const atBottom = this.isNearBottom();

    if (atBottom === this.stickToBottom) {

      return;

    }

    this.stickToBottom = atBottom;

    if (atBottom) {

      this.unreadCount = 0;

    }

    this.cdr.markForCheck();

  }

  private isNearBottom(): boolean {

    const el = this.chatScrollContainer?.nativeElement;

    if (!el) {

      return true;

    }

    return (
      el.scrollHeight -
        el.scrollTop -
        el.clientHeight <
      80
    );

  }


  // ==========================================
  // MESSAGE SIDE
  // ==========================================

  isStudentMessage(msg: any): boolean {

    if (typeof msg?.isStudent === 'boolean') {

      return msg.isStudent;

    }

    return String(msg?.senderRole || '')
      .trim()
      .toLowerCase() === 'student';

  }

  getSenderLabel(msg: any): string {

    if (this.isStudentMessage(msg)) {

      return msg?.senderName || this.ticket?.studentName || 'Student';

    }

    return msg?.senderName || 'Support Team';

  }

  getSenderRole(msg: any): string {

    if (this.isStudentMessage(msg)) {

      return 'Student';

    }

    return msg?.senderRole || 'Support';

  }

  getInitials(name: any): string {

    const text = String(name || '?').trim();

    const parts = text.split(/\s+/).filter(Boolean);

    const initials =
      parts.length > 1
        ? parts[0][0] + parts[parts.length - 1][0]
        : text.slice(0, 2);

    return initials.toUpperCase();

  }

  // First message of a run from the same sender shows name + avatar.
  isFirstInGroup(index: number): boolean {

    if (index === 0 || this.showDateDivider(index)) {

      return true;

    }

    const prev = this.messages[index - 1];

    const curr = this.messages[index];

    return (
      this.isStudentMessage(prev) !== this.isStudentMessage(curr) ||
      prev?.senderName !== curr?.senderName
    );

  }

  showDateDivider(index: number): boolean {

    if (index === 0) {

      return true;

    }

    return (
      this.dayKey(this.messages[index - 1]?.sentAt) !==
      this.dayKey(this.messages[index]?.sentAt)
    );

  }

  getDateLabel(value: any): string {

    const date = new Date(value);

    if (isNaN(date.getTime())) {

      return '';

    }

    const yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);

    if (this.dayKey(date) === this.dayKey(new Date())) {

      return 'Today';

    }

    if (this.dayKey(date) === this.dayKey(yesterday)) {

      return 'Yesterday';

    }

    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

  }

  private dayKey(value: any): string {

    const date = new Date(value);

    return isNaN(date.getTime())
      ? ''
      : date.toDateString();

  }

  isClosed(): boolean {

    return String(this.ticket?.status || '')
      .toLowerCase() === 'closed';

  }

  getStatusClass(): string {

    switch (String(this.ticket?.status || 'open').toLowerCase()) {

      case 'closed':
        return 'status-closed';

      case 'resolved':
        return 'status-resolved';

      default:
        return 'status-open';

    }

  }

  trackById(_: number, msg: any): any {

    return msg?.id;

  }


  // ==========================================
  // COMPOSER
  // ==========================================

  // Grow the textarea with its content, up to a cap.
  autoGrow(): void {

    const el = this.composer?.nativeElement;

    if (!el) {

      return;

    }

    el.style.height = 'auto';

    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;

  }


  // ==========================================
  // ENTER TO SEND
  // ==========================================

  sendOnEnter(event: Event): void {

    if ((event as KeyboardEvent).shiftKey) {

      return;

    }

    event.preventDefault();

    this.sendReply();

  }


  // ==========================================
  // GET TICKET
  // ==========================================

  getTicket(): void {

    this.loading = true;

    this.errorMessage = '';

    this.cdr.markForCheck();


    this.ticketService
      .getTicketById(this.ticketId)
      .subscribe({

        next: (res: any) => {

          console.log(
            'Ticket response:',
            res
          );

          this.ticket =
            res?.data || res;


          this.selectedStatus =
            this.ticket?.status || 'Open';


          this.loading = false;

          this.cdr.markForCheck();

        },

        error: (error) => {

          console.error(
            'Get ticket error:',
            error
          );

          this.errorMessage =
            'Unable to load ticket details.';

          this.loading = false;

          this.cdr.markForCheck();

        }

      });

  }


  // ==========================================
  // GET MESSAGES
  // ==========================================

  getMessages(): void {

    this.messages = [];

    this.lastMessageId = 0;

    this.unreadCount = 0;

    this.messagesLoading = true;

    // Discard any poll still in flight from before the reset.
    this.loadGeneration++;

    this.polling = false;

    this.cdr.markForCheck();

    this.pollMessages();

  }


  // ==========================================
  // LAST MESSAGE ID
  // ==========================================

  updateLastMessageId(): void {

    if (!this.messages.length) {

      this.lastMessageId = 0;

      return;

    }


    const ids = this.messages
      .map(item => Number(item.id))
      .filter(id => !isNaN(id));


    if (ids.length) {

      this.lastMessageId =
        Math.max(...ids);

    }

  }


  // ==========================================
  // SEND REPLY
  // ==========================================

  sendReply(): void {

    // Don't allow reply if ticket is closed
    if (
      this.ticket?.status
        ?.toLowerCase() === 'closed'
    ) {

      return;

    }


    const text =
      this.message.trim();


    if (
      !text ||
      this.sending ||
      text.length > this.maxMessageLength
    ) {

      return;

    }


    this.sending = true;

    this.forceScrollOnNextLoad = true;

    this.cdr.markForCheck();


    this.ticketService
      .replyTicket(
        this.ticketId,
        text
      )
      .subscribe({

        next: (res: any) => {

          console.log(
            'Reply response:',
            res
          );


          this.message = '';

          this.sending = false;

          if (this.composer) {

            this.composer.nativeElement.style.height = 'auto';

          }


          // Fetch the new reply right away
          this.pollMessages();

          this.cdr.markForCheck();

          setTimeout(() => this.composer?.nativeElement.focus());

        },

        error: (error) => {

          console.error(
            'Send reply error:',
            error
          );


          this.sending = false;

          this.cdr.markForCheck();

        }

      });

  }


  // ==========================================
  // CHANGE STATUS
  // ==========================================

  changeStatus(status: string): void {

    if (
      !status ||
      this.updatingStatus
    ) {

      return;

    }


    this.updatingStatus = true;

    // Ignore any status poll already in flight.
    this.statusGeneration++;

    this.selectedStatus = status;

    this.cdr.markForCheck();


    const data = {
      status: status
    };


    this.ticketService
      .updateTicketstatus(
        this.ticketId,
        data
      )
      .subscribe({

        next: (res: any) => {

          console.log(
            'Status updated:',
            res
          );


          this.updatingStatus = false;

          this.setStatus(status);

        },

        error: (error) => {

          console.error(
            'Status update error:',
            error
          );


          this.updatingStatus = false;

          // Put the dropdown back to the real status.
          this.selectedStatus =
            this.ticket?.status || 'Open';

          this.cdr.markForCheck();

        }

      });

  }


  // ==========================================
  // CLOSE TICKET
  // ==========================================

  closeTicket(): void {

    if (
      this.updatingStatus ||
      this.ticket?.status
        ?.toLowerCase() === 'closed'
    ) {

      return;

    }


    this.updatingStatus = true;

    // Ignore any status poll already in flight.
    this.statusGeneration++;

    this.cdr.markForCheck();


    const data = {
      status: 'Closed'
    };


    this.ticketService
      .updateTicketstatus(
        this.ticketId,
        data
      )
      .subscribe({

        next: (res: any) => {

          console.log(
            'Ticket closed:',
            res
          );


          this.updatingStatus = false;

          this.setStatus('Closed');

        },

        error: (error) => {

          console.error(
            'Close ticket error:',
            error
          );


          this.updatingStatus = false;

          this.cdr.markForCheck();

        }

      });

  }


  // ==========================================
  // REFRESH
  // ==========================================

  refreshMessages(): void {

    this.getMessages();

  }


  // ==========================================
  // BACK
  // ==========================================

  back(): void {

    this.router.navigate([
      '/main/alltickets'
    ]);

  }

}