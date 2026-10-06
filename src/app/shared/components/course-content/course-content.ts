import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { Auth } from '../../../core/auth/auth';
import { CourseService } from '../../../features/services/course/course-service';
import { CourseLearningSectionService } from '../../../features/services/courselearningsection/courselearningsection-service';
import { LearningSectionLessonService } from '../../../features/services/learningsectionlesson/learningsectionlesson-service';
import { LearningSectionService } from '../../../features/services/learningsection/learningsection-service';
import { LessonMaterialService } from '../../../features/services/lessonmaterial/lessonmaterial-service';
import { LessonService } from '../../../features/services/lesson/lesson-service';
import { MaterialService } from '../../../features/services/material/material-service';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, FieldError } from '../../validation';
import { ConfirmService } from '../confirm-dailog/confirm';
import {
  ALLOWED_EXTENSIONS, MATERIAL_TYPES, MAX_UPLOAD_MB, formatSize, guessMaterialType, saveBlobResponse, validateUpload
} from '../../material-utils';

interface TreeMaterial { link: any; material: any; }
interface TreeLesson { link: any; lesson: any; materials: TreeMaterial[]; }
interface TreeSection { link: any; section: any; lessons: TreeLesson[]; }

type Picker = 'section' | 'lesson' | 'material';

@Component({
  selector: 'app-course-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FieldError, CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './course-content.html',
  styleUrl: './course-content.css',
})
export class CourseContent implements OnInit {

  private confirmDialog = inject(ConfirmService);

  readonly types = MATERIAL_TYPES;
  readonly accept = ALLOWED_EXTENSIONS.join(',');
  readonly maxMb = MAX_UPLOAD_MB;
  readonly formatSize = formatSize;

  // Master lists and the three links that tie them together.
  courses: any[] = [];
  sections: any[] = [];
  lessons: any[] = [];
  materials: any[] = [];
  sectionLinks: any[] = [];
  lessonLinks: any[] = [];
  materialLinks: any[] = [];

  courseName = '';
  tree: TreeSection[] = [];
  expanded = new Set<string>();
  loading = false;

  // Dialogs
  showSectionModal = false;
  showLessonModal = false;
  showUploadModal = false;
  showPicker = false;
  isEditMode = false;
  editingId = 0;
  saving = false;

  // Where a new item goes: the section a lesson is added to, the lesson a material is added to.
  targetSection: any = null;
  targetLesson: any = null;

  pickerKind: Picker = 'section';
  pickerSearch = '';

  sectionForm!: FormGroup;
  lessonForm!: FormGroup;
  uploadForm!: FormGroup;
  file: File | null = null;
  fileError = '';

  // Set when a file was uploaded but could not be added to the lesson: the next try only adds it.
  uploadedMaterialId: number | null = null;

  feedback = new Feedback();

  constructor(
    private courseApi: CourseService,
    private sectionApi: LearningSectionService,
    private lessonApi: LessonService,
    private materialApi: MaterialService,
    private courseSectionApi: CourseLearningSectionService,
    private sectionLessonApi: LearningSectionLessonService,
    private lessonMaterialApi: LessonMaterialService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.sectionForm = this.fb.group({
      name: ['', [AppValidators.required, AppValidators.maxLength(200)]],
      description: ['', [AppValidators.maxLength(1000)]],
      durationHours: [0, [AppValidators.min(0), AppValidators.max(1000)]],
      orderNo: [1, [AppValidators.min(0), AppValidators.max(10000)]]
    });

    this.lessonForm = this.fb.group({
      name: ['', [AppValidators.required, AppValidators.maxLength(200)]],
      description: ['', [AppValidators.maxLength(1000)]],
      durationMinutes: [0, [AppValidators.min(0), AppValidators.max(10000)]],
      orderNo: [1, [AppValidators.min(0), AppValidators.max(10000)]]
    });

    this.uploadForm = this.fb.group({
      title: ['', [AppValidators.required, AppValidators.maxLength(200)]],
      description: ['', [AppValidators.maxLength(1000)]],
      materialType: ['', [AppValidators.required]],
      downloadAllowed: [true],
      previewAllowed: [true]
    });

    if (isPlatformBrowser(this.platformId) && this.can('VIEW_COURSE_LEARNING_SECTION_MAP')) {
      this.loadAll();
    }
  }

