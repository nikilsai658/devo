import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';

type FaceKey = 'support' | 'assignments' | 'leaderboard' | 'login' | 'courses' | 'placements';

interface Face {
  key: FaceKey;
  label: string;
  /** Cube orientation (degrees) that turns this face toward the viewer. */
  x: number;
  y: number;
}

// Order of the four side faces follows the cube going round to the right,
// so ArrowRight/ArrowLeft step through them in visual order.
const FACES: Face[] = [
  { key: 'support',     label: 'Support',     x: -14, y: 0 },
  { key: 'assignments', label: 'Assignments', x: -14, y: -90 },
  { key: 'leaderboard', label: 'Leaderboard', x: -14, y: -180 },
  { key: 'login',       label: 'Login help',  x: -14, y: 90 },
  { key: 'courses',     label: 'Courses',     x: -90, y: 0 },
  { key: 'placements',  label: 'Placements',  x: 90,  y: 0 },
];

const DRAG_SPEED = 0.45;       // degrees per pixel dragged
const FRICTION = 0.94;         // momentum decay per frame
const AUTO_SPIN = 0.012;       // degrees per ms while idle
const IDLE_BEFORE_SPIN = 2500; // ms after the last interaction
const TWEEN_MS = 700;

@Component({
  selector: 'app-hero-cube',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-cube.html',
  styleUrl: './hero-cube.css',
})
export class HeroCube {
  readonly faces = FACES;
  readonly active = signal<FaceKey>('support');

  private readonly cube = viewChild.required<ElementRef<HTMLElement>>('cube');

  // Current orientation and momentum. Kept outside signals: they change every
  // frame and are written straight to the DOM, so they never trigger change
  // detection.
  private x = -18;
  private y = -28;
  private vx = 0;
  private vy = 0;
  private dragging = false;
  private hovering = false;
  private lastPointer = { x: 0, y: 0 };
  private lastInteraction = 0;
  private reducedMotion = false;
  private tween: { fromX: number; fromY: number; toX: number; toY: number; start: number } | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Browser only (skipped during SSR).
    afterNextRender(() => {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.lastInteraction = performance.now();

      let frame = 0;
      let prev = performance.now();
      const tick = (now: number) => {
        this.step(now, Math.min(now - prev, 50));
        prev = now;
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      destroyRef.onDestroy(() => cancelAnimationFrame(frame));
    });
  }

  // ---------------- Pointer ----------------

  onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.dragging = true;
    this.tween = null;
    this.vx = this.vy = 0;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.touch();
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.dragging) return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer = { x: e.clientX, y: e.clientY };

    this.vy = dx * DRAG_SPEED;
    this.vx = -dy * DRAG_SPEED;
    this.y += this.vy;
    this.x = clampX(this.x + this.vx);
    this.touch();
  }

  onPointerUp(): void {
    this.dragging = false;
    this.touch();
  }

  setHover(value: boolean): void {
    this.hovering = value;
  }

  // ---------------- Keyboard / buttons ----------------

  onKeydown(e: KeyboardEvent): void {
    const sides = FACES.slice(0, 4);
    const current = sides.findIndex(f => f.key === this.active());
    const idx = current < 0 ? 0 : current;

    const map: Record<string, Face | undefined> = {
      ArrowRight: sides[(idx + 1) % 4],
      ArrowLeft: sides[(idx + 3) % 4],
      ArrowUp: FACES.find(f => f.key === 'courses'),
      ArrowDown: FACES.find(f => f.key === 'placements'),
    };
    const target = map[e.key];
    if (!target) return;
    e.preventDefault();
    this.show(target);
  }

  show(face: Face): void {
    // Take the shortest way round so a jump never spins more than 180°.
    const dy = normalize(face.y - this.y);
    this.vx = this.vy = 0;
    this.touch();

    if (this.reducedMotion) {
      this.x = face.x;
      this.y += dy;
      return;
    }
    this.tween = { fromX: this.x, fromY: this.y, toX: face.x, toY: this.y + dy, start: performance.now() };
  }

  // ---------------- Animation loop ----------------

  private step(now: number, dt: number): void {
    if (this.tween) {
      const t = Math.min((now - this.tween.start) / TWEEN_MS, 1);
      const e = 1 - Math.pow(1 - t, 3);
      this.x = this.tween.fromX + (this.tween.toX - this.tween.fromX) * e;
      this.y = this.tween.fromY + (this.tween.toY - this.tween.fromY) * e;
      if (t >= 1) this.tween = null;
    } else if (!this.dragging) {
      // Momentum after a drag
      if (Math.abs(this.vx) > 0.01 || Math.abs(this.vy) > 0.01) {
        this.y += this.vy;
        this.x = clampX(this.x + this.vx);
        this.vx *= FRICTION;
        this.vy *= FRICTION;
      } else if (!this.reducedMotion && !this.hovering && now - this.lastInteraction > IDLE_BEFORE_SPIN) {
        // Gentle idle spin, easing the tilt back to a natural angle
        this.y -= AUTO_SPIN * dt;
        this.x += (-18 - this.x) * 0.02;
      }
    }

    this.cube().nativeElement.style.transform = `rotateX(${this.x}deg) rotateY(${this.y}deg)`;

    const facing = facingFace(this.x, this.y);
    if (facing !== this.active()) this.active.set(facing);
  }

  private touch(): void {
    this.lastInteraction = performance.now();
  }
}

/** Keep the cube from flipping upside down. */
function clampX(x: number): number {
  return Math.max(-90, Math.min(90, x));
}

/** Wrap an angle into (-180, 180]. */
function normalize(a: number): number {
  a = ((a % 360) + 360) % 360;
  return a > 180 ? a - 360 : a;
}

/** Which face points at the viewer for a given orientation. */
function facingFace(x: number, y: number): FaceKey {
  if (x <= -45) return 'courses';
  if (x >= 45) return 'placements';
  const ny = normalize(y);
  if (ny > -45 && ny <= 45) return 'support';
  if (ny > -135 && ny <= -45) return 'assignments';
  if (ny > 45 && ny <= 135) return 'login';
  return 'leaderboard';
}
