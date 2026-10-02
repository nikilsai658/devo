import { Directive, ElementRef, HostListener, Input, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

// Strips everything except digits as the user types or pastes, and caps the
// length (default 10, for phone numbers).
//
//   <input appDigitsOnly formControlName="phoneNumber" />
@Directive({
  selector: 'input[appDigitsOnly]',
  standalone: true,
  host: { inputmode: 'numeric', autocomplete: 'tel' }
})
export class DigitsOnly {

  @Input() maxDigits = 10;

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Optional() private ngControl: NgControl
  ) {}

  @HostListener('input')
  onInput(): void {
    const input = this.el.nativeElement;
    const clean = input.value.replace(/\D/g, '').slice(0, this.maxDigits);
    if (clean !== input.value) {
      input.value = clean;
      this.ngControl?.control?.setValue(clean);
    }
  }
}
