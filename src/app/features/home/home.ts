import { Component, ChangeDetectionStrategy, DestroyRef, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeroCube } from './hero-cube/hero-cube';

interface Item {
  title: string;
  text: string;
  icon: string[]; // SVG path "d" values (24x24, stroke icons)
}

const ICONS = {
  college: ['M3 21h18', 'M5 21V7l8-4v18', 'M19 21V11l-6-4', 'M9 9v.01', 'M9 12v.01', 'M9 15v.01'],
  login: ['M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4', 'm10 17 5-5-5-5', 'M15 12H3'],
  book: ['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'],
  code: ['m16 18 6-6-6-6', 'm8 6-6 6 6 6'],
  chart: ['M3 3v18h18', 'm19 9-5 5-4-4-3 3'],
  award: ['M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z', 'M8.21 13.89 7 23l5-3 5 3-1.21-9.12'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'm9 12 2 2 4-4'],
  file: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8'],
  chat: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  briefcase: ['M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16', 'M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z'],
  check: ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'm9 11 3 3L22 4'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'm21 21-4.3-4.3'],
  send: ['m22 2-7 20-4-9-9-4Z', 'M22 2 11 13'],
  ticket: ['M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z', 'M13 5v2', 'M13 17v2', 'M13 11v2'],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  mail: ['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'm22 6-10 7L2 6'],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2'],
};

