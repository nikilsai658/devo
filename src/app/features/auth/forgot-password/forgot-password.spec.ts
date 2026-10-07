import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { ForgotPassword } from './forgot-password';
import { setApiBase } from '../../../core/api/api-base';
import { testProviders } from '../../../../testing/test-providers';

const API = 'https://tit.example.test/api';

describe('ForgotPassword', () => {
  beforeEach(() => {
    localStorage.clear();
    setApiBase(API);
    localStorage.setItem('collegecode', 'TIT');
  });

  afterEach(() => vi.useRealTimers());

  async function create() {
    await TestBed.configureTestingModule({ imports: [ForgotPassword], providers: testProviders() }).compileComponents();
    const fixture = TestBed.createComponent(ForgotPassword);
    fixture.detectChanges();
    return fixture;
  }

  it('sends one request even if submitted twice', async () => {
    const fixture = await create();
    fixture.componentInstance.Form.patchValue({ email: 'a@x.edu' });
    fixture.componentInstance.OnSubmit();
    fixture.componentInstance.OnSubmit();
    const backend = TestBed.inject(HttpTestingController);
    expect(backend.match(`${API}/Auth/forget-password`).length).toBe(1);
  });

  it('does not navigate after the page was left', async () => {
    vi.useFakeTimers();
    const fixture = await create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.Form.patchValue({ email: 'a@x.edu' });
    fixture.componentInstance.OnSubmit();
    TestBed.inject(HttpTestingController).expectOne(`${API}/Auth/forget-password`).flush({ message: 'Sent' });
    expect(fixture.componentInstance.message).toBe('Sent');

    fixture.destroy();
    vi.advanceTimersByTime(5000);
    expect(navigate).not.toHaveBeenCalled();
  });
});
