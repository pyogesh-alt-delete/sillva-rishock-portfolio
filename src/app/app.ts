import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  NgZone,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Reel {
  id: string;
  cover: string;
  caption: string;
  music: string;
  baseLikes: number;
  comments: string;
}

interface GalleryItem {
  src: string;
  title: string;
  cat: string;
}

interface ExperienceItem {
  period: string;
  current: boolean;
  role: string;
  company: string;
  desc: string;
}

interface Track {
  title: string;
  album: string;
  dur: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  @ViewChild('rootEl') rootEl!: ElementRef<HTMLDivElement>;
  @ViewChild('spotEl') spotEl!: ElementRef<HTMLDivElement>;
  @ViewChild('nameEl') nameEl!: ElementRef<HTMLHeadingElement>;
  @ViewChild('knobEl') knobEl!: ElementRef<HTMLSpanElement>;
  @ViewChild('tcEl') tcEl!: ElementRef<HTMLSpanElement>;
  @ViewChild('headEl') headEl!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollerEl') scrollerEl!: ElementRef<HTMLDivElement>;
  @ViewChild('loaderEl') loaderEl!: ElementRef<HTMLDivElement>;
  @ViewChild('loadPctEl') loadPctEl!: ElementRef<HTMLSpanElement>;
  @ViewChild('loadBarEl') loadBarEl!: ElementRef<HTMLDivElement>;
  @ViewChild('loadStageEl') loadStageEl!: ElementRef<HTMLDivElement>;
  @ViewChild('loadFrameEl') loadFrameEl!: ElementRef<HTMLSpanElement>;
  @ViewChild('loadTcEl') loadTcEl!: ElementRef<HTMLSpanElement>;
  @ViewChild('loadQrEl') loadQrEl!: ElementRef<HTMLDivElement>;
  @ViewChild('loadScanEl') loadScanEl!: ElementRef<HTMLDivElement>;

  isDark = true;
  isPlaying = true;
  activeReel = 0;
  galleryFilter = 'All';
  nowPlaying: number | null = null;
  liked: boolean[] = [false, false, false, false, false];
  qrCells: { row: number; left: string; top: string; size: string }[] = [];
  qrTotal = 0;

  private _p = 0;
  private _last = 0;
  private _raf = 0;
  private _loadRaf = 0;
  private _loaded = false;
  private _mag: Array<[HTMLElement, (e: MouseEvent) => void, () => void]> = [];
  private _spot?: (e: MouseEvent) => void;
  private _revealIO?: IntersectionObserver;
  private _onReelScroll?: () => void;
  private _lastTap = 0;
  private _introEls: Array<[HTMLElement, string]> = [];
  private _qrN = 25;
  private _revRow = -1;

  readonly reelData: Reel[] = [
    { id: 'reel-1', cover: 'uploads/Post 1.mp4', caption: 'Kinetic title sequence — built in After Effects', music: 'Original Audio', baseLikes: 12400, comments: '318' },
    { id: 'reel-2', cover: 'uploads/Bajaj Text typing 29-05.mp4', caption: 'Neon festival poster, brought to life', music: 'Original Audio', baseLikes: 8900, comments: '142' },
    { id: 'reel-3', cover: 'uploads/Built tough, built smart - here\'s why Tethertools is every creator\'s go-to.Stop wrestling your c.mp4', caption: '30-day brand reel series for a coffee label', music: 'Original Audio', baseLikes: 24100, comments: '511' },
    { id: 'reel-4', cover: 'uploads/Bajaj Text typing 29-05.mp4', caption: 'Liquid morph logo reveal', music: 'Original Audio', baseLikes: 6200, comments: '98' },
    { id: 'reel-5', cover: 'uploads/Post 1.mp4', caption: 'A year of motion — the full 2026 showreel', music: 'Original Audio', baseLikes: 41700, comments: '1240' },
  ];

