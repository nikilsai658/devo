import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { Permission } from './permissions';
import { signIn, testProviders } from '../../../../testing/test-providers';

describe('Permission', () => {
  let fixture: ComponentFixture<Permission>;

  beforeEach(async () => {
    localStorage.clear();
    signIn();

    await TestBed.configureTestingModule({
      imports: [Permission],
      providers: testProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(Permission);
    fixture.detectChanges();
  });

  afterEach(() => {
    // Requests the page made on load are answered empty, so nothing is left in flight.
    const http = TestBed.inject(HttpTestingController);
    http.match(() => true).forEach(req => req.flush({ data: [] }));
    localStorage.clear();
  });

  it('should create and render', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
