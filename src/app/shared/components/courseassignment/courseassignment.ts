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
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';

import { Router, RouterLink } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

import { Auth } from '../../../core/auth/auth';
import { CourseAssignmnetService } from '../../../features/services/courseassignment/course-assignmnet-service';
import { CourseService } from '../../../features/services/course/course-service';
import { AssignmentService } from '../../../features/services/assignment/assignment-service';
import { Feedback } from '../../feedback/feedback';

@Component({
  selector: 'app-courseassignmentmap',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './courseassignment.html',
  styleUrls: ['./courseassignment.css']
})
export class CourseAssignmentMapComponent implements OnInit {

  feedback = new Feedback();

  courseAssignmentForm!: FormGroup;

  mappings: any[] = [];
  filteredMappings: any[] = [];

  courses: any[] = [];

  assignments: any[] = [];

  loading = false;

  submitted = false;
  editMode = false;
  showModal = false;

  selectedId: number | null = null;

  searchText = '';

  constructor(
    private fb: FormBuilder,
    private api: CourseAssignmnetService,
    private courseService: CourseService,
    private assignmentService: AssignmentService,
    private cookie: CookieService,
    private router: Router,
    public auth: Auth,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {

    this.buildForm();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = this.cookie.get('token');

    if (!token) {

      this.router.navigate(['/auth/login']);

      return;

    }

    this.loadCourses();

    this.loadAssignments();

    this.loadMappings();

  }

  buildForm(): void {

    this.courseAssignmentForm = this.fb.group({

      courseName: ['', Validators.required],

      assignmentTitle: ['', Validators.required],

      sequenceNo: [1, Validators.required],

      isMandatory: [true],

      isActive: [true]

    });

  }

  //==========================
  // MODAL
  //==========================

  openAddModal(): void {
    this.resetForm();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  //============================
  // Load Courses
  //============================

  loadCourses() {

    this.courseService.getCourses().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.courses = res.data || res.result || res || [];

        this.cd.detectChanges();

      },

      error: err => { this.cd.markForCheck(); return console.log(err); }

    });

  }

  //============================
  // Load Assignments
  //============================

  loadAssignments() {

    this.assignmentService.getAssign().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.assignments = res.data || res.result || res || [];

        this.cd.detectChanges();

      },

      error: err => { this.cd.markForCheck(); return console.log(err); }

    });

  }

  //============================
  // Load Mapping
  //============================

  loadMappings() {

    this.loading = true;

    this.api.getcourseassignment().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.loading = false;

        this.mappings = res.data || res.result || res || [];

        if (!Array.isArray(this.mappings)) {

          this.mappings = [];

        }

        this.filteredMappings = [...this.mappings];

        this.cd.detectChanges();

      },

      error: err => {
        this.cd.markForCheck();


        this.loading = false;

        console.log(err);

      }

    });

  }

  //==========================
  // SAVE
  //==========================

  save(): void {

    this.submitted = true;

    if (this.editMode) {

      if (!this.auth.hasPermission('UPDATE_COURSE_ASSIGNMENT_MAP')) return;

    } else {

      if (!this.auth.hasPermission('CREATE_COURSE_ASSIGNMENT_MAP')) return;

    }

    if (this.courseAssignmentForm.invalid) {

      this.courseAssignmentForm.markAllAsTouched();

      return;

    }

    const payload = this.courseAssignmentForm.value;

    if (this.editMode) {

      if (this.selectedId == null) return;

      this.api.updatecourseassignment(this.selectedId, payload).subscribe({

        next: () => {
          this.cd.markForCheck();


          this.loadMappings();

          this.closeModal();
          this.feedback.ok('Mapping updated successfully');

        },

        error: err => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

      });

    } else {

      this.api.createcourseassignment(payload).subscribe({

        next: () => {
          this.cd.markForCheck();


          this.loadMappings();

          this.closeModal();
          this.feedback.ok('Mapping added successfully');

        },

        error: err => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

      });

    }

  }

  //============================
  // EDIT
  //============================

  edit(item: any) {

    if (!this.auth.hasPermission('UPDATE_COURSE_ASSIGNMENT_MAP')) return;

    this.editMode = true;

    this.selectedId = item.id;

    this.courseAssignmentForm.patchValue({

      courseName: item.courseName,

      assignmentTitle: item.assignmentTitle,

      sequenceNo: item.sequenceNo,

      isMandatory: item.isMandatory,

      isActive: item.isActive

    });

    this.showModal = true;

  }

  //============================
  // DELETE
  //============================

  delete(id: number) {

    if (!this.auth.hasPermission('DELETE_COURSE_ASSIGNMENT_MAP')) return;

    if (!confirm('Delete this mapping?')) return;

    this.api.deletecourseassignment(id).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.loadMappings();
        this.feedback.ok('Mapping deleted successfully');

      },

      error: err => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  //============================
  // RESET
  //============================

  resetForm() {

    this.submitted = false;

    this.editMode = false;

    this.selectedId = null;

    this.courseAssignmentForm.reset({

      courseName: '',

      assignmentTitle: '',

      sequenceNo: 1,

      isMandatory: true,

      isActive: true

    });

  }

  //==========================
  // SEARCH
  //==========================

  search(): void {

    const value = this.searchText.toLowerCase();

    this.filteredMappings = this.mappings.filter(x =>

      x.courseName.toLowerCase().includes(value) ||

      x.assignmentTitle.toLowerCase().includes(value)

    );

  }

}
