import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { StudentAssignment } from './student-assignment';
import { setApiBase } from '../../../core/api/api-base';
import { AssignmentLockService } from '../../../features/services/assignment-lock-service/assignment-lock-service';
import { signIn, testProviders } from '../../../../testing/test-providers';

const API = 'https://tit.example.test/api';

describe('StudentAssignment', () => {
  let fixture: ComponentFixture<StudentAssignment>;
  let backend: HttpTestingController;

  async function create(state: unknown) {
    history.replaceState(state, '');
    await TestBed.configureTestingModule({ imports: [StudentAssignment], providers: testProviders() }).compileComponents();
    fixture = TestBed.createComponent(StudentAssignment);
    backend = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setApiBase(API);
    signIn(['VIEW_STUDENT_COURSES']);
  });

  afterEach(() => {
    fixture?.destroy();
    backend?.match(() => true).forEach(r => r.flush({ data: [] }));
    history.replaceState(null, '');
    sessionStorage.clear();
  });

  it('loads the assignment it was opened with', async () => {
    await create({ Id: 7 });
    backend.expectOne(`${API}/Student/assignment/7`).flush({ data: [{ assignmentId: 7, title: 'Two Sum' }] });
    expect(fixture.componentInstance.assignment.title).toBe('Two Sum');
    expect(sessionStorage.getItem('activeAssignmentId')).toBe('7');
  });

  it('recovers the assignment from the session after the navigation state is lost', async () => {
    sessionStorage.setItem('activeAssignmentId', '9');
    await create(null);
    backend.expectOne(`${API}/Student/assignment/9`).flush({ data: [{ assignmentId: 9 }] });
  });

  it('goes back to the student pages when no assignment is known (no request with "undefined")', async () => {
    const navigate = vi.spyOn(Router.prototype, 'navigate').mockResolvedValue(true);
    await create(null);
    backend.expectNone(r => r.url.includes('Student/assignment'));
    expect(navigate).toHaveBeenCalledWith(['/main/student-domain']);
  });

  it('shows a retry message when the assignment cannot be loaded', async () => {
    await create({ Id: 7 });
    backend.expectOne(`${API}/Student/assignment/7`).flush({ message: 'Assignment closed' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    expect(fixture.componentInstance.loadError).toBe('Assignment closed');
    expect(fixture.nativeElement.textContent).toContain('Retry');
  });

  it('submits the proctoring counts with the code', async () => {
    await create({ Id: 7 });
    backend.expectOne(`${API}/Student/assignment/7`).flush({ data: [{ assignmentId: 7 }] });
    const lock = TestBed.inject(AssignmentLockService);
    lock.tabSwitchCount = 2;
    lock.fullscreenExitCount = 1;

    fixture.componentInstance.onSubmitCode({ sourceCode: 'print(1)', languageId: 71, stdin: null } as any);

    const req = backend.expectOne(`${API}/Student/submit`);
    expect(req.request.body).toEqual({
      assignmentId: 7, sourceCode: 'print(1)', languageId: 71, stdin: null, tabSwitchCount: 2, fullscreenExitCount: 1
    });
    req.flush({ data: { score: 10 } });
  });
});
