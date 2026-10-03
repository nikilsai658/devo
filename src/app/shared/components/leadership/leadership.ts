import { ChangeDetectorRef, Component, OnInit,ChangeDetectionStrategy, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeadershipService } from '../../../features/services/leadership/leadership-service';

type SortKey = 'rank' | 'assignments' | 'attempts';

const PAGE_SIZE = 15;

@Component({
  selector: 'app-leadership',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leadership.html',
  styleUrl: './leadership.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Leadership implements OnInit {

  leaderboard: any[] = [];
  myRank = 0;
  myScore = 0;

  loading = true;
  errorMessage = '';

  search = '';
  sortBy: SortKey = 'rank';
  visibleCount = PAGE_SIZE;
  visible: any[] = [];
  filteredCount = 0;

  readonly sortOptions: { key: SortKey; label: string }[] = [
    { key: 'rank', label: 'Score' },
    { key: 'assignments', label: 'Assignments' },
    { key: 'attempts', label: 'Attempts' },
  ];

  // Summary figures, recomputed whenever the data loads.
  topScore = 0;
  averageScore = 0;
  totalAssignments = 0;

  constructor(private leadershipService: LeadershipService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.getLeaderboard();
  }

  getLeaderboard() {

    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.leadershipService.getleadership().subscribe({
      next: (res: any) => {
        this.leaderboard = [...(res.data?.leaderboard || [])].sort((a, b) => a.rank - b.rank);
        this.myRank = res.data?.myRank || 0;
        this.myScore = res.data?.myScore || 0;
        this.computeSummary();
        this.applyView();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('API Error:', err);
        this.leaderboard = [];
        this.applyView();
        this.loading = false;
        this.errorMessage = err?.error?.message || 'We couldn\'t load the leaderboard.';
        this.cdr.markForCheck();
      }
    });
  }

  // ---------------- Derived values ----------------

  get topThree(): any[] {
    return this.leaderboard.slice(0, 3);
  }

  /** Student directly above me, used for the "points to next rank" hint. */
  get nextAbove(): any | null {
    const idx = this.leaderboard.findIndex(s => s.rank === this.myRank);
    return idx > 0 ? this.leaderboard[idx - 1] : null;
  }

  get pointsToNext(): number {
    const above = this.nextAbove;
    return above ? Math.max(above.totalScore - this.myScore, 0) : 0;
  }

  /** Lead over the runner-up when I'm ranked first. */
  get leadMargin(): number {
    const second = this.leaderboard[1];
    return second ? Math.max(this.myScore - second.totalScore, 0) : 0;
  }

  get percentile(): number {
    if (!this.myRank || !this.leaderboard.length) return 0;
    return Math.max(1, Math.ceil((this.myRank / this.leaderboard.length) * 100));
  }

  /** How far my score is toward the student above me (or the leader). */
  get progressToNext(): number {
    const above = this.nextAbove;
    if (!above) return 100;
    return above.totalScore ? Math.min((this.myScore / above.totalScore) * 100, 100) : 0;
  }

  scorePercent(score: number): number {
    return this.topScore ? Math.max((score / this.topScore) * 100, 2) : 0;
  }

  initials(name: string | null | undefined): string {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  medalClass(rank: number): string {
    return rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
  }

  // ---------------- Search / sort / paging ----------------

  onSearch(value: string) {
    this.search = value;
    this.visibleCount = PAGE_SIZE;
    this.applyView();
  }

  clearSearch() {
    this.onSearch('');
  }

  setSort(key: SortKey) {
    this.sortBy = key;
    this.applyView();
  }

  showMore() {
    this.visibleCount += PAGE_SIZE;
    this.applyView();
  }

  get hasMore(): boolean {
    return this.visible.length < this.filteredCount;
  }

  trackByRank(_: number, s: any) {
    return s.rank + ':' + s.studentName;
  }

  private computeSummary() {
    const list = this.leaderboard;
    this.topScore = list.reduce((m, s) => Math.max(m, s.totalScore || 0), 0);
    this.averageScore = list.length
      ? Math.round(list.reduce((sum, s) => sum + (s.totalScore || 0), 0) / list.length)
      : 0;
    this.totalAssignments = list.reduce((sum, s) => sum + (s.totalAssignments || 0), 0);
  }

  private applyView() {
    const q = this.search.trim().toLowerCase();

    let list = q
      ? this.leaderboard.filter(s =>
          [s.studentName, s.email, s.rollNumber]
            .some(v => (v ?? '').toString().toLowerCase().includes(q)))
      : [...this.leaderboard];

    if (this.sortBy === 'assignments') {
      list.sort((a, b) => (b.totalAssignments || 0) - (a.totalAssignments || 0) || a.rank - b.rank);
    } else if (this.sortBy === 'attempts') {
      list.sort((a, b) => (b.totalAttempts || 0) - (a.totalAttempts || 0) || a.rank - b.rank);
    }

    this.filteredCount = list.length;
    this.visible = list.slice(0, this.visibleCount);
  }
}
