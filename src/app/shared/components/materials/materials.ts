import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Auth } from '../../../core/auth/auth';
import { MaterialService } from '../../../features/services/material/material-service';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, FieldError } from '../../validation';
import { ConfirmService } from '../confirm-dailog/confirm';
import {
  ALLOWED_EXTENSIONS, MATERIAL_TYPES, MAX_UPLOAD_MB, formatSize, guessMaterialType, saveBlobResponse, validateUpload
} from '../../material-utils';

@Component({
  selector: 'app-materials',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FieldError, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './materials.html',
  styleUrl: './materials.css',
})
export class Materials implements OnInit {

  private confirmDialog = inject(ConfirmService);

  readonly types = MATERIAL_TYPES;
  readonly accept = ALLOWED_EXTENSIONS.join(',');
  readonly maxMb = MAX_UPLOAD_MB;
  readonly formatSize = formatSize;

  materials: any[] = [];
  materialForm!: FormGroup;

  search = '';
  typeFilter = '';

  isEditMode = false;
  selectedId = 0;
  showModal = false;
  file: File | null = null;
  fileError = '';
  saving = false;
  loading = false;

  feedback = new Feedback();

  constructor(
    private api: MaterialService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.materialForm = this.fb.group({
      title: ['', [AppValidators.required, AppValidators.maxLength(200)]],
      description: ['', [AppValidators.maxLength(1000)]],
      materialType: ['', [AppValidators.required]],
      downloadAllowed: [true],
      previewAllowed: [true],
      isActive: [true]
    });

    if (isPlatformBrowser(this.platformId) && this.auth.hasPermission('VIEW_MATERIAL')) {
      this.load();
    }
  }

  load(): void {
    this.loading = true;

    this.api.getMaterials({
      search: this.search.trim() || undefined,
      materialType: this.typeFilter || undefined
    }).subscribe({
      next: (res: any) => {
        this.materials = Array.isArray(res?.data) ? res.data : [];
        this.loading = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        this.materials = [];
        this.loading = false;
        this.feedback.fail(err, 'Failed to load materials');
        this.cd.markForCheck();
      }
    });
  }

  //=====================================
  // Add / edit
  //=====================================

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedId = 0;
    this.file = null;
    this.fileError = '';
    this.materialForm.reset({
      title: '', description: '', materialType: '', downloadAllowed: true, previewAllowed: true, isActive: true
    });
    this.showModal = true;
  }

  editMaterial(m: any): void {
    this.isEditMode = true;
    this.selectedId = m.id;
    this.file = null;
    this.fileError = '';
    this.materialForm.reset({
      title: m.title,
      description: m.description ?? '',
      materialType: m.materialType,
      downloadAllowed: m.downloadAllowed,
      previewAllowed: m.previewAllowed,
      isActive: m.isActive
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.selectedId = 0;
    this.file = null;
  }

  onFileChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const chosen = input.files?.[0] ?? null;

    this.fileError = chosen ? (validateUpload(chosen) ?? '') : '';

    if (chosen && !this.fileError) {
      this.file = chosen;
      // Fill in the obvious values so the user only has to correct them if they are wrong.
      const form = this.materialForm;
      if (!form.get('materialType')!.value) {
        form.get('materialType')!.setValue(guessMaterialType(chosen.name));
      }
      if (!form.get('title')!.value) {
        form.get('title')!.setValue(chosen.name.replace(/\.[^.]+$/, ''));
      }
    } else {
      this.file = null;
      input.value = '';
    }
    this.cd.markForCheck();
  }

  save(): void {
    if (this.materialForm.invalid) {
      this.materialForm.markAllAsTouched();
      return;
    }

    if (!this.isEditMode && !this.file) {
      this.fileError = 'Choose a file to upload.';
      return;
    }

    const value = this.materialForm.value;
    const form = {
      title: value.title,
      description: value.description,
      materialType: value.materialType,
      downloadAllowed: value.downloadAllowed,
      previewAllowed: value.previewAllowed,
      file: this.file
    };

    this.saving = true;

    const request = this.isEditMode
      ? this.api.updateMaterial(this.selectedId, { ...form, isActive: value.isActive })
      : this.api.createMaterial(form);

    request.subscribe({
      next: (res: any) => {
        this.saving = false;
        this.closeModal();
        this.feedback.ok(this.isEditMode ? 'Material updated' : 'Material uploaded', res);
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.feedback.fail(err, 'Failed to save the material');
        this.cd.markForCheck();
      }
    });
  }

  //=====================================
  // Download / delete
  //=====================================

  download(m: any): void {
    this.api.download(m.id).subscribe({
      next: (res: any) => saveBlobResponse(res, m.fileName || m.title),
      error: (err) => {
        this.feedback.fail(err, 'Failed to download the file');
        this.cd.markForCheck();
      }
    });
  }

  async deleteMaterial(m: any): Promise<void> {
    if (!(await this.confirmDialog.ask(`Delete "${m.title}"? It stops being available to students. An admin can bring it back from Restore.`))) {
      return;
    }

    this.api.deleteMaterial(m.id).subscribe({
      next: (res: any) => {
        this.feedback.ok('Material deleted', res);
        this.load();
      },
      error: (err) => {
        this.feedback.fail(err, 'Failed to delete the material');
        this.cd.markForCheck();
      }
    });
  }
}
