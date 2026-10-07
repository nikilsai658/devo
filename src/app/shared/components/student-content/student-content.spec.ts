import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { StudentContent } from './student-content';
import { setApiBase } from '../../../core/api/api-base';
import { ToastService } from '../../toast/toast';
import { signIn, testProviders } from '../../../../testing/test-providers';

const API = 'https://tit.example.test/api';
const PREVIEW = `${API}/Student/domain/1/course/2/material/3/preview`;

describe('StudentContent preview', () => {
  let fixture: ComponentFixture<StudentContent>;
  let backend: HttpTestingController;
  let tab: { close: ReturnType<typeof vi.fn>; location: { href: string } };

  beforeEach(async () => {
    localStorage.clear();
    setApiBase(API);
    signIn(['VIEW_STUDENT_COURSE_CONTENT']);
    history.replaceState({ domainId: 1, courseId: 2 }, '');
    await TestBed.configureTestingModule({ imports: [StudentContent], providers: testProviders() }).compileComponents();
    fixture = TestBed.createComponent(StudentContent);
    backend = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    backend.match(() => true).forEach(r => r.flush({ data: [] }));

    tab = { close: vi.fn(), location: { href: '' } };
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    history.replaceState(null, '');
  });

  it('opens a PDF in the new tab', () => {
    fixture.componentInstance.view({ id: 3 });
    backend.expectOne(PREVIEW).flush(new Blob(['%PDF'], { type: 'application/pdf' }));
    expect(tab.location.href).toBe('blob:preview');
  });

  it('shows HTML only as plain text, never as a page on this origin', () => {
    const create = URL.createObjectURL as unknown as ReturnType<typeof vi.fn>;
    fixture.componentInstance.view({ id: 3 });
    backend.expectOne(PREVIEW).flush(new Blob(['<script>steal()</script>'], { type: 'text/html' }));
    expect((create.mock.calls[0][0] as Blob).type).toBe('text/plain;charset=utf-8');
  });

  it('refuses SVG and other types that can run script, and suggests downloading', () => {
    const toast = vi.spyOn(TestBed.inject(ToastService), 'error');
    fixture.componentInstance.view({ id: 3 });
    backend.expectOne(PREVIEW).flush(new Blob(['<svg onload=x>'], { type: 'image/svg+xml' }));
    expect(tab.close).toHaveBeenCalled();
    expect(tab.location.href).toBe('');
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('Download'));
  });
});
