import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';

import { ResetPassword } from './reset-password';
import { setApiBase } from '../../../core/api/api-base';
import { ToastService } from '../../../shared/toast/toast';
import { testProviders } from '../../../../testing/test-providers';

const API = 'https://tit.example.test/api';

async function create(params: Record<string, string>) {
  await TestBed.configureTestingModule({
    imports: [ResetPassword],
    providers: [
      ...testProviders(),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(params) } } }
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ResetPassword);
  fixture.detectChanges();
  return fixture;
}

describe('ResetPassword', () => {
  beforeEach(() => {
    localStorage.clear();
    setApiBase(API);
    localStorage.setItem('collegecode', 'TIT');
  });

  it('says so when the link is incomplete', async () => {
    const fixture = await create({});
    expect(fixture.componentInstance.message).toContain('incomplete');
  });

  it('confirms with a toast (which survives the navigation) and goes to login', async () => {
    const fixture = await create({ userId: 'u1', token: 'tok' });
    const toast = vi.spyOn(TestBed.inject(ToastService), 'success');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.Form.patchValue({ newPassword: 'Secret#123', confirmPassword: 'Secret#123' });
    fixture.componentInstance.onSubmit();

    const req = TestBed.inject(HttpTestingController).expectOne(`${API}/Auth/reset-password`);
    expect(req.request.body).toEqual(expect.objectContaining({ userId: 'u1', token: 'tok', CollegeCode: 'TIT' }));
    req.flush({});
    expect(toast).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('shows the server reason, e.g. an expired link', async () => {
    const fixture = await create({ userId: 'u1', token: 'tok' });
    fixture.componentInstance.Form.patchValue({ newPassword: 'Secret#123', confirmPassword: 'Secret#123' });
    fixture.componentInstance.onSubmit();
    TestBed.inject(HttpTestingController).expectOne(`${API}/Auth/reset-password`)
      .flush({ message: 'The reset link has expired.' }, { status: 400, statusText: 'Bad Request' });
    expect(fixture.componentInstance.message).toBe('The reset link has expired.');
  });
});
