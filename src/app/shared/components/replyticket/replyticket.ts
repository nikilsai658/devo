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

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { TicketService } from '../../../features/services/ticket/ticket-service';

@Component({
  selector: 'app-reply-ticket',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './replyticket.html',
  styleUrl: './replyticket.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReplyTicketComponent
  implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('chatScroll')
  chatScroll?: ElementRef<HTMLDivElement>;

  @ViewChild('composer')
  composer?: ElementRef<HTMLTextAreaElement>;

  ticketId!: number;

  ticket: any = null;

  messages: any[] = [];

  message = '';

  loading = false;

  messagesLoading = false;

  sending = false;

  lastMessageId = 0;

  private pollingId: ReturnType<typeof setInterval> | null = null;

  private readonly pollingInterval = 2000;

  readonly maxMessageLength = 1000;

  private forceScrollOnNextLoad = false;

  private statusPolling = false;

  private messagesPolling = false;

  private loadGeneration = 0;


  // ==========================================
  // SCROLL (WHATSAPP-STYLE STICK TO BOTTOM)
  // ==========================================

  // True while the student is at the latest message;
  // turns off when they scroll up to read history.
  stickToBottom = true;

  // Messages that arrived while scrolled up.
  unreadCount = 0;

  private pendingScroll = false;


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

    this.ticketId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!this.ticketId || isNaN(this.ticketId)) {

      console.error('Invalid Ticket ID');

      this.router.navigate([
        '/main/mytickets'
      ]);

      return;
    }

    this.loadTicket();

    this.messagesLoading = true;

    this.loadMessages();

    this.startPolling();
  }


  // ==========================================
  // LOAD TICKET
  // ==========================================

  loadTicket(): void {

    this.loading = true;

    this.ticketService
      .getTicketById(this.ticketId)
      .subscribe({

        next: (res: any) => {

          this.ticket =
            res?.data ?? null;

          this.loading = false;

          this.cdr.markForCheck();
        },

        error: (err) => {

          console.error(
            'Error loading ticket:',
            err
          );

          this.loading = false;

          this.cdr.markForCheck();
        }

      });
  }


  // ==========================================
  // REFRESH TICKET STATUS (SILENT)
  // ==========================================

  /*
   * Picks up status changes made by the admin
   * (e.g. Closed) without a page reload.
   */
  refreshTicketStatus(): void {

    if (this.statusPolling) {
      return;
    }

    this.statusPolling = true;

    this.ticketService
      .getTicketById(this.ticketId)
      .subscribe({

        next: (res: any) => {

          const latest = res?.data;

          if (
            latest &&
            latest.status !== this.ticket?.status
          ) {

            this.ticket = latest;

            this.cdr.markForCheck();
          }

          this.statusPolling = false;
        },

        error: () => {

          this.statusPolling = false;
        }

      });
  }


  isClosed(): boolean {

    return (
      String(this.ticket?.status || '')
        .toLowerCase() === 'closed'
    );
  }


  // ==========================================
  // LOAD MESSAGES
  // ==========================================

  loadMessages(): void {

    if (
      !this.ticketId ||
      this.messagesPolling
    ) {
      return;
    }

    this.messagesPolling = true;

    const generation = this.loadGeneration;

    this.ticketService
      .getMessages(
        this.ticketId,
        this.lastMessageId
      )
      .subscribe({

        next: (res: any) => {

          // A refresh started meanwhile; drop stale results.
          if (generation !== this.loadGeneration) {
            return;
          }

          const newMessages =
            Array.isArray(res?.data) ? res.data : [];

          this.mergeMessages(newMessages);

          this.messagesPolling = false;

          this.messagesLoading = false;

          this.cdr.markForCheck();
        },

        error: (err) => {

          if (generation !== this.loadGeneration) {
            return;
          }

          console.error(
            'Error loading messages:',
            err
          );

          this.messagesPolling = false;

          this.messagesLoading = false;

          this.cdr.markForCheck();
        }

      });
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

    if (!added.length) {
      return;
    }

    this.messages = [
      ...this.messages,
      ...added
    ];

    const lastId = Number(
      this.messages[this.messages.length - 1]?.id
    );

    if (!isNaN(lastId)) {
      this.lastMessageId = lastId;
    }

    /*
     * Stick to the last message on first load,
     * after the student's own message, or when
     * they're already at the bottom. Otherwise
     * keep their position and count the unread.
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
  // REFRESH
  // ==========================================

  refresh(): void {

    this.loadGeneration++;

    this.messagesPolling = false;

    this.lastMessageId = 0;

    this.messages = [];

    this.unreadCount = 0;

    this.messagesLoading = true;

    this.loadTicket();

    this.loadMessages();
  }


  // ==========================================
  // START POLLING
  // ==========================================

  startPolling(): void {

    if (this.pollingId) {
      return;
    }

    this.pollingId = setInterval(() => {

      this.loadMessages();

      this.refreshTicketStatus();

    }, this.pollingInterval);
  }


  // ==========================================
  // SEND MESSAGE
  // ==========================================

  send(): void {

    const text =
      this.message.trim();

    if (
      !text ||
      this.sending ||
      text.length > this.maxMessageLength
    ) {
      return;
    }

    /*
     * A closed ticket must not accept replies
     * (the backend would reopen it).
     */
    if (this.isClosed()) {
      return;
    }

    this.sending = true;

    this.forceScrollOnNextLoad = true;

    this.cdr.markForCheck();

    /*
     * Re-check the latest status first, in case
     * the admin closed it in the last few seconds.
     */
    this.ticketService
      .getTicketById(this.ticketId)
      .subscribe({

        next: (res: any) => {

          const latest = res?.data;

          if (latest) {
            this.ticket = latest;
          }

          if (this.isClosed()) {

            this.sending = false;

            this.forceScrollOnNextLoad = false;

            this.cdr.markForCheck();

            return;
          }

          this.postReply(text);
        },

        error: (err) => {

          console.error(
            'Status check failed:',
            err
          );

          this.sending = false;

          this.cdr.markForCheck();
        }

      });
  }


  private postReply(text: string): void {

    this.ticketService
      .replyTicket(
        this.ticketId,
        text
      )
      .subscribe({

        next: () => {

          this.message = '';

          this.sending = false;

          this.resetComposerHeight();

          this.cdr.markForCheck();

          // Get the newly created message immediately.
          this.loadMessages();

          setTimeout(() => this.composer?.nativeElement.focus());
        },

        error: (err) => {

          console.error(
            'Message send failed:',
            err
          );

          this.sending = false;

          this.cdr.markForCheck();
        }

      });
  }


  // ==========================================
  // COMPOSER
  // ==========================================

  sendOnEnter(event: Event): void {

    // Shift + Enter = new line
    if ((event as KeyboardEvent).shiftKey) {
      return;
    }

    event.preventDefault();

    this.send();
  }

  // Grow the textarea with its content, up to a cap.
  autoGrow(): void {

    const el = this.composer?.nativeElement;

    if (!el) {
      return;
    }

    el.style.height = 'auto';

    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  private resetComposerHeight(): void {

    const el = this.composer?.nativeElement;

    if (el) {
      el.style.height = 'auto';
    }
  }


  // ==========================================
  // SCROLLING
  // ==========================================

  /*
   * The actual scroll happens in ngAfterViewChecked,
   * i.e. after Angular has rendered the new messages.
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

    const el = this.chatScroll?.nativeElement;

    if (!el) {
      return;
    }

    el.scrollTop = el.scrollHeight;

    this.pendingScroll = false;
  }

  onChatScroll(): void {

    const el = this.chatScroll?.nativeElement;

    if (!el) {
      return;
    }

    const atBottom =
      el.scrollHeight -
        el.scrollTop -
        el.clientHeight <
      80;

    if (atBottom === this.stickToBottom) {
      return;
    }

    this.stickToBottom = atBottom;

    if (atBottom) {
      this.unreadCount = 0;
    }

    this.cdr.markForCheck();
  }


  // ==========================================
  // MESSAGE HELPERS
  // ==========================================

  // Student = YOU (right side); admin/superadmin on the left.
  isMyMessage(msg: any): boolean {

    return String(msg?.senderRole || '')
      .trim()
      .toLowerCase() === 'student';
  }

  getSenderName(msg: any): string {

    if (this.isMyMessage(msg)) {
      return 'You';
    }

    return msg?.senderName || 'Support Team';
  }

  getSenderRole(msg: any): string {

    return msg?.senderRole || 'Support';
  }

  getInitials(msg: any): string {

    const name = String(
      msg?.senderName || msg?.senderRole || 'Support'
    ).trim();

    const parts = name.split(/\s+/).filter(Boolean);

    const initials =
      parts.length > 1
        ? parts[0][0] + parts[parts.length - 1][0]
        : name.slice(0, 2);

    return initials.toUpperCase();
  }

  // First message of a run from the same side shows name + avatar.
  isFirstInGroup(index: number): boolean {

    if (index === 0 || this.showDateDivider(index)) {
      return true;
    }

    const prev = this.messages[index - 1];

    const curr = this.messages[index];

    return (
      this.isMyMessage(prev) !== this.isMyMessage(curr) ||
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

    const today = new Date();

    const yesterday = new Date();

    yesterday.setDate(today.getDate() - 1);

    if (this.dayKey(date) === this.dayKey(today)) {
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
  // BACK
  // ==========================================

  back(): void {

    this.stopPolling();

    this.router.navigate([
      '/main/mytickets'
    ]);
  }


  // ==========================================
  // STOP POLLING
  // ==========================================

  stopPolling(): void {

    if (this.pollingId) {

      clearInterval(
        this.pollingId
      );

      this.pollingId = null;
    }
  }


  // ==========================================
  // DESTROY
  // ==========================================

  ngOnDestroy(): void {

    this.stopPolling();
  }

}
