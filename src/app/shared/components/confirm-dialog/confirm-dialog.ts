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
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog {

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
