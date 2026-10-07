import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { HttpEventType } from '@angular/common/http';

import { StudentTask } from './student-task';
import { setApiBase } from '../../../core/api/api-base';
import { ConfirmService } from '../confirm-dialog/confirm';
import { signIn, testProviders } from '../../../../testing/test-providers';

const API = 'https://tit.example.test/api';

function pick(component: StudentTask, file: File) {
  const input = document.createElement('input');
  Object.defineProperty(input, 'files', { value: [file] });
  return component.onFileSelected({ target: input } as unknown as Event);
}

describe('StudentTask', () => {
  let fixture: ComponentFixture<StudentTask>;
  let component: StudentTask;
  let backend: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    setApiBase(API);
    signIn(['VIEW_STUDENT_COURSES']);
    history.replaceState({ taskId: 4, domainId: 1, courseId: 2 }, '');
    await TestBed.configureTestingModule({ imports: [StudentTask], providers: testProviders() }).compileComponents();
    fixture = TestBed.createComponent(StudentTask);
    component = fixture.componentInstance;
    backend = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    backend.match(() => true).forEach(r => r.flush({ data: null }));
    history.replaceState(null, '');
  });

  it('rejects a disallowed file type before uploading', async () => {
    backend.expectOne(`${API}/Student/task/4`).flush({ data: { taskTitle: 'T', hasSubmission: false } });
    await pick(component, new File(['x'], 'evil.html'));
    expect(component.uploadError).toContain('not allowed');
    backend.expectNone(`${API}/Student/task/4/upload`);
  });

  it('asks before replacing an existing submission, and keeps it when cancelled', async () => {
    backend.expectOne(`${API}/Student/task/4`).flush({ data: { taskTitle: 'T', hasSubmission: true } });
    const ask = vi.spyOn(TestBed.inject(ConfirmService), 'ask').mockResolvedValue(false);
    await pick(component, new File(['x'], 'answer.pdf'));
    expect(ask).toHaveBeenCalled();
    backend.expectNone(`${API}/Student/task/4/upload`);
  });

  it('uploads with progress and reports the server reason on failure', async () => {
    backend.expectOne(`${API}/Student/task/4`).flush({ data: { taskTitle: 'T', hasSubmission: false } });
    await pick(component, new File(['x'], 'answer.pdf'));
    const req = backend.expectOne(`${API}/Student/task/4/upload`);
    req.event({ type: HttpEventType.UploadProgress, loaded: 3, total: 4 });
    expect(component.uploadPercent).toBe(75);
    req.flush({ message: 'Deadline has passed' }, { status: 400, statusText: 'Bad Request' });
    expect(component.uploadError).toBe('Deadline has passed');
    expect(component.uploading).toBe(false);
  });

  it('explains a load failure instead of claiming the task does not exist', () => {
    backend.expectOne(`${API}/Student/task/4`).flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Task could not be loaded');
  });
});