  can(permission: string): boolean {
    return this.auth.hasPermission(permission);
  }

  //=====================================
  // Loading
  //=====================================

  // A call the user has no permission for (or that fails) yields an empty list instead of blocking the page.
  private safe(permission: string, call: () => Observable<any>): Observable<any> {
    if (!this.can(permission)) {
      return of({ data: [] });
    }
    return call().pipe(catchError(err => {
      this.feedback.fail(err, 'Some content could not be loaded');
      return of({ data: [] });
    }));
  }

  loadAll(): void {
    this.loading = true;
    const list = (res: any) => (Array.isArray(res?.data) ? res.data : []);

    forkJoin({
      courses: this.safe('VIEW_COURSE', () => this.courseApi.getCourses()),
      sections: this.safe('VIEW_LEARNING_SECTION', () => this.sectionApi.getSections()),
      lessons: this.safe('VIEW_LESSON', () => this.lessonApi.getLessons()),
      materials: this.safe('VIEW_MATERIAL', () => this.materialApi.getMaterials()),
      sectionLinks: this.safe('VIEW_COURSE_LEARNING_SECTION_MAP', () => this.courseSectionApi.getLinks()),
      lessonLinks: this.safe('VIEW_LEARNING_SECTION_LESSON_MAP', () => this.sectionLessonApi.getLinks()),
      materialLinks: this.safe('VIEW_LESSON_MATERIAL_MAP', () => this.lessonMaterialApi.getLinks())
    }).subscribe(r => {
      this.courses = list(r.courses);
      this.sections = list(r.sections);
      this.lessons = list(r.lessons);
      this.materials = list(r.materials);
      this.sectionLinks = list(r.sectionLinks);
      this.lessonLinks = list(r.lessonLinks);
      this.materialLinks = list(r.materialLinks);
      this.loading = false;
      this.rebuildTree();
    });
  }

  selectCourse(name: string): void {
    this.courseName = name;
    this.expanded.clear();
    this.rebuildTree();
  }

  // Joins the three link lists with the master lists. The section and lesson links are keyed by name.
  rebuildTree(): void {
    const byOrder = (a: any, b: any) => (a.orderNo ?? 0) - (b.orderNo ?? 0) || `${a.name}`.localeCompare(`${b.name}`);

    this.tree = this.sectionLinks
      .filter(l => l.courseName === this.courseName)
      .map(link => {
        const section = this.sections.find(s => s.name === link.learningSectionName);
        return section ? { link, section } : null;
      })
      .filter((x): x is { link: any; section: any } => x !== null)
      .sort((a, b) => byOrder(a.section, b.section))
      .map(({ link, section }) => ({
        link,
        section,
        lessons: this.lessonLinks
          .filter(l => l.learningSectionName === section.name)
          .map(ll => {
            const lesson = this.lessons.find(x => x.name === ll.lessonName);
            return lesson ? { link: ll, lesson } : null;
          })
          .filter((x): x is { link: any; lesson: any } => x !== null)
          .sort((a, b) => byOrder(a.lesson, b.lesson))
          .map(({ link: ll, lesson }) => ({
            link: ll,
            lesson,
            materials: this.materialLinks
              .filter(m => m.lessonId === lesson.id)
              .map(ml => ({ link: ml, material: this.materials.find(x => x.id === ml.learningMaterialId) }))
              .filter((m): m is TreeMaterial => !!m.material)
          }))
      }));

    this.cd.markForCheck();
  }

  toggle(key: string): void {
    if (this.expanded.has(key)) {
      this.expanded.delete(key);
    } else {
      this.expanded.add(key);
    }
  }

  get lessonCount(): number {
    return this.tree.reduce((n, s) => n + s.lessons.length, 0);
  }

  get materialCount(): number {
    return this.tree.reduce((n, s) => n + s.lessons.reduce((m, l) => m + l.materials.length, 0), 0);
  }

