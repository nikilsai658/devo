import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  HostListener,
  effect,
  inject,
  viewChild
} from '@angular/core';
import { ConfirmService } from './confirm';

@Component({
  selector: 'app-confirm-dailog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './confirm-dailog.html',
  styleUrl: './confirm-dailog.css',
})
export class ConfirmDailog {

  readonly confirm = inject(ConfirmService);

  private readonly cancelBtn = viewChild<ElementRef<HTMLButtonElement>>('cancelBtn');

  constructor() {

    // Focus Cancel when the dialog opens, so a stray Enter doesn't delete.
    effect(() => {
      if (this.confirm.request()) {
        queueMicrotask(() => this.cancelBtn()?.nativeElement.focus());
      }
    });

  }

  @HostListener('document:keydown.escape')
  onEscape(): void {

    if (this.confirm.request()) {
      this.confirm.close(false);
    }

  }

}
