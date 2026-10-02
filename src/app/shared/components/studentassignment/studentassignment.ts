import { ChangeDetectorRef, Component, OnInit,ChangeDetectionStrategy , inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';

import { Studentassignment } from '../../../features/services/studentassignment/studentassignment';
import { Auth } from '../../../core/auth/auth';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, FieldError } from '../../validation';

import { ConfirmService } from '../confirm-dailog/confirm';
@Component({
  selector: 'app-student-assignment',
  standalone: true,
  imports: [FieldError, CommonModule, ReactiveFormsModule],
  templateUrl: './studentassignment.html',
  styleUrls: ['./studentassignment.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentAssignment implements OnInit {

  private confirmDialog = inject(ConfirmService);


  feedback = new Feedback();

  assignmentForm!: FormGroup;
  assignments: any[] = [];

  editMode = false;
  selectedId!: number;

  constructor(
    private fb: FormBuilder,
    private studentService: Studentassignment,
    private cdr: ChangeDetectorRef,
    public auth:Auth
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.getAssignments();
  }

  initializeForm(): void {
    this.assignmentForm = this.fb.group({
      id: [0],

      studentEmail: ['', [AppValidators.required, AppValidators.email, AppValidators.maxLength(100)]],
      courseName: ['', [AppValidators.required]],
      assignmentTitle: ['', [AppValidators.required]],
      status: ['', [AppValidators.required]],

      startedOn: [null],
      completedOn: [null],

      score: [0, [AppValidators.required, AppValidators.integer, AppValidators.min(0), AppValidators.max(1000)]],
      attempts: [1, [AppValidators.required, AppValidators.integer, AppValidators.min(1), AppValidators.max(1000)]],

      bestSubmissionId: [''],
      lastSubmissionId: [''],
      timeTaken: [0, [AppValidators.required, AppValidators.integer, AppValidators.min(0), AppValidators.max(100000)]],

      isPassed: [false]
    });
  }

  // Get All
  getAssignments(): void {
    this.studentService.getstudentassignment().subscribe({
      next: (res: any) => {
        this.assignments = res.data || res;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  // Edit
  edit(id: number): void {

    this.studentService.getstudentassignmentById(id).subscribe({
      next: (res: any) => {

        const data = res.data || res;

        this.assignmentForm.patchValue(data);
        this.selectedId = id;
        this.editMode = true;
        this.cdr.markForCheck();
      },
      error: (err) => console.error(err)
    });

  }

update(): void {

  if (this.assignmentForm.invalid) {
    this.assignmentForm.markAllAsTouched();
    return;
  }

  const formValue = this.assignmentForm.value;

  const payload = {
    id: formValue.id,
    studentEmail: formValue.studentEmail,
    courseName: formValue.courseName,
    assignmentTitle: formValue.assignmentTitle,
    status: formValue.status,
    startedOn: formValue.startedOn,
    completedOn: formValue.completedOn,
    score: formValue.score,
    attempts: formValue.attempts,
    bestSubmissionId: formValue.bestSubmissionId
      ? String(formValue.bestSubmissionId)
      : "",
    lastSubmissionId: formValue.lastSubmissionId
      ? String(formValue.lastSubmissionId)
      : "",
    timeTaken: formValue.timeTaken,
    isPassed: formValue.isPassed
  };

  console.log(payload);

  this.studentService
    .updatestudentassignment(this.selectedId, payload)
    .subscribe({
      next: (res) => {
        console.log(res);
        this.getAssignments();
        this.cancel();
        this.feedback.ok('Record updated successfully');
      },
      error: (err) => {
        this.feedback.fail(err, 'Failed to update record');
      }
    });
}
  // Delete
  async delete(id: number): Promise<void> {

    if (!(await this.confirmDialog.ask('Are you sure you want to delete this assignment?'))) {
      return;
    }

    this.studentService
      .deletestudentassignmnet(id)
      .subscribe({
        next: (res: any) => {
          this.feedback.ok('Record deleted successfully', res);
          this.getAssignments();

        },
        error: (err) => this.feedback.fail(err, 'Failed to delete record')
      });

  }

  // Save (Create or Update)
  save(): void {
    if (this.editMode) {
      this.update();
    } else{

    }
  }

  // Reset Form
  cancel(): void {

    this.editMode = false;
    this.selectedId = 0;

    this.assignmentForm.reset();

    this.assignmentForm.patchValue({
      id: 0,
      score: 0,
      attempts: 1,
      timeTaken: 0,
      isPassed: false
    });
  }

}