  //=====================================
  // Picker: add something that already exists
  //=====================================

  openPicker(kind: Picker, section?: any, lesson?: any): void {
    this.pickerKind = kind;
    this.targetSection = section ?? null;
    this.targetLesson = lesson ?? null;
    this.pickerSearch = '';
    this.showPicker = true;
  }

  closePicker(): void {
    this.showPicker = false;
  }

  // Only things not already in the place they would be added to.
  get pickerItems(): any[] {
    const text = this.pickerSearch.trim().toLowerCase();
    let items: any[] = [];

    if (this.pickerKind === 'section') {
      const have = new Set(this.tree.map(t => t.section.id));
      items = this.sections.filter(s => !have.has(s.id));
    } else if (this.pickerKind === 'lesson') {
      const have = new Set(
        (this.tree.find(t => t.section.id === this.targetSection?.id)?.lessons ?? []).map(l => l.lesson.id));
      items = this.lessons.filter(l => !have.has(l.id));
    } else {
      const have = new Set(
        this.tree.flatMap(t => t.lessons).find(l => l.lesson.id === this.targetLesson?.id)?.materials
          .map(m => m.material.id) ?? []);
      items = this.materials.filter(m => !have.has(m.id));
    }

    return items.filter(i => !text || `${i.name ?? i.title}`.toLowerCase().includes(text));
  }

  pick(item: any): void {
    let request: Observable<any>;

    if (this.pickerKind === 'section') {
      request = this.courseSectionApi.link(this.courseName, item.name);
    } else if (this.pickerKind === 'lesson') {
      request = this.sectionLessonApi.link(this.targetSection.name, item.name);
    } else {
      request = this.lessonMaterialApi.link(this.targetLesson.id, item.id);
    }

    request.subscribe({
      next: (res: any) => {
        this.closePicker();
        this.feedback.ok('Added', res);
        this.refreshLinks();
      },
      error: (err) => {
        this.feedback.fail(err, 'Failed to add it');
        this.cd.markForCheck();
      }
    });
  }

  // Reloads only the three link lists (and the masters, which may have changed) after an edit.
  private refreshLinks(): void {
    this.loadAll();
  }

  //=====================================
  // Sections
  //=====================================

  openSectionModal(section?: any): void {
    this.isEditMode = !!section;
    this.editingId = section?.id ?? 0;
    this.sectionForm.reset(section
      ? { name: section.name, description: section.description ?? '', durationHours: section.durationHours, orderNo: section.orderNo }
      : { name: '', description: '', durationHours: 0, orderNo: this.tree.length + 1 });
    this.showSectionModal = true;
  }

  closeSectionModal(): void {
    this.showSectionModal = false;
    this.isEditMode = false;
    this.editingId = 0;
  }

  saveSection(): void {
    if (this.sectionForm.invalid) {
      this.sectionForm.markAllAsTouched();
      return;
    }

    const value = this.sectionForm.value;
    this.saving = true;

    if (this.isEditMode) {
      const current = this.sections.find(s => s.id === this.editingId);
      this.sectionApi.updateSection(this.editingId, { ...value, isActive: current?.isActive ?? true }).subscribe({
        next: (res: any) => this.afterSave(res, 'Section updated', () => this.closeSectionModal()),
        error: (err) => this.afterFail(err, 'Failed to update the section')
      });
      return;
    }

    // A new section is created and, in the same step, added to the course being edited.
    this.sectionApi.createSection(value).subscribe({
      next: () => {
        this.courseSectionApi.link(this.courseName, value.name.trim()).subscribe({
          next: (res: any) => this.afterSave(res, 'Section added to the course', () => this.closeSectionModal()),
          error: (err) => this.afterFail(err, 'The section was created but could not be added to the course')
        });
      },
      error: (err) => this.afterFail(err, 'Failed to create the section')
    });
  }

