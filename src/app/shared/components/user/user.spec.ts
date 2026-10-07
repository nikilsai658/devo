import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, TestRequest } from '@angular/common/http/testing';

import { UserComponent } from './user';
import { setApiBase } from '../../../core/api/api-base';
import { signIn, testProviders } from '../../../../testing/test-providers';

const API = 'https://tit.example.test/api';

const USERS = [
  { id: 1, fullName: 'Priya Sharma', email: 'priya@x.edu', roleName: 'Student', isActive: true },
  { id: 2, fullName: 'Arjun Rao', email: 'arjun@x.edu', roleName: 'Faculty', isActive: true },
  { id: 3, fullName: 'Pratik Jain', email: 'pratik@x.edu', roleName: 'Student', isActive: false }
];

describe('UserComponent', () => {
  let fixture: ComponentFixture<UserComponent>;
  let component: UserComponent;
  let backend: HttpTestingController;

  const userRequests = () => backend.match(r => r.method === 'GET' && r.url === `${API}/User`);

  function flushLookups() {
    const answers: Record<string, unknown> = {
      [`${API}/Department`]: { data: [{ name: 'CSE' }, { name: 'ECE' }, { name: 'MECH' }] },
      [`${API}/Branch`]: { data: [{ name: 'AI' }, { name: 'VLSI' }] },
      [`${API}/CollegeDepartment`]: { data: [{ collegeName: 'TIT', departmentName: 'CSE' }, { collegeName: 'TIT', departmentName: 'ECE' }] },
      [`${API}/DepartmentBranch`]: { data: [{ departmentName: 'CSE', branchName: 'AI' }] },
      [`${API}/Role`]: { data: [{ name: 'Student' }, { name: 'Faculty' }] },
      [`${API}/Role/assignable`]: { data: [{ name: 'Student' }] },
      [`${API}/SuperAdmin/students/locked`]: { data: [] }
    };
    backend.match(r => r.url in answers || r.url.endsWith('/College')).forEach(r =>
      r.flush(answers[r.request.url] ?? { data: [{ name: 'TIT' }] }));
  }

  beforeEach(async () => {
    localStorage.clear();
    setApiBase(API);
    signIn(['VIEW_USER', 'UPDATE_USER', 'DELETE_USER']);
    await TestBed.configureTestingModule({ imports: [UserComponent], providers: testProviders() }).compileComponents();
    fixture = TestBed.createComponent(UserComponent);
    component = fixture.componentInstance;
    backend = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushLookups();
    userRequests().forEach(r => r.flush({ data: USERS }));
    flushLookups();
  });

  afterEach(() => {
    backend.match(() => true).forEach(r => r.flush({ data: [] }));
    localStorage.clear();
  });

  it('loads the users', () => {
    expect(component.totalRecords).toBe(3);
  });

  it('filling in the Add/Edit dialog never changes the filters or reloads the table', () => {
    component.openAddModal();
    component.userForm.patchValue({ roleName: 'Faculty', collegeName: 'TIT', yearNumber: 2 });
    component.editUser(USERS[0]);

    expect(userRequests().length).toBe(0);
    expect(component.filterForm.value.roleName).toBe('');
    expect(component.filterForm.value.collegeName).toBeNull();
  });

  it('changing a filter reloads with that filter, on page 1', () => {
    component.page = 2;
    component.filterForm.patchValue({ roleName: 'Student' });
    const [req] = userRequests();
    expect(req.request.params.get('RoleName')).toBe('Student');
    expect(component.page).toBe(1);
    req.flush({ data: [USERS[0], USERS[2]] });
    expect(component.totalRecords).toBe(2);
  });

  it('a slow older response cannot overwrite the newer filter result', () => {
    component.filterForm.patchValue({ roleName: 'Student' });
    component.filterForm.patchValue({ roleName: 'Faculty' });
    const reqs = userRequests();
    expect(reqs.length).toBe(2);
    expect(reqs[0].cancelled).toBe(true);
    reqs[1].flush({ data: [USERS[1]] });
    expect(component.users.map(u => u.id)).toEqual([2]);
  });

  it('clear filters resets the filter bar and reloads once', () => {
    component.filterForm.patchValue({ roleName: 'Student' });
    userRequests().forEach(r => r.flush({ data: [] }));
    component.clearFilters();
    expect(userRequests().length).toBe(1);
    expect(component.filterForm.value.roleName).toBe('');
  });

  it('search filters the full list, so deleting characters brings matches back', () => {
    component.searchText = 'pri';
    component.searchUsers();
    expect(component.users.map(u => u.id)).toEqual([1]);

    component.searchText = 'pr';
    component.searchUsers();
    expect(component.users.map(u => u.id)).toEqual([1, 3]);

    component.searchText = '';
    component.searchUsers();
    expect(component.users.length).toBe(3);
    expect(userRequests().length).toBe(0);
  });

  it('keeps the search and sorting when the list reloads', () => {
    component.searchText = 'pr';
    component.searchUsers();
    component.sort('fullName');
    component.loadUsers();
    userRequests()[0].flush({ data: USERS });
    expect(component.users.map(u => u.fullName)).toEqual(['Pratik Jain', 'Priya Sharma']);
  });

  it('sends the Active/Inactive status when saving an edit', () => {
    component.editUser(USERS[0]);
    component.userForm.patchValue({ isActive: false });
    component.saveUser();
    const req = backend.expectOne(r => r.method === 'PUT' && r.url === `${API}/User/1`);
    expect(req.request.body.isActive).toBe(false);
    expect(req.request.body.newPassword).toBeUndefined();
    req.flush({});
  });

  it('status toggle does not send display-only fields', () => {
    component.changeStatus({ ...USERS[0], isLocked: true });
    const req: TestRequest = backend.expectOne(r => r.method === 'PUT');
    expect(req.request.body.isActive).toBe(false);
    expect('isLocked' in req.request.body).toBe(false);
    req.flush({});
  });

  it('offers only the departments and branches linked to the chosen college / department', () => {
    expect(component.departmentsFor('TIT').map(d => d.name)).toEqual(['CSE', 'ECE']);
    expect(component.departmentsFor(null).length).toBe(3);
    expect(component.branchesFor('CSE').map(b => b.name)).toEqual(['AI']);
    // Nothing linked: fall back to everything rather than an empty list.
    expect(component.departmentsFor('Unknown College').length).toBe(3);
  });

  it('renders a live region for screen-reader announcements', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-live="polite"].sr-only')).not.toBeNull();
  });

  it('never logs the password', () => {
    const log = vi.spyOn(console, 'log');
    component.openAddModal();
    component.userForm.patchValue({
      fullName: 'New Person', email: 'new@x.edu', password: 'Secret#123', roleName: 'Student'
    });
    component.saveUser();
    backend.expectOne(r => r.method === 'POST' && r.url === `${API}/User`).flush({});
    expect(log).not.toHaveBeenCalled();
  });
});
