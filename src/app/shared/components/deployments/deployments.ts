import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Auth } from '../../../core/auth/auth';
import { DeploymentService } from '../../../features/services/deployment/deployment-service';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, FieldError } from '../../validation';
import { ConfirmService } from '../confirm-dailog/confirm';

@Component({
  selector: 'app-deployments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FieldError, CommonModule, ReactiveFormsModule],
  templateUrl: './deployments.html',
  styleUrl: './deployments.css',
})
export class Deployments implements OnInit {

  private confirmDialog = inject(ConfirmService);

  readonly statuses = ['Planned', 'Active', 'Disabled'];

  deployments: any[] = [];
  summary: any = null;

  deploymentForm!: FormGroup;
  connectionForm!: FormGroup;

  isEditMode = false;
  selectedId = 0;
  showModal = false;
  showConnectionModal = false;
  selectedContainer = '';

  feedback = new Feedback();

  constructor(
    private api: DeploymentService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.deploymentForm = this.fb.group({
      collegeCode: ['', [AppValidators.required, AppValidators.code, AppValidators.maxLength(20)]],
      containerName: ['', [AppValidators.maxLength(100)]],
      hostname: ['', [AppValidators.required, AppValidators.maxLength(255)]],
      frontendUrl: ['', [AppValidators.maxLength(500)]],
      collegeConnectionString: ['', [AppValidators.required, AppValidators.maxLength(2000)]],
      imageTag: ['', [AppValidators.maxLength(100)]],
      memoryLimitMb: [400, [AppValidators.min(128), AppValidators.max(8192)]],
      status: ['Planned'],
      notes: ['', [AppValidators.maxLength(1000)]]
    });

    this.connectionForm = this.fb.group({
      connectionString: ['', [AppValidators.required, AppValidators.maxLength(2000)]]
    });

    if (isPlatformBrowser(this.platformId) && this.auth.hasPermission('VIEW_DEPLOYMENTS')) {
      this.load();
    }
  }

  get canManage(): boolean {
    return this.auth.hasPermission('MANAGE_DEPLOYMENTS');
  }

  load(): void {
    this.api.getDeployments().subscribe({
      next: (res: any) => {
        this.deployments = Array.isArray(res?.data) ? res.data : [];
        this.cd.markForCheck();
      },
      error: (err) => {
        this.deployments = [];
        this.feedback.fail(err, 'Failed to load deployments');
        this.cd.markForCheck();
      }
    });

    this.api.getSummary().subscribe({
      next: (res: any) => {
        this.summary = res?.data ?? null;
        this.cd.markForCheck();
      },
      error: () => {
        this.summary = null;
        this.cd.markForCheck();
      }
    });
  }

  // "online" = Active and seen in the last 3 minutes (decided by the API).
  stateOf(d: any): { label: string; cls: string } {
    if (d.status === 'Active') {
      return d.online
        ? { label: 'Online', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
        : { label: 'Offline', cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
    }
    return d.status === 'Planned'
      ? { label: 'Planned', cls: 'bg-sky-500/15 text-sky-400 border-sky-500/30' }
      : { label: 'Disabled', cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' };
  }

  //=====================================
  // Add / edit
  //=====================================

  private setCreateRules(create: boolean): void {
    const code = this.deploymentForm.get('collegeCode')!;
    const conn = this.deploymentForm.get('collegeConnectionString')!;
    if (create) {
      code.enable();
      conn.enable();
    } else {
      // These two cannot be changed here: the code is fixed, the connection string has its own dialog.
      code.disable();
      conn.disable();
    }
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedId = 0;
    this.deploymentForm.reset({
      collegeCode: '', containerName: '', hostname: '', frontendUrl: '', collegeConnectionString: '',
      imageTag: '', memoryLimitMb: 400, status: 'Planned', notes: ''
    });
    this.setCreateRules(true);
    this.showModal = true;
  }

  editDeployment(d: any): void {
    this.isEditMode = true;
    this.selectedId = d.id;
    this.deploymentForm.reset({
      collegeCode: d.collegeCode,
      containerName: d.containerName,
      hostname: d.hostname,
      frontendUrl: d.frontendUrl ?? '',
      collegeConnectionString: '',
      imageTag: d.imageTag,
      memoryLimitMb: d.memoryLimitMb,
      status: d.status,
      notes: d.notes ?? ''
    });
    this.setCreateRules(false);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.selectedId = 0;
  }

  // Empty optional fields are left out so the API applies its defaults / keeps the current value.
  private payload(): any {
    const raw = this.deploymentForm.getRawValue();
    const body: any = {};
    for (const [key, value] of Object.entries(raw)) {
      if (value !== '' && value !== null) {
        body[key] = value;
      }
    }
    return body;
  }

  save(): void {
    if (this.deploymentForm.invalid) {
      this.deploymentForm.markAllAsTouched();
      return;
    }

    const body = this.payload();

    if (!this.isEditMode) {
      this.api.createDeployment(body).subscribe({
        next: (res: any) => {
          this.closeModal();
          this.feedback.ok('Deployment registered. Run sync.sh on the server to apply it.', res);
          this.load();
        },
        error: (err) => {
          this.feedback.fail(err, 'Failed to register the deployment');
          this.cd.markForCheck();
        }
      });
      return;
    }

    delete body.collegeCode;
    delete body.collegeConnectionString;

    this.api.updateDeployment(this.selectedId, body).subscribe({
      next: (res: any) => {
        this.closeModal();
        this.feedback.ok('Deployment updated. Run sync.sh on the server to apply it.', res);
        this.load();
      },
      error: (err) => {
        this.feedback.fail(err, 'Failed to update the deployment');
        this.cd.markForCheck();
      }
    });
  }

  //=====================================
  // Connection string
  //=====================================

  openConnectionModal(d: any): void {
    this.selectedId = d.id;
    this.selectedContainer = d.containerName;
    this.connectionForm.reset({ connectionString: '' });
    this.showConnectionModal = true;
  }

  closeConnectionModal(): void {
    this.showConnectionModal = false;
    this.selectedId = 0;
    this.connectionForm.reset({ connectionString: '' });
  }

  saveConnectionString(): void {
    if (this.connectionForm.invalid) {
      this.connectionForm.markAllAsTouched();
      return;
    }

    this.api.setConnectionString(this.selectedId, this.connectionForm.value.connectionString).subscribe({
      next: (res: any) => {
        this.closeConnectionModal();
        this.feedback.ok('Connection string saved. Run sync.sh on the server to restart the container with it.', res);
        this.load();
      },
      error: (err) => {
        this.feedback.fail(err, 'Failed to save the connection string');
        this.cd.markForCheck();
      }
    });
  }

  //=====================================
  // Delete
  //=====================================

  async deleteDeployment(d: any): Promise<void> {
    if (d.status === 'Active') {
      this.feedback.fail(null, 'Set the deployment to Disabled and sync the server before deleting it.');
      return;
    }

    if (!(await this.confirmDialog.ask(`Delete the deployment ${d.containerName}? The college database is not touched.`))) {
      return;
    }

    this.api.deleteDeployment(d.id).subscribe({
      next: (res: any) => {
        this.feedback.ok('Deployment deleted', res);
        this.load();
      },
      error: (err) => {
        this.feedback.fail(err, 'Failed to delete the deployment');
        this.cd.markForCheck();
      }
    });
  }
}