  readonly galleryItems: GalleryItem[] = [
    { src: 'uploads/COOKE WORKSHOP  POSTER 1 BY 4.png', title: 'Cooke Workshop', cat: 'Campaigns' },
    { src: 'uploads/Cooke lenses.png', title: 'Cooke SP3 · Black Friday', cat: 'Campaigns' },
    { src: 'uploads/Black friday angelbird.png', title: 'Angelbird · Black Friday', cat: 'Campaigns' },
    { src: 'uploads/Canon Story 3.png', title: 'Canon EOS R100 · Born to Create', cat: 'Campaigns' },
    { src: 'uploads/year end sale 3.png', title: 'Srishti · Year End Sale', cat: 'Campaigns' },
    { src: 'uploads/Rapido page 1.png', title: 'Rapido · Urban Travel', cat: 'Branding' },
    { src: 'uploads/rapido page 2.png', title: 'Rapido · Merch System', cat: 'Branding' },
    { src: 'uploads/rapido page 3.png', title: 'Rapido · Logo Variations', cat: 'Branding' },
    { src: 'uploads/Page 4.png', title: 'Rapido · Apparel Mockup', cat: 'Branding' },
    { src: 'uploads/kredly logo.png', title: 'Kredly · Identity', cat: 'Branding' },
    { src: 'uploads/Unfinished melodies.png', title: 'Unfinished Melodies · Identity', cat: 'Branding' },
    { src: 'uploads/Friendship day draft 2 v2.png', title: 'Friendship Day', cat: 'Festive' },
    { src: 'uploads/madras day 11.png', title: '386th Madras Day', cat: 'Festive' },
    { src: 'uploads/wildlife 2.png', title: 'National Wildlife Day', cat: 'Festive' },
    { src: 'uploads/Ganesh chathurthi 4.png', title: 'Ganesh Chaturthi', cat: 'Festive' },
    { src: 'uploads/Raksha bandan whatsapp creative.png', title: 'Raksha Bandhan', cat: 'Festive' },
    { src: 'uploads/comic b1.png', title: "I'm Just a Cooke", cat: 'Comics' },
    { src: 'uploads/Comic 3.png', title: 'For Your Development', cat: 'Comics' },
  ];

  readonly experience: ExperienceItem[] = [
    {
      period: '2024 — Present',
      current: true,
      role: 'Graphic & Motion Designer',
      company: 'Srishti Digilife',
      desc: "Leading social campaigns, festive creatives, motion reels and brand collateral for the world's top camera and cinema brands — Cooke, Canon, Angelbird, Gitzo and more.",
    },
    {
      period: '2022 — 2024',
      current: false,
      role: 'Visual & Video Designer',
      company: 'Freelance / Studio',
      desc: 'Built brand identities, event posters, merch systems and short-form video edits for clients across mobility, F&B and entertainment.',
    },
    {
      period: '2021 — 2022',
      current: false,
      role: 'Junior Designer',
      company: 'Creative Studio',
      desc: 'Cut my teeth on layout, typography and the full Adobe suite — shipping daily social content and learning motion from the ground up.',
    },
  ];

  readonly tracks: Track[] = [
    { title: 'Unfinished Melody', album: 'Unfinished Melodies', dur: '3:24' },
    { title: 'Midnight Frames', album: 'Unfinished Melodies', dur: '2:58' },
    { title: 'Slow Render', album: 'Late Nights EP', dur: '4:11' },
    { title: 'Golden Hour', album: 'Late Nights EP', dur: '3:46' },
    { title: 'Last Cut', album: 'Singles', dur: '3:02' },
  ];

  readonly galleryChips = ['All', 'Campaigns', 'Branding', 'Festive', 'Comics'];

  readonly tools = [
    { abbr: 'Ps', name: 'Photoshop', sub: 'Photo & Retouch', color: '#31a8ff', bg: '#001e36', delay: '0s' },
    { abbr: 'Ai', name: 'Illustrator', sub: 'Vector & Logos', color: '#ff9a00', bg: '#2e1500', delay: '.4s' },
    { abbr: 'Ae', name: 'After Effects', sub: 'Motion Graphics', color: '#9999ff', bg: '#00005b', delay: '.8s' },
    { abbr: 'Pr', name: 'Premiere Pro', sub: 'Video Editing', color: '#ea77ff', bg: '#2a0a36', delay: '1.2s' },
    { abbr: 'DR', name: 'DaVinci Resolve', sub: 'Color Grading', color: '#6c9eff', bg: '#0e1430', delay: '1.6s' },
    { abbr: 'Lr', name: 'Lightroom', sub: 'Photo Editing', color: '#00c8ff', bg: '#001e36', delay: '2s' },
    { abbr: 'Fi', name: 'Figma', sub: 'UI & Layout', color: '#a259ff', bg: '#1b1b1f', delay: '2.4s' },
    { abbr: 'Au', name: 'Audition', sub: 'Audio Post', color: '#00e4bb', bg: '#00313c', delay: '2.8s' },
  ];