const COUNT_DURATION_MS = 2000;

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgTemplateOutlet, HeroCube],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  readonly menuOpen = signal(false);
  readonly year = new Date().getFullYear();
  readonly icons = ICONS;

  readonly nav = [
    { id: 'process', label: 'How it works' },
    { id: 'guide', label: 'How to use' },
    { id: 'placements', label: 'Placements' },
    { id: 'internships', label: 'Internships' },
    { id: 'support', label: 'Support' },
    { id: 'contact', label: 'Contact' },
  ];

  // Each stat counts up from 0 to `target` when the page opens.
  readonly stats = [
    { target: 4, suffix: '+', label: 'Partner colleges' },
    { target: 10, suffix: '+', label: 'Learning domains' },
    { target: 100, suffix: '%', label: 'Hands-on coding' },
    { target: 24, suffix: '/7', label: 'Portal access' },
  ];

  /** Animation progress for the stat counters, 0 → 1. */
  readonly countProgress = signal(0);

  readonly process: Item[] = [
    { title: 'Select your college', text: 'Choose your institution so the portal loads your college, department and branch.', icon: ICONS.college },
    { title: 'Sign in securely', text: 'Log in with the credentials issued by your college or Tripledot AI administrator.', icon: ICONS.login },
    { title: 'Enroll in a domain', text: 'Get mapped to a domain and its courses — Full Stack, AI/ML, Data Science and more.', icon: ICONS.book },
    { title: 'Learn & build', text: 'Complete tasks and assignments in the built-in code editor with instant submission.', icon: ICONS.code },
    { title: 'Track progress', text: 'Follow scores, completed tasks and reviews on your personal dashboard.', icon: ICONS.chart },
    { title: 'Get certified', text: 'Earn course certificates that feed directly into placement and internship shortlists.', icon: ICONS.award },
  ];

  readonly roles = [
    {
      role: 'Students',
      icon: ICONS.user,
      steps: [
        'Open your domain and pick a course',
        'Solve tasks & assignments in the code editor',
        'Submit work and view feedback from faculty',
        'Raise a support ticket whenever you are stuck',
      ],
    },
    {
      role: 'Faculty',
      icon: ICONS.users,
      steps: [
        'Create courses, tasks and assignments',
        'Map courses to domains and students',
        'Review submissions and student code',
        'Monitor batch-wise performance',
      ],
    },
    {
      role: 'College Admins',
      icon: ICONS.shield,
      steps: [
        'Manage colleges, departments and branches',
        'Add users and assign roles & permissions',
        'Promote students with year updation',
        'Resolve tickets raised across the college',
      ],
    },
  ];

  readonly placement: Item[] = [
    { title: 'Skill assessment', text: 'Course scores and coding assignments build a verified skill profile for every student.', icon: ICONS.chart },
    { title: 'Profile & resume', text: 'Students complete their profile; projects and certificates are attached automatically.', icon: ICONS.file },
    { title: 'Training & mock interviews', text: 'Aptitude, technical and HR mock rounds prepare students for real drives.', icon: ICONS.chat },
    { title: 'Placement drives', text: 'Partner companies conduct on-campus and virtual drives through Tripledot AI.', icon: ICONS.briefcase },
    { title: 'Offer & onboarding', text: 'Selected students receive offers and are supported until they join.', icon: ICONS.check },
  ];

  readonly getInternship: Item[] = [
    { title: 'Build eligibility', text: 'Complete your domain courses and maintain good task scores.', icon: ICONS.book },
    { title: 'Discover openings', text: 'Internship roles matched to your domain are shared with eligible students.', icon: ICONS.search },
    { title: 'Apply & interview', text: 'Apply in one step with your portal profile and attend the selection rounds.', icon: ICONS.send },
    { title: 'Intern with mentors', text: 'Work on live projects with industry mentors and earn a completion certificate.', icon: ICONS.award },
  ];

  readonly giveInternship: Item[] = [
    { title: 'Partner with us', text: 'Companies and startups register their interest with Tripledot AI Technologies.', icon: ICONS.briefcase },
    { title: 'Share requirements', text: 'Tell us the role, skills, duration and stipend — we handle the outreach.', icon: ICONS.file },
    { title: 'Get pre-screened talent', text: 'Receive shortlists of students with verified course and assignment records.', icon: ICONS.users },
    { title: 'Hire the best', text: 'Convert top-performing interns into full-time hires with confidence.', icon: ICONS.check },
  ];

  readonly colleges = [
    { name: 'Jain University', logo: 'assets/images/jain-logo.png' },
    { name: 'Hindusthan College of Engineering', logo: 'assets/images/Hindusthan_college.png' },
    { name: 'RVS College of Engineering', logo: 'assets/images/Rvs_college.png' },
    { name: 'CMS College of Science & Commerce', logo: 'assets/images/CMS_college.png' },
  ];

  readonly supportChannels: Item[] = [
    { title: 'Raise a ticket', text: 'Log in and open Help & Support to report an issue with courses, tasks or your account.', icon: ICONS.ticket },
    { title: 'Track your tickets', text: 'See the status and replies for every request under My Tickets.', icon: ICONS.list },
    { title: 'Email support', text: "Can't log in? Write to our support team with your college name and user ID.", icon: ICONS.mail },
    { title: 'Response time', text: 'Most tickets are answered within 24 working hours, Monday to Saturday.', icon: ICONS.clock },
  ];

  readonly faqs = [
    {
      q: 'How do I access the Tripledot AI learning portal?',
      a: 'Click "Login", select your college from the list and sign in with the credentials provided by your college administrator. Your dashboard loads automatically based on your role.',
    },
    {
      q: 'I have forgotten my password. How can I reset it?',
      a: 'On the login page, select "Forgot password" and enter your registered email address. A secure reset link will be sent to you. Once signed in, you can change your password at any time from your profile menu.',
    },
    {
      q: 'Why are my domain or courses not visible on my dashboard?',
      a: 'Courses become available once your college administrator maps you to a learning domain. If they are still not visible after mapping, please raise a support ticket with your college name and user ID.',
    },
    {
      q: 'How do I complete and submit tasks and assignments?',
      a: 'Open a course from your domain, select a task or assignment and write your solution in the built-in code editor. Click "Submit" to send it for evaluation — your faculty can then review your work.',
    },
    {
      q: 'What should I do if my assignment submission fails?',
      a: 'Check your internet connection and try submitting again. If the problem persists, raise a support ticket and attach a screenshot of the error so our team can resolve it quickly.',
    },
    {
      q: 'Who is eligible for placement and internship opportunities?',
      a: 'Students who complete their domain courses and maintain consistent task and assignment scores are shortlisted for placement drives and internship openings shared through the portal.',
    },
    {
      q: 'How do I raise and track a support ticket?',
      a: 'After logging in, open "Help & Support", describe your issue and submit a ticket. You can follow its status and read replies from our team under "My Tickets".',
    },
  ];

  /** Index of the open FAQ; only one answer is expanded at a time. */
  readonly openFaq = signal<number | null>(0);

  toggleFaq(i: number): void {
    this.openFaq.update(open => (open === i ? null : i));
  }

  readonly contact = {
    email: 'tripledotaitechnologies.hrm@gmail.com',
    phone: '+91 98432 20051',
    address: 'Coimbatore, Tamil Nadu, India',
  };

  private readonly statsBand = viewChild.required<ElementRef<HTMLElement>>('statsBand');

  constructor() {
    const destroyRef = inject(DestroyRef);
    // Browser-only (skipped during SSR), so the observer and
    // requestAnimationFrame are safe here.
    afterNextRender(() => {
      let frame = 0;

      const startCounting = () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          this.countProgress.set(1);
          return;
        }
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / COUNT_DURATION_MS, 1);
          this.countProgress.set(1 - Math.pow(1 - t, 3)); // ease-out
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      };

      // Count up only once the stats strip scrolls into view.
      const observer = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) {
          observer.disconnect();
          startCounting();
        }
      }, { threshold: 0.4 });
      observer.observe(this.statsBand().nativeElement);

      destroyRef.onDestroy(() => {
        observer.disconnect();
        cancelAnimationFrame(frame);
      });
    });
  }

  countValue(target: number): number {
    return Math.round(target * this.countProgress());
  }

  scrollTo(id: string): void {
    this.menuOpen.set(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
