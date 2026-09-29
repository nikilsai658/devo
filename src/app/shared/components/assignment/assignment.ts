import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

import { Auth } from '../../../core/auth/auth';
import { AssignmentService } from '../../../features/services/assignment/assignment-service';
import { Feedback } from '../../feedback/feedback';

@Component({
  selector: 'app-assignment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './assignment.html',
  styleUrls: ['./assignment.css']
})
export class AssignmentComponent implements OnInit {

  feedback = new Feedback();

  assignments: any[] = [];

  assignmentForm!: FormGroup;

  loading = false;

  isEditMode = false;

  selectedId = 0;

  showModal = false;

  constructor(
    private fb: FormBuilder,
    private api: AssignmentService,
    private cookie: CookieService,
    private router: Router,
    public auth: Auth,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {

    this.assignmentForm = this.fb.group({

      title: ['', Validators.required],

      description: [''],

      questionId: ['', Validators.required],

      platform: ['', Validators.required],

      difficulty: ['', Validators.required],

      score: [1, Validators.required],

      languageSupport: [''],

      iframeUrl: [''],

      timeLimit: [1, Validators.required],

      memoryLimit: [1, Validators.required],

      isActive: [true],

      contestId: [null],

      challengeUrl: [''],

      testCases: this.fb.array([this.createTestCase(true)])

    });

    if (!isPlatformBrowser(this.platformId)) return;

    const token = this.cookie.get('token');

    if (!token) {
      this.router.navigate(['/auth/login']);
      return;
    }

    if (this.auth.hasPermission('VIEW_ASSIGNMENT')) {
      this.loadAssignments();
    }

  }

  //=========================
  // TEST CASES
  //=========================

  createTestCase(isSample: boolean = false): FormGroup {

    return this.fb.group({
      input: ['', Validators.required],
      expectedOutput: ['', Validators.required],
      isSample: [isSample]
    });

  }

  get testCases(): FormArray {
    return this.assignmentForm.get('testCases') as FormArray;
  }

  addTestCase(): void {
    this.testCases.push(this.createTestCase());
  }

  removeTestCase(index: number): void {

    if (this.testCases.length === 1) {
      this.feedback.fail('At least one test case is required');
      return;
    }

    this.testCases.removeAt(index);

  }

  //=========================
  // MODAL CONTROLS
  //=========================

  openAddModal(): void {

    if (!this.auth.hasPermission('CREATE_ASSIGNMENT')) {
      this.feedback.fail('You do not have permission to perform this action.');
      return;
    }

    this.resetForm();

    this.showModal = true;

  }

  closeModal(): void {

    this.resetForm();

  }

  //=========================
  // GET
  //=========================

  loadAssignments(): void {

    this.loading = true;

    this.api.getAssign().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.loading = false;

        this.assignments =
          res.data ??
          res.result ??
          res.items ??
          res;

        if (!Array.isArray(this.assignments)) {
          this.assignments = [];
        }

        this.cd.detectChanges();

      },

      error: (err) => {
        this.cd.markForCheck();


        this.loading = false;

        console.log(err);

      }

    });

  }

  //=========================
  // CREATE
  //=========================

  createAssignment(): void {

    if (!this.auth.hasPermission('CREATE_ASSIGNMENT')) {
      this.feedback.fail('You do not have permission to perform this action.');
      return;
    }

    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    this.api.createAssign(this.assignmentForm.value)
      .subscribe({

        next: () => {
          this.cd.markForCheck();


          this.feedback.ok('Assignment added successfully');

          this.resetForm();

          this.loadAssignments();

        },

        error: (err) => { this.cd.markForCheck(); return this.feedback.fail(err); }

      });

  }

  //=========================
  // EDIT
  //=========================

  editAssignment(item: any): void {

    if (!this.auth.hasPermission('UPDATE_ASSIGNMENT')) {
      this.feedback.fail('You do not have permission to perform this action.');
      return;
    }

    this.isEditMode = true;

    this.selectedId = item.id;

    this.assignmentForm.patchValue({

      title: item.title,

      description: item.description,

      questionId: item.questionId,

      platform: item.platform ?? '',

      difficulty: item.difficulty,

      score: item.score,

      languageSupport: item.languageSupport,

      iframeUrl: item.iframeUrl,

      timeLimit: item.timeLimit,

      memoryLimit: item.memoryLimit,

      isActive: item.isActive,

      contestId: item.contestId ?? null,

      challengeUrl: item.challengeUrl ?? ''

    });

    this.testCases.clear();

    const cases = Array.isArray(item.testCases) && item.testCases.length
      ? item.testCases
      : [{ input: '', expectedOutput: '', isSample: true }];

    cases.forEach((tc: any) => {
      this.testCases.push(this.fb.group({
        input: [tc.input ?? '', Validators.required],
        expectedOutput: [tc.expectedOutput ?? '', Validators.required],
        isSample: [tc.isSample ?? false]
      }));
    });

    this.showModal = true;

  }

  //=========================
  // UPDATE
  //=========================

  updateAssignment(): void {

    if (!this.auth.hasPermission('UPDATE_ASSIGNMENT')) {
      this.feedback.fail('You do not have permission to perform this action.');
      return;
    }

    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    this.api.updateAssign(
      this.selectedId,
      this.assignmentForm.value
    ).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.feedback.ok('Assignment updated successfully');

        this.resetForm();

        this.loadAssignments();

      },

      error: (err) => { this.cd.markForCheck(); return this.feedback.fail(err); }

    });

  }

  //=========================
  // DELETE
  //=========================

  deleteAssignment(id: number): void {

    if (!this.auth.hasPermission('DELETE_ASSIGNMENT')) {
      this.feedback.fail('You do not have permission to perform this action.');
      return;
    }

    if (!confirm('Delete Assignment?')) return;

    this.api.deleteAssign(id)
      .subscribe({

        next: () => {
          this.cd.markForCheck();


          this.feedback.ok('Assignment deleted successfully');

          this.loadAssignments();

        },

        error: (err) => { this.cd.markForCheck(); return this.feedback.fail(err); }

      });

  }

  //=========================
  // RESET
  //=========================

  resetForm(): void {

  this.isEditMode = false;
  this.selectedId = 0;
  this.showModal = false;

  this.assignmentForm.reset({
    title: '',
    description: '',
    questionId: '',
    platform: '',
    difficulty: '',
    score: 1,
    languageSupport: '',
    iframeUrl: '',
    timeLimit: 1,
    memoryLimit: 1,
    isActive: true,
    contestId: null,
    challengeUrl: ''
  });

  this.testCases.clear();
  this.testCases.push(this.createTestCase(true));

}

}