  get filteredGallery(): GalleryItem[] {
    if (this.galleryFilter === 'All') return this.galleryItems;
    return this.galleryItems.filter(i => i.cat === this.galleryFilter);
  }

  get activeLabel(): string {
    return String(this.activeReel + 1).padStart(2, '0');
  }

  get reelTotal(): string {
    return String(this.reelData.length).padStart(2, '0');
  }

  get galleryCount(): string {
    return String(this.filteredGallery.length).padStart(2, '0');
  }

  constructor(private zone: NgZone) {
    afterNextRender(() => {
      this.initAfterRender();
    });
  }

  ngOnInit() {
    this.qrCells = this._buildQrCells();
    this.qrTotal = this.qrCells.length;
  }

  private initAfterRender() {
    // Hold hero intro animations until loader hands off
    const root = this.rootEl?.nativeElement;
    if (root) {
      root.querySelectorAll<HTMLElement>('[data-letter-in]').forEach(el => {
        this._introEls.push([el, el.style.animationPlayState]);
        el.style.animationPlayState = 'paused';
      });
    }

    this.runLoader();
    this.initMagnetic();
    this.initSpotlight();
    this.initScrollReveal();
    this.startTimelineScrubber();
    this.initReelScroll();
  }

  ngOnDestroy() {
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._loadRaf) cancelAnimationFrame(this._loadRaf);
    if (this._revealIO) this._revealIO.disconnect();
    const scEl = this.scrollerEl?.nativeElement;
    if (scEl && this._onReelScroll) scEl.removeEventListener('scroll', this._onReelScroll);
    this._mag.forEach(([el, mv, lv]) => {
      el.removeEventListener('mousemove', mv);
      el.removeEventListener('mouseleave', lv);
    });
    const root = this.rootEl?.nativeElement;
    if (root && this._spot) root.removeEventListener('mousemove', this._spot);
  }

  private _buildQrCells() {
    const N = 25;
    const m = Array.from({ length: N }, () => Array(N).fill(false));
    const finder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
        const edge = r === 0 || r === 6 || c === 0 || c === 6;
        const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        m[r0 + r][c0 + c] = edge || inner;
      }
    };
    finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
    for (let i = 8; i < N - 8; i++) { m[6][i] = i % 2 === 0; m[i][6] = i % 2 === 0; }
    const a0 = N - 9;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      const edge = r === 0 || r === 4 || c === 0 || c === 4;
      const mid = r === 2 && c === 2;
      m[a0 + r][a0 + c] = edge || mid;
    }
    const inFinder = (r: number, c: number) => (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);
    const inAlign = (r: number, c: number) => r >= a0 && r <= a0 + 4 && c >= a0 && c <= a0 + 4;
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (inFinder(r, c) || inAlign(r, c) || r === 6 || c === 6) continue;
      m[r][c] = rnd() > 0.52;
    }
    const u = 100 / N;
    const cells: { row: number; left: string; top: string; size: string }[] = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (m[r][c]) cells.push({ row: r, left: (c * u).toFixed(3) + '%', top: (r * u).toFixed(3) + '%', size: u.toFixed(3) + '%' });
    }
    this._qrN = N;
    return cells;
  }

  private runLoader() {
    const barEl = this.loadBarEl?.nativeElement;
    const stageEl = this.loadStageEl?.nativeElement;
    const frameEl = this.loadFrameEl?.nativeElement;
    const tcEl = this.loadTcEl?.nativeElement;
    const loaderEl = this.loaderEl?.nativeElement;
    const scanEl = this.loadScanEl?.nativeElement;
    const qrEl = this.loadQrEl?.nativeElement;
    const N = this._qrN;
    const total = this.qrTotal;
    const cells = qrEl ? qrEl.querySelectorAll<HTMLElement>('[data-qr]') : [];

    const stages: [number, string][] = [
      [0, 'Locating code'], [16, 'Aligning finder'], [34, 'Reading modules'],
      [56, 'Decoding payload'], [76, 'Verifying ECC'], [92, 'Unpacking portfolio'],
    ];

    this._loaded = document.readyState === 'complete';
    if (!this._loaded) {
      window.addEventListener('load', () => { this._loaded = true; }, { once: true });
    }

    let shown = 0;
    let target = 0;
    const MIN_MS = 2200;
    const start = performance.now();

    const tick = () => {
      const elapsed = performance.now() - start;
      const ramp = Math.min(90, (elapsed / MIN_MS) * 90);
      target = (this._loaded && elapsed >= MIN_MS) ? 100 : Math.min(ramp, 90);
      shown += (target - shown) * 0.12;
      if (target >= 100 && shown > 99.4) shown = 100;
      const p = Math.round(shown);

      // Scan line sweeps down the QR
      if (scanEl) scanEl.style.top = p + '%';

      // Reveal QR modules row by row as scan passes
      const revRow = Math.floor(p / 100 * N);
      if (revRow !== this._revRow) {
        this._revRow = revRow;
        cells.forEach(el => {
          const row = parseInt(el.getAttribute('data-row') || '0', 10);
          if (row <= revRow) el.style.opacity = '1';
        });
      }

      if (barEl) barEl.style.width = p + '%';
      if (frameEl) frameEl.textContent = String(Math.round(p / 100 * total)).padStart(3, '0');
      if (tcEl) tcEl.textContent = p < 100 ? 'DECODING…' : 'VERIFIED ✓';

      if (stageEl) {
        let label = stages[0][1];
        for (const [thr, txt] of stages) if (p >= thr) label = txt;
        if (stageEl.textContent !== label) stageEl.textContent = label;
      }

      if (p >= 100) {
        if (scanEl) scanEl.style.opacity = '0';
        if (loaderEl) {
          loaderEl.style.background = 'transparent';
          loaderEl.querySelectorAll<HTMLElement>('[data-hud]').forEach(h => { h.style.opacity = '0'; });
        }
        // Scatter QR cells outward
        cells.forEach(el => {
          const ang = Math.random() * Math.PI * 2;
          const dist = 320 + Math.random() * 760;
          const dx = Math.cos(ang) * dist;
          const dy = Math.sin(ang) * dist;
          const rot = (Math.random() * 2 - 1) * 240;
          el.style.transition = 'transform .95s cubic-bezier(.22,1,.3,1), opacity .95s ease';
          el.style.transitionDelay = (Math.random() * 0.22).toFixed(3) + 's';
          el.style.transform = `translate(${dx.toFixed(0)}px,${dy.toFixed(0)}px) rotate(${rot.toFixed(0)}deg) scale(0)`;
          el.style.opacity = '0';
        });
        if (loaderEl) {
          loaderEl.style.pointerEvents = 'none';
          setTimeout(() => { if (loaderEl) loaderEl.style.display = 'none'; }, 1400);
        }
        // Resume hero intro animations
        this._introEls.forEach(([el]) => { el.style.animationPlayState = 'running'; });
        this._p = 0;
        this._last = performance.now();
        return;
      }
      this._loadRaf = requestAnimationFrame(tick);
    };
    this._loadRaf = requestAnimationFrame(tick);
  }

  private initMagnetic() {
    const root = this.rootEl?.nativeElement;
    if (!root) return;
    root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(el => {
      const mv = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2;
        const my = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${mx * 0.3}px,${my * 0.45}px)`;
      };
      const lv = () => { el.style.transform = 'translate(0,0)'; };
      el.addEventListener('mousemove', mv);
      el.addEventListener('mouseleave', lv);
      this._mag.push([el, mv, lv]);
    });
  }

  private initSpotlight() {
    const root = this.rootEl?.nativeElement;
    if (!root) return;
    this._spot = (e: MouseEvent) => {
      const r = root.getBoundingClientRect();
      const sp = this.spotEl?.nativeElement;
      if (sp) sp.style.transform = `translate3d(${e.clientX - r.left - 310}px,${e.clientY - r.top - 310}px,0)`;
    };
    root.addEventListener('mousemove', this._spot);
  }

  private initScrollReveal() {
    const root = this.rootEl?.nativeElement;
    if (!root) return;
    this._revealIO = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const el = en.target as HTMLElement;
          el.style.opacity = '1';
          el.style.transform = 'none';
          this._revealIO!.unobserve(el);
        }
      });
    }, { threshold: 0.12 });
    root.querySelectorAll<HTMLElement>('[data-reveal]').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(34px)';
      el.style.transition = 'opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)';
      const delay = el.getAttribute('data-delay');
      if (delay) el.style.transitionDelay = delay;
      this._revealIO!.observe(el);
    });
  }

  private startTimelineScrubber() {
    const DUR = 8;
    this._p = 0;
    this._last = performance.now();
    const loop = (t: number) => {
      const dt = (t - this._last) / 1000;
      this._last = t;
      if (this.isPlaying) {
        this._p = (this._p + dt / DUR) % 1;
      }
      const head = this.headEl?.nativeElement;
      if (head) head.style.left = (this._p * 100) + '%';
      const tc = this.tcEl?.nativeElement;
      if (tc) {
        const total = this._p * DUR;
        const s = Math.floor(total);
        const f = Math.floor((total - s) * 30);
        tc.textContent = `00:00:0${s}:${String(f).padStart(2, '0')}`;
      }
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  private initReelScroll() {
    const scEl = this.scrollerEl?.nativeElement;
    if (!scEl) return;
    this._onReelScroll = () => {
      const idx = Math.max(0, Math.min(4, Math.round(scEl.scrollTop / scEl.clientHeight)));
      if (idx !== this.activeReel) {
        this.zone.run(() => { this.activeReel = idx; });
      }
    };
    scEl.addEventListener('scroll', this._onReelScroll, { passive: true });
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    const knob = this.knobEl?.nativeElement;
    if (knob) knob.style.transform = this.isDark ? 'translateX(30px)' : 'translateX(0)';
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
  }

  toggleLike(i: number) {
    this.liked = [...this.liked];
    this.liked[i] = !this.liked[i];
  }

  doubleTap(i: number, e: MouseEvent | TouchEvent) {
    const now = Date.now();
    const reel = (e.currentTarget as HTMLElement);
    if (now - this._lastTap < 330) {
      this.liked = [...this.liked];
      this.liked[i] = true;
      const r = reel.getBoundingClientRect();
      const x = e instanceof MouseEvent ? e.clientX : (e as TouchEvent).touches[0].clientX;
      const y = e instanceof MouseEvent ? e.clientY : (e as TouchEvent).touches[0].clientY;
      const h = document.createElement('div');
      h.textContent = '♥';
      h.style.cssText = `position:absolute;left:${x - r.left}px;top:${y - r.top}px;transform:translate(-50%,-50%);font-size:96px;color:#ff3040;pointer-events:none;z-index:30;animation:heartPop .9s ease forwards;text-shadow:0 10px 34px rgba(0,0,0,.5)`;
      reel.appendChild(h);
      setTimeout(() => h.remove(), 900);
      this._lastTap = 0;
    } else {
      this._lastTap = now;
    }
  }

  toggleTrack(i: number) {
    this.nowPlaying = this.nowPlaying === i ? null : i;
  }

  setFilter(chip: string) {
    this.galleryFilter = chip;
  }

  scrollReel(dir: number) {
    const scEl = this.scrollerEl?.nativeElement;
    if (!scEl) return;
    const next = Math.max(0, Math.min(this.reelData.length - 1, this.activeReel + dir));
    scEl.scrollTo({ top: next * scEl.clientHeight, behavior: 'smooth' });
  }

  fmtLikes(n: number, liked: boolean): string {
    const count = n + (liked ? 1 : 0);
    return count >= 1000 ? (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(count);
  }

  onLinkEnter(e: MouseEvent) {
    (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
  }

  onLinkLeave(e: MouseEvent) {
    (e.currentTarget as HTMLElement).style.color = 'var(--text)';
  }

  scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
