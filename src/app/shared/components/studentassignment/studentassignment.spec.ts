import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { StudentAssignment } from './studentassignment';
import { signIn, testProviders } from '../../../../testing/test-providers';

describe('StudentAssignment', () => {
  let fixture: ComponentFixture<StudentAssignment>;

  beforeEach(async () => {
    localStorage.clear();
    signIn();

    await TestBed.configureTestingModule({
      imports: [StudentAssignment],
      providers: testProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(StudentAssignment);
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
