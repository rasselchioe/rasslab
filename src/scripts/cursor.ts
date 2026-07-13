import gsap from 'gsap';

// Interactive elements the ring reacts to. Delegated, so late-added DOM
// (e.g. the terminal) is covered without re-binding.
const HOVER_TARGETS = 'a, button, [role="button"], [data-cursor], summary, label';

export function initCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  const label = document.createElement('span');
  label.className = 'cursor-label';
  ring.appendChild(label);
  document.body.append(ring, dot);
  document.documentElement.classList.add('custom-cursor');

  gsap.set([dot, ring], { xPercent: -50, yPercent: -50, autoAlpha: 0 });

  const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power2.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power2.out' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3.out' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3.out' });

  let shown = false;
  window.addEventListener(
    'mousemove',
    (e) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      if (!shown) {
        shown = true;
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.25 });
      }
    },
    { passive: true },
  );

  document.documentElement.addEventListener('mouseleave', () => {
    shown = false;
    gsap.to([dot, ring], { autoAlpha: 0, duration: 0.25 });
  });

  window.addEventListener('mousedown', () => gsap.to(ring, { scale: 0.75, duration: 0.2 }));
  window.addEventListener('mouseup', () => gsap.to(ring, { scale: 1, duration: 0.35, ease: 'power3.out' }));

  // Hover + contextual label state, tracked via delegation.
  let current: Element | null = null;
  document.addEventListener('mouseover', (e) => {
    const target = (e.target as Element).closest?.(HOVER_TARGETS) ?? null;
    if (target === current) return;
    current = target;
    const text = target?.closest<HTMLElement>('[data-cursor]')?.dataset.cursor ?? '';
    label.textContent = text;
    ring.classList.toggle('cursor-ring--hover', !!target && !text);
    ring.classList.toggle('cursor-ring--label', !!text);
  });

  // Magnetic pull for tagged elements.
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = 0.35;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('mouseleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}
