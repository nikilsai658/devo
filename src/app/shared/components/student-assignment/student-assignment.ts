import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, Inject, OnDestroy, OnInit, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Student } from '../../../features/services/student/student';
import { ReactiveFormsModule } from '@angular/forms';
import { CodeEditorComponent, CodeSubmission } from '../code-editor/code-editor';
import { Location } from '@angular/common';
import { AssignmentLockService, AssignmentViolation } from '../../../features/services/assignment-lock-service/assignment-lock-service';
import { Subscription } from 'rxjs';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb/breadcrumb';
import { extractErrorMessage } from '../../feedback/feedback';
import { readStorage, removeStorage, writeStorage } from '../../../core/storage';
@Component({
  selector: 'app-student-assignment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:true,
  imports: [CommonModule, ReactiveFormsModule, CodeEditorComponent, Breadcrumb],
  templateUrl: './student-assignment.html',
  styleUrl: './student-assignment.css',
})
export class StudentAssignment implements OnInit, OnDestroy{
  assignmentId!: number;
  assignmentIds: number[] = [];
  assignment: any = null;

  // Where the student came from, carried through router state for the breadcrumb
  private trail = { domainId: null as number | null, domainName: '', courseId: null as number | null, courseName: '' };

  get breadcrumb(): BreadcrumbItem[] {
    const t = this.trail;
    return [
      { label: 'My Domains', link: '/main/student-domain' },
      { label: t.domainName || 'My Courses', link: '/main/student-courses',
        state: { domainId: t.domainId, domainName: t.domainName } },
      { label: t.courseName || 'Assignments', link: '/main/student-assignments',
        state: { domainId: t.domainId, domainName: t.domainName, courseId: t.courseId, courseName: t.courseName } },
      { label: this.assignment?.title || 'Assignment' }
    ];
  }
  
  get canGoPrevious(): boolean {
    const index = this.assignmentIds.indexOf(this.assignmentId);
    return index > 0;
  }

  get canGoNext(): boolean {
    const index = this.assignmentIds.indexOf(this.assignmentId);
    return index > -1 && index < this.assignmentIds.length - 1;
  }

  get sampleTestCases(): any[] {
    return (this.assignment?.testCases ?? []).filter((tc: any) => tc.isSample);
  }

  get tabSwitchCount(): number {
    return this.lockService.tabSwitchCount;
  }

  get fullscreenExitCount(): number {
    return this.lockService.fullscreenExitCount;
  }

  loadError = '';

  isRunning = false;
  isSubmitting = false;

  runResult: any = null;
  submitResult: any = null;

  runError: string | null = null;
  submitError: string | null = null;

  // Proctoring
  showFullscreenWarning = false;
  lastViolation: AssignmentViolation | null = null;
  private violationSubscription?: Subscription;

  constructor(private router:Router,private api:Student,private cd:ChangeDetectorRef,private location:Location,private lockService:AssignmentLockService, @Inject(PLATFORM_ID) private platformId: Object){}
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromState(history.state);
      this.lockService.startLock();

      this.violationSubscription = this.lockService.violations$.subscribe(
        (violation) => { this.cd.markForCheck(); return this.onViolation(violation); }
      );
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.violationSubscription?.unsubscribe();

      this.lockService.stopLock();

      removeStorage('activeAssignmentId', 'session');

      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {
  this.cd.markForCheck();
});
      }
    }
  }

  private onViolation(violation: AssignmentViolation): void {

    this.lastViolation = violation;

    if (violation.type === 'fullscreen-exit') {
      // The auto re-request in the lock service may or may not have been
      // honored by the browser, so keep the banner up until the student
      // confirms via a real click on "Resume Fullscreen".
      this.showFullscreenWarning = !document.fullscreenElement;
    }

    this.cd.markForCheck();
  }

  resumeFullscreen(): void {
    this.lockService.requestFullscreen();
    this.showFullscreenWarning = false;
  }

  // The id comes with the navigation; when that state is missing it is recovered
  // from the marker the course page set when the student pressed Start.
  private loadFromState(state: any): void {
    const fromSession = Number(readStorage('activeAssignmentId', 'session'));

    this.assignmentId = Number(state?.Id) || fromSession;

    if (!this.assignmentId) {
      this.router.navigate(['/main/student-domain']);
      return;
    }

    writeStorage('activeAssignmentId', String(this.assignmentId), 'session');

    if (state?.assignmentIds) {
      this.assignmentIds = state.assignmentIds;
    }
    if (state?.domainId != null) {
      this.trail = {
        domainId: state.domainId,
        domainName: state.domainName ?? '',
        courseId: state.courseId ?? null,
        courseName: state.courseName ?? ''
      };
    }
    this.loadAssignment();
  }
  loadAssignment():void{
    this.loadError = '';
    this.api.getstudentassignmentId(this.assignmentId).subscribe({
         next:(res:any)=>{
        this.cd.markForCheck();

        this.assignment = res.data?.[0] ?? null;
        if (!this.assignment) {
          this.loadError = 'This assignment could not be found.';
        }
    },error:(err:any)=>{
        this.assignment = null;
        this.loadError = extractErrorMessage(err, 'The assignment could not be loaded.');
        this.cd.markForCheck();
    }
    })
  }
  goBack(): void {
  this.location.back();
}

  onRunCode(submission: CodeSubmission): void {

    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.runResult = null;
    this.submitResult = null;
    this.runError = null;

    this.api
      .runCode(
        submission.sourceCode,
        submission.languageId,
        submission.stdin,
      )
      .subscribe({

        next: (res: any) => {
          this.cd.markForCheck();


          this.runResult = res?.data ?? null;

          this.isRunning = false;

        },

        error: (err: any) => {
          this.cd.markForCheck();


          this.runError = err?.error?.message || 'Failed to run code.';

          this.isRunning = false;

        }

      });
  }

  onSubmitCode(submission: CodeSubmission): void {

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.submitResult = null;
    this.runResult = null;
    this.submitError = null;

    this.api
      .submitCode(
        this.assignmentId,
        submission.sourceCode,
        submission.languageId,
        submission.stdin,
        // Proctoring events of this attempt, so faculty can see them with the submission.
        {
          tabSwitchCount: this.lockService.tabSwitchCount,
          fullscreenExitCount: this.lockService.fullscreenExitCount
        }
      )
      .subscribe({

        next: (res: any) => {
          this.cd.markForCheck();


          this.submitResult = res?.data ?? null;

          if (this.submitResult && this.assignment) {
            this.assignment.score = this.submitResult.score;
          }

          this.isSubmitting = false;

        },

        error: (err: any) => {
          this.cd.markForCheck();


          this.submitError = err?.error?.message || 'Failed to submit code.';

          this.isSubmitting = false;

        }

      });
  }
  next(){
    if (!this.canGoNext) {
      return;
    }
    const index = this.assignmentIds.indexOf(this.assignmentId);
    this.goToAssignment(this.assignmentIds[index + 1]);
  }
  previous(){
    if (!this.canGoPrevious) {
      return;
    }
    const index = this.assignmentIds.indexOf(this.assignmentId);
    this.goToAssignment(this.assignmentIds[index - 1]);
  }

  private goToAssignment(id: number): void {
    const state = { Id: id, assignmentIds: this.assignmentIds, ...this.trail };
    // Router.navigate() ignores navigation to the same URL, so the same-route
    // "next/previous" case is driven straight off state instead of a route/query param.
    history.pushState(state, '', this.router.url);
    this.loadFromState(state);
  }
}