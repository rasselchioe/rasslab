import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduced) {
  document.documentElement.classList.add('reduced-motion');
} else {
  document.documentElement.classList.add('motion');
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // --- Lenis smooth scroll, driven by the GSAP ticker ---
  const lenis = new Lenis({ autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Anchor navigation goes through Lenis so it stays smooth.
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href');
      if (!hash) return;
      const target = hash === '#top' ? 0 : document.querySelector<HTMLElement>(hash);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.2 });
      history.pushState(null, '', hash);
    });
  });

  // --- Parallax drift for decorative elements ---
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    const dist = parseFloat(el.dataset.parallax ?? '0');
    if (!dist) return;
    gsap.to(el, {
      y: dist,
      ease: 'none',
      scrollTrigger: {
        trigger: el.parentElement ?? el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });

  // --- Simple fade-up for blocks tagged data-fade ---
  gsap.utils.toArray<HTMLElement>('[data-fade]').forEach((el) => {
    gsap.from(el, {
      autoAlpha: 0,
      y: 28,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // --- Hero entrance (plays once the preloader hands over) ---
  const heroLines = gsap.utils.toArray<HTMLElement>('.hero-line');
  const heroFades = gsap.utils.toArray<HTMLElement>('[data-hero-fade]');
  const heroTl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });

  if (heroLines.length) {
    gsap.set(heroLines, { yPercent: 112 });
    gsap.set(heroFades, { autoAlpha: 0, y: 24 });
    heroTl
      .to(heroLines, { yPercent: 0, duration: 1.15, stagger: 0.12 }, 0.05)
      .to(heroFades, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.09 }, 0.5);
  }

  const boot = () => {
    lenis.start();
    heroTl.play();
  };
  if (window.__rlBooted) {
    boot();
  } else {
    lenis.stop(); // no scrolling behind the preloader
    window.addEventListener('rl:booted', boot, { once: true });
  }

  // --- Scroll-driven line reveals for anything tagged data-reveal ---
  // Wait for fonts so SplitText measures the real line breaks.
  document.fonts.ready.then(() => {
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
      gsap.from(split.lines, {
        yPercent: 112,
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.07,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });
    ScrollTrigger.refresh();
  });
}
