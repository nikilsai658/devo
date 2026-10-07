import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';

import { App } from './app';
import { testProviders } from '../testing/test-providers';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: testProviders(),
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the router outlet, toasts and the confirm dialog host', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('router-outlet')).not.toBeNull();
    expect(el.querySelector('app-toast-container')).not.toBeNull();
    expect(el.querySelector('app-confirm-dialog')).not.toBeNull();
  });

  it('shows the progress bar only while a request is in flight', async () => {
    const fixture = TestBed.createComponent(App);
    const el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    expect(el.querySelector('.global-progress')).toBeNull();

    TestBed.inject(HttpClient).get('/x').subscribe();
    fixture.detectChanges();
    expect(el.querySelector('.global-progress')).not.toBeNull();

    TestBed.inject(HttpTestingController).expectOne('/x').flush({});
    fixture.detectChanges();
    expect(el.querySelector('.global-progress')).toBeNull();
  });
});
