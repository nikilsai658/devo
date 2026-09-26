import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Superadmin } from '../../../features/services/superadmin/superadmin';
import { Router } from '@angular/router';

@Component({
  selector: 'app-superadmin-domain-students',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './superadmin-domain-students.html',
  styleUrl: './superadmin-domain-students.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuperadminDomainStudents implements OnInit {

  students: any[] = [];

  loading = false;

  collegeId!: number;
  domainId!: number;
  domainName = '';
  collegeName = '';

  search = '';
  yearFilter = '';

  constructor(
    private api: Superadmin,
    private cd: ChangeDetectorRef,
    private router:Router
  ) {}

  ngOnInit(): void {

    this.collegeId = history.state.collegeId;
    this.domainId = history.state.domainId;
    this.domainName = history.state.domainName ?? '';
    this.collegeName = history.state.collegeName ?? '';

    if (this.collegeId && this.domainId) {
      this.loadDomainStudents();
    }
  }

  loadDomainStudents(): void {

    this.loading = true;

    this.api
      .getsuperadmincollege_domain_students(
        this.collegeId,
        this.domainId
      )
      .subscribe({

        next: (res: any) => {

          this.students = res?.data ?? [];

          this.loading = false;

          this.cd.markForCheck();
        },

        error: (error) => {

          console.error(
            'Error loading domain students:',
            error
          );

          this.students = [];

          this.loading = false;

          this.cd.markForCheck();
        }

      });
  }

  // ---------------- Filtering & summary ----------------

  get years(): string[] {
    const set = new Set(this.students.map(s => String(s.year ?? '')).filter(Boolean));
    return [...set].sort();
  }

  get filteredStudents(): any[] {
    const term = this.search.trim().toLowerCase();
    return this.students.filter(s =>
      (!this.yearFilter || String(s.year) === this.yearFilter) &&
      (!term ||
        (s.studentName || '').toLowerCase().includes(term) ||
        (s.studentEmail || '').toLowerCase().includes(term) ||
        String(s.registerNumber || '').toLowerCase().includes(term))
    );
  }

  get isFiltered(): boolean {
    return !!(this.search.trim() || this.yearFilter);
  }

  private sum(list: any[], key: string): number {
    return list.reduce((total, s) => total + (Number(s[key]) || 0), 0);
  }

  get totalCompleted(): number {
    return this.sum(this.students, 'completedAssignments');
  }

  get totalPending(): number {
    return this.sum(this.students, 'pendingAssignments');
  }

  get averageScore(): number {
    return this.students.length
      ? Math.round(this.sum(this.students, 'totalScore') / this.students.length)
      : 0;
  }

  // Share of a student's assignments that are completed (0-100)
  completion(student: any): number {
    const total = Number(student.totalAssignments) || 0;
    return total ? Math.round(((Number(student.completedAssignments) || 0) / total) * 100) : 0;
  }

  initials(name?: string): string {
    const words = (name || 'S').trim().split(/\s+/);
    return words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  }

  clearFilters(): void {
    this.search = '';
    this.yearFilter = '';
  }

  // ---------------- Navigation ----------------

  backToColleges(): void {
    this.router.navigate(['/main/superamin-colleges']);
  }

  backToDomains(): void {
    this.router.navigate(['/main/superadmin-domains'], {
      state: { collegeId: this.collegeId, collegeName: this.collegeName }
    });
  }

  viewAssignments(student: any): void {
    this.router.navigate(
      ['/main/superadmin-student-assignments'],
      {
        state: {
          studentId: student.studentId,
          studentName: student.studentName,
          studentEmail: student.studentEmail,
          registerNumber: student.registerNumber,
          collegeId: this.collegeId,
          domainId: this.domainId,
          collegeName: this.collegeName,
          domainName: this.domainName,
        }
      }
    );
  }

  viewTasks(student: any): void {
    this.router.navigate(
      ['/main/superadmin-student-tasks'],
      {
        state: {
          studentId: student.studentId,
          studentName: student.studentName,
          studentEmail: student.studentEmail,
          registerNumber: student.registerNumber,
          collegeId: this.collegeId,
          domainId: this.domainId,
          collegeName: this.collegeName,
          domainName: this.domainName,
        }
      }
    );
  }

  // ---------------- Print report ----------------

  printContent(): void {
    const rows = this.filteredStudents;
    if (!rows.length) {
      return;
    }

    const esc = (value: unknown): string =>
      String(value ?? '').replace(/[&<>"']/g, ch =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!)
      );

    const collegeName = this.collegeName || `College #${this.collegeId}`;
    const domainName = this.domainName || `Domain #${this.domainId}`;
    const generated = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const completed = this.sum(rows, 'completedAssignments');
    const pending = this.sum(rows, 'pendingAssignments');
    const avgScore = Math.round(this.sum(rows, 'totalScore') / rows.length);

    const filterNote = this.isFiltered
      ? `<p class="note">Filtered view${this.yearFilter ? ` · Year ${esc(this.yearFilter)}` : ''}${this.search.trim() ? ` · Search “${esc(this.search.trim())}”` : ''} — ${rows.length} of ${this.students.length} students</p>`
      : '';

    const bodyRows = rows.map((s, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td>
          <div class="name">${esc(s.studentName)}</div>
          <div class="email">${esc(s.studentEmail)}</div>
        </td>
        <td>${esc(s.registerNumber || '—')}</td>
        <td class="c">${esc(s.year ?? '—')}</td>
        <td class="c">${esc(s.totalAssignments ?? 0)}</td>
        <td class="c">${esc(s.totalTasks ?? 0)}</td>
        <td class="c">${esc(s.completedAssignments ?? 0)}</td>
        <td class="c">${esc(s.pendingAssignments ?? 0)}</td>
        <td class="c">${esc(s.totalAttempts ?? 0)}</td>
        <td class="c strong">${esc(s.totalScore ?? 0)}</td>
      </tr>`).join('');

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(collegeName)} — ${esc(domainName)} Student Report</title>
<style>
  @page {
    size: A4 landscape;
    margin: 14mm 12mm 16mm;
    @bottom-left  { content: "${esc(collegeName)} · ${esc(domainName)}"; font: 8pt Arial, sans-serif; color: #6b7280; }
    @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 8pt Arial, sans-serif; color: #6b7280; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; color: #111827; font-size: 10pt;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  .letterhead { display: flex; justify-content: space-between; align-items: flex-end;
                padding-bottom: 12px; border-bottom: 3px solid #6B21D0; }
  .college { font-size: 22pt; font-weight: 700; letter-spacing: -0.3px; margin: 0; }
  .report-title { margin: 4px 0 0; font-size: 11pt; font-weight: 600; color: #6B21D0;
                  text-transform: uppercase; letter-spacing: 1.5px; }
  .meta { text-align: right; font-size: 8.5pt; color: #4b5563; line-height: 1.6; }
  .meta b { color: #111827; }

  .summary { display: flex; gap: 10px; margin: 16px 0 6px; }
  .box { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 12px; }
  .box span { display: block; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.8px; color: #6b7280; }
  .box strong { display: block; font-size: 15pt; margin-top: 2px; }
  .note { margin: 6px 0 0; font-size: 8.5pt; color: #6b7280; font-style: italic; }

  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th { background: #6B21D0; color: #fff; font-size: 8pt; font-weight: 600; text-transform: uppercase;
       letter-spacing: 0.6px; padding: 8px 8px; text-align: left; }
  th.c { text-align: center; }
  td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
  tbody tr:nth-child(even) td { background: #f7f5fb; }
  td.c { text-align: center; }
  td.num { color: #6b7280; width: 32px; }
  td.strong { font-weight: 700; }
  .name { font-weight: 600; }
  .email { font-size: 8pt; color: #6b7280; margin-top: 1px; }

  .signoff { display: flex; justify-content: space-between; margin-top: 48px; font-size: 9pt; color: #374151;
             page-break-inside: avoid; }
  .sign { width: 200px; border-top: 1px solid #9ca3af; padding-top: 6px; text-align: center; }
</style>
</head>
<body>
  <header class="letterhead">
    <div>
      <h1 class="college">${esc(collegeName)}</h1>
      <p class="report-title">Domain Student Performance Report</p>
    </div>
    <div class="meta">
      <div>Domain: <b>${esc(domainName)}</b></div>
      <div>College ID: <b>${esc(this.collegeId)}</b> &nbsp;·&nbsp; Domain ID: <b>${esc(this.domainId)}</b></div>
      <div>Generated: <b>${esc(generated)}</b></div>
    </div>
  </header>

  <section class="summary">
    <div class="box"><span>Students</span><strong>${rows.length}</strong></div>
    <div class="box"><span>Completed Assignments</span><strong>${completed}</strong></div>
    <div class="box"><span>Pending Assignments</span><strong>${pending}</strong></div>
    <div class="box"><span>Average Score</span><strong>${avgScore}</strong></div>
  </section>
  ${filterNote}

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Student</th>
        <th>Register No.</th>
        <th class="c">Year</th>
        <th class="c">Assignments</th>
        <th class="c">Tasks</th>
        <th class="c">Completed</th>
        <th class="c">Pending</th>
        <th class="c">Attempts</th>
        <th class="c">Score</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>

  <footer class="signoff">
    <div class="sign">Prepared by</div>
    <div class="sign">Authorised Signatory</div>
  </footer>
</body>
</html>`;

    // Print from a hidden iframe so popup blockers never interfere
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(frame);

    const doc = frame.contentWindow?.document;
    if (!doc) {
      frame.remove();
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const win = frame.contentWindow!;
    win.onafterprint = () => frame.remove();
    setTimeout(() => {
      win.focus();
      win.print();
      // Fallback cleanup for browsers that don't fire afterprint
      setTimeout(() => frame.isConnected && frame.remove(), 60000);
    }, 250);
  }
}
