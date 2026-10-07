import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { YearUpdation } from './year-updation';
import { setApiBase } from '../../../core/api/api-base';
import { ConfirmService } from '../confirm-dialog/confirm';
import { signIn, testProviders } from '../../../../testing/test-providers';

const API = 'https://tit.example.test/api';

describe('YearUpdation', () => {
  let fixture: ComponentFixture<YearUpdation>;
  let component: YearUpdation;
  let backend: HttpTestingController;
  let ask: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    localStorage.clear();
    setApiBase(API);
    signIn(['UPDATE_YEAR']);
    await TestBed.configureTestingModule({ imports: [YearUpdation], providers: testProviders() }).compileComponents();
    fixture = TestBed.createComponent(YearUpdation);
    component = fixture.componentInstance;
    backend = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    backend.match(() => true).forEach(r => r.flush({ data: [] }));
    ask = vi.spyOn(TestBed.inject(ConfirmService), 'ask');
  });

  afterEach(() => backend.verify());

  it('does not promote anyone when the confirmation is cancelled', async () => {
    ask.mockResolvedValue(false);
    component.promoteForm.patchValue({ fromYearId: 1, toYearId: 2 });
    await component.promoteYear();
    expect(ask).toHaveBeenCalledWith(expect.stringContaining('year 1'), expect.anything());
    backend.expectNone(`${API}/Year/promote`);
  });

  it('promotes after confirmation', async () => {
    ask.mockResolvedValue(true);
    component.promoteForm.patchValue({ fromYearId: 1, toYearId: 2 });
    await component.promoteYear();
    const req = backend.expectOne(`${API}/Year/promote`);
    expect(req.request.body).toEqual(expect.objectContaining({ fromYearId: 1, toYearId: 2 }));
    req.flush({});
  });

  it('checks the promotion file and confirms before sending it', async () => {
    component.selectedFile = new File(['x'], 'list.pdf');
    await component.uploadPromoteFile();
    expect(ask).not.toHaveBeenCalled();
    backend.expectNone(`${API}/Year/promote-with-domains`);

    ask.mockResolvedValue(true);
    const input = document.createElement('input');
    component.selectedFile = new File(['x'], 'list.xlsx');
    await component.uploadPromoteFile(input);
    expect(ask).toHaveBeenCalled();
    backend.expectOne(`${API}/Year/promote-with-domains`).flush({});
    expect(component.selectedFile).toBeNull();
  });
});
