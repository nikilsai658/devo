import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { Changepassword } from './changepassword';
import { setApiBase } from '../../core/api/api-base';
import { signIn, testProviders } from '../../../testing/test-providers';

const API = 'https://tit.example.test/api';

async function changePassword(profileCompleted: boolean) {
  localStorage.clear();
  setApiBase(API);
  signIn([], { isFirstLogin: true, profileCompleted });
  await TestBed.configureTestingModule({ imports: [Changepassword], providers: testProviders() }).compileComponents();
  const fixture = TestBed.createComponent(Changepassword);
  fixture.detectChanges();
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  fixture.componentInstance.Form.patchValue({ oldPassword: 'Old#12345', newPassword: 'New#12345', confirmPassword: 'New#12345' });
  fixture.componentInstance.onSubmit();
  TestBed.inject(HttpTestingController).expectOne(`${API}/Auth/change-password`).flush({});
  return navigate;
}

describe('Changepassword (first login)', () => {
  it('records the step as done and continues to the profile when it is incomplete', async () => {
    const navigate = await changePassword(false);
    expect(JSON.parse(localStorage.getItem('user')!).isFirstLogin).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/profile');
  });

  it('goes straight into the app when the profile is already complete', async () => {
    const navigate = await changePassword(true);
    expect(navigate).toHaveBeenCalledWith('/main');
  });
});
