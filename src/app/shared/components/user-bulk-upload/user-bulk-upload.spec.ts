import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { HttpEventType } from '@angular/common/http';

import { UserBulkUpload } from './user-bulk-upload';
import { setApiBase } from '../../../core/api/api-base';
import { ToastService } from '../../toast/toast';
import { signIn, testProviders } from '../../../../testing/test-providers';

const API = 'https://tit.example.test/api';

describe('UserBulkUpload', () => {
  let fixture: ComponentFixture<UserBulkUpload>;
  let component: UserBulkUpload;
  let backend: HttpTestingController;
  let toastError: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    localStorage.clear();
    setApiBase(API);
    signIn();
    await TestBed.configureTestingModule({ imports: [UserBulkUpload], providers: testProviders() }).compileComponents();
    fixture = TestBed.createComponent(UserBulkUpload);
    component = fixture.componentInstance;
    backend = TestBed.inject(HttpTestingController);
    toastError = vi.spyOn(TestBed.inject(ToastService), 'error');
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('refuses a file that is not a spreadsheet, before sending anything', () => {
    component.selectedFile = new File(['x'], 'users.pdf');
    component.uploadFile();
    backend.expectNone(`${API}/User/BulkUpload`);
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('CSV or Excel'));
    expect(component.uploading).toBe(false);
  });

  it('uploads, follows the job and tells the page to reload its list', () => {
    vi.useFakeTimers();
    const imported = vi.fn();
    component.imported.subscribe(imported);

    component.selectedFile = new File(['email\na@x.edu'], 'users.csv');
    component.uploadFile();

    const upload = backend.expectOne(`${API}/User/BulkUpload`);
    upload.event({ type: HttpEventType.UploadProgress, loaded: 5, total: 10 });
    expect(component.uploadPercent).toBe(50);
    upload.flush({ data: { jobId: 'job-1' } });

    vi.advanceTimersByTime(0);
    backend.expectOne(`${API}/User/BulkUpload/job-1/status`).flush({ data: { status: 'Processing', totalRows: 1, processedRows: 0 } });
    vi.advanceTimersByTime(1000);
    backend.expectOne(`${API}/User/BulkUpload/job-1/status`).flush({ data: { status: 'Completed', totalRows: 1, successCount: 1, failedCount: 0 } });

    expect(imported).toHaveBeenCalled();
    expect(component.uploadComplete?.success).toBe(1);
    expect(component.uploading).toBe(false);
    backend.match(() => true).forEach(r => r.flush({ data: [] }));
  });

  it('stops following a job that never finishes, and says so', () => {
    vi.useFakeTimers();
    component.selectedFile = new File(['x'], 'users.xlsx');
    component.uploadFile();
    backend.expectOne(`${API}/User/BulkUpload`).flush({ data: { jobId: 'stuck' } });

    // Answer every poll with "still processing" for just over 30 minutes.
    for (let i = 0; i <= 30 * 60 + 1; i++) {
      vi.advanceTimersByTime(1000);
      backend.match(`${API}/User/BulkUpload/stuck/status`).forEach(r => r.flush({ data: { status: 'Processing' } }));
    }

    expect(component.uploading).toBe(false);
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('still working on this file'));
    vi.advanceTimersByTime(5000);
    backend.expectNone(`${API}/User/BulkUpload/stuck/status`);
  });
});
