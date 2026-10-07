import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { SuperadminStudentAssignments } from './superadmin-student-assignments';
import { signIn, testProviders } from '../../../../testing/test-providers';

describe('SuperadminStudentAssignments', () => {
  let fixture: ComponentFixture<SuperadminStudentAssignments>;

  beforeEach(async () => {
    localStorage.clear();
    signIn();

    await TestBed.configureTestingModule({
      imports: [SuperadminStudentAssignments],
      providers: testProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(SuperadminStudentAssignments);
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