  async deleteSectionEverywhere(): Promise<void> {
    const section = this.sections.find(s => s.id === this.editingId);
    if (!section || !(await this.confirmDialog.ask(
      `Delete the section "${section.name}" from every course that uses it?`))) {
      return;
    }
    this.sectionApi.deleteSection(section.id).subscribe({
      next: (res: any) => this.afterSave(res, 'Section deleted', () => this.closeSectionModal()),
      error: (err) => this.afterFail(err, 'Failed to delete the section')
    });
  }

  async removeSection(t: TreeSection): Promise<void> {
    if (!(await this.confirmDialog.ask(
      `Remove "${t.section.name}" from this course? The section itself is kept and can be added again.`,
      { title: 'Remove section', confirmText: 'Remove' }))) {
      return;
    }
    this.courseSectionApi.unlink(t.link.id).subscribe({
      next: (res: any) => this.afterSave(res, 'Section removed from the course'),
      error: (err) => this.afterFail(err, 'Failed to remove the section')
    });
  }

  //=====================================
  // Lessons
  //=====================================

  openLessonModal(section: any, lesson?: any): void {
    this.targetSection = section;
    this.isEditMode = !!lesson;
    this.editingId = lesson?.id ?? 0;
    const count = this.tree.find(t => t.section.id === section.id)?.lessons.length ?? 0;
    this.lessonForm.reset(lesson
      ? { name: lesson.name, description: lesson.description ?? '', durationMinutes: lesson.durationMinutes, orderNo: lesson.orderNo }
      : { name: '', description: '', durationMinutes: 0, orderNo: count + 1 });
    this.showLessonModal = true;
  }

  closeLessonModal(): void {
    this.showLessonModal = false;
    this.isEditMode = false;
    this.editingId = 0;
  }

  saveLesson(): void {
    if (this.lessonForm.invalid) {
      this.lessonForm.markAllAsTouched();
      return;
    }

    const value = this.lessonForm.value;
    this.saving = true;

    if (this.isEditMode) {
      const current = this.lessons.find(l => l.id === this.editingId);
      this.lessonApi.updateLesson(this.editingId, { ...value, isActive: current?.isActive ?? true }).subscribe({
        next: (res: any) => this.afterSave(res, 'Lesson updated', () => this.closeLessonModal()),
        error: (err) => this.afterFail(err, 'Failed to update the lesson')
      });
      return;
    }

    this.lessonApi.createLesson(value).subscribe({
      next: () => {
        this.sectionLessonApi.link(this.targetSection.name, value.name.trim()).subscribe({
          next: (res: any) => this.afterSave(res, 'Lesson added to the section', () => this.closeLessonModal()),
          error: (err) => this.afterFail(err, 'The lesson was created but could not be added to the section')
        });
      },
      error: (err) => this.afterFail(err, 'Failed to create the lesson')
    });
  }

  async deleteLessonEverywhere(): Promise<void> {
    const lesson = this.lessons.find(l => l.id === this.editingId);
    if (!lesson || !(await this.confirmDialog.ask(
      `Delete the lesson "${lesson.name}" from every section that uses it?`))) {
      return;
    }
    this.lessonApi.deleteLesson(lesson.id).subscribe({
      next: (res: any) => this.afterSave(res, 'Lesson deleted', () => this.closeLessonModal()),
      error: (err) => this.afterFail(err, 'Failed to delete the lesson')
    });
  }

  async removeLesson(l: TreeLesson): Promise<void> {
    if (!(await this.confirmDialog.ask(
      `Remove "${l.lesson.name}" from this section? The lesson itself is kept.`,
      { title: 'Remove lesson', confirmText: 'Remove' }))) {
      return;
    }
    this.sectionLessonApi.unlink(l.link.id).subscribe({
      next: (res: any) => this.afterSave(res, 'Lesson removed from the section'),
      error: (err) => this.afterFail(err, 'Failed to remove the lesson')
    });
  }

  //=====================================
  // Materials
  //=====================================

  openUploadModal(lesson: any): void {
    this.targetLesson = lesson;
    this.file = null;
    this.fileError = '';
    this.uploadedMaterialId = null;
    this.uploadForm.reset({ title: '', description: '', materialType: '', downloadAllowed: true, previewAllowed: true });
    this.showUploadModal = true;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.file = null;
    this.uploadedMaterialId = null;
  }

  onFileChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const chosen = input.files?.[0] ?? null;
    this.fileError = chosen ? (validateUpload(chosen) ?? '') : '';

    if (chosen && !this.fileError) {
      this.file = chosen;
      if (!this.uploadForm.get('materialType')!.value) {
        this.uploadForm.get('materialType')!.setValue(guessMaterialType(chosen.name));
      }
      if (!this.uploadForm.get('title')!.value) {
        this.uploadForm.get('title')!.setValue(chosen.name.replace(/\.[^.]+$/, ''));
      }
    } else {
      this.file = null;
      input.value = '';
    }
    this.cd.markForCheck();
  }

  // Uploads the file, then attaches the new material to the lesson in the same step. If the second
  // step fails the file is already stored, so pressing Upload again only repeats the attach.
  saveUpload(): void {
    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      return;
    }
    if (!this.file && this.uploadedMaterialId === null) {
      this.fileError = 'Choose a file to upload.';
      return;
    }

    const value = this.uploadForm.value;
    this.saving = true;

    const attach = (id: number) => {
      this.uploadedMaterialId = id;
      this.lessonMaterialApi.link(this.targetLesson.id, id).subscribe({
        next: (res: any) => {
          this.uploadedMaterialId = null;
          this.afterSave(res, 'Material uploaded and added to the lesson', () => this.closeUploadModal());
        },
        error: (err) => this.afterFail(err,
          'The file was uploaded but could not be added to the lesson. Press Upload to try adding it again.')
      });
    };

    if (this.uploadedMaterialId !== null) {
      attach(this.uploadedMaterialId);
      return;
    }

    this.materialApi.createMaterial({ ...value, file: this.file }).subscribe({
      next: (created: any) => {
        const id = created?.data?.id;
        if (id) {
          attach(id);
          return;
        }
        // The API did not send the new id back: find the material by its title.
        this.materialApi.getMaterials({ search: value.title }).subscribe({
          next: (res: any) => {
            const found = (Array.isArray(res?.data) ? res.data : []).find((m: any) => m.title === value.title);
            if (found) {
              attach(found.id);
            } else {
              this.afterFail(null, 'The file was uploaded. Add it to the lesson from "Add existing file".');
            }
          },
          error: (err) => this.afterFail(err, 'The file was uploaded. Add it to the lesson from "Add existing file".')
        });
      },
      error: (err) => {
        const text = JSON.stringify(err?.error ?? '').toLowerCase();
        this.afterFail(
          text.includes('already exists') ? null : err,
          text.includes('already exists')
            ? 'A file with this title already exists. Change the title, or close this and use "Add existing file".'
            : 'Failed to upload the file');
      }
    });
  }

  async removeMaterial(m: TreeMaterial): Promise<void> {
    if (!(await this.confirmDialog.ask(
      `Remove "${m.material.title}" from this lesson? The file itself is kept in Learning Materials.`,
      { title: 'Remove material', confirmText: 'Remove' }))) {
      return;
    }
    this.lessonMaterialApi.unlink(m.link.id).subscribe({
      next: (res: any) => this.afterSave(res, 'Material removed from the lesson'),
      error: (err) => this.afterFail(err, 'Failed to remove the material')
    });
  }

  download(material: any): void {
    this.materialApi.download(material.id).subscribe({
      next: (res: any) => saveBlobResponse(res, material.fileName || material.title),
      error: (err) => {
        this.feedback.fail(err, 'Failed to download the file');
        this.cd.markForCheck();
      }
    });
  }

  //=====================================
  // Shared
  //=====================================

  private afterSave(res: any, message: string, close?: () => void): void {
    this.saving = false;
    close?.();
    this.feedback.ok(message, res);
    this.loadAll();
  }

  private afterFail(err: any, message: string): void {
    this.saving = false;
    this.feedback.fail(err, message);
    // A half-finished create (the item exists but was not linked) must show up in the lists.
    this.loadAll();
  }
}
