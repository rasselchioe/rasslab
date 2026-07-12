/**
 * Animated grid of "+" glyphs. Glyphs near the pointer brighten toward the
 * accent colour and grow slightly. Renders only while the pointer is active
 * and the canvas is on screen; reduced-motion users get a single static draw.
 */
export function initPlusGrid(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const GAP = 56;
  const ARM = 3.5;
  const RADIUS = 190;

  let w = 0;
  let h = 0;
  let pts: { x: number; y: number }[] = [];
  const pointer = { x: -9999, y: -9999, active: false };
  let energy = 0;
  let raf = 0;
  let onScreen = true;

  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    pts = [];
    const cols = Math.ceil(w / GAP);
    const rows = Math.ceil(h / GAP);
    for (let i = 0; i <= cols; i++) {
      for (let j = 0; j <= rows; j++) {
        pts.push({ x: i * GAP + GAP / 2, y: j * GAP + GAP / 2 });
      }
    }
    draw();
  }

  function draw() {
    ctx!.clearRect(0, 0, w, h);
    ctx!.lineWidth = 1;
    for (const p of pts) {
      const d = Math.hypot(p.x - pointer.x, p.y - pointer.y);
      const t = Math.max(0, 1 - d / RADIUS) * energy;
      const arm = ARM + t * 3;
      ctx!.strokeStyle =
        t > 0.02
          ? `rgba(198, 255, 74, ${0.1 + t * 0.65})`
          : 'rgba(242, 242, 239, 0.09)';
      ctx!.beginPath();
      ctx!.moveTo(p.x - arm, p.y);
      ctx!.lineTo(p.x + arm, p.y);
      ctx!.moveTo(p.x, p.y - arm);
      ctx!.lineTo(p.x, p.y + arm);
      ctx!.stroke();
    }
  }

  function loop() {
    if (!pointer.active) energy *= 0.92;
    draw();
    if ((pointer.active || energy > 0.02) && onScreen && !document.hidden) {
      raf = requestAnimationFrame(loop);
    } else {
      energy = 0;
      draw();
      raf = 0;
    }
  }

  function kick() {
    if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(loop);
  }

  resize();

  if (reduced) return; // static grid only

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 150);
  });

  const surface = canvas.parentElement ?? canvas;
  surface.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.active = true;
    energy = 1;
    kick();
  });
  surface.addEventListener('pointerleave', () => {
    pointer.active = false;
    kick();
  });

  new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? true;
    if (onScreen) kick();
  }).observe(canvas);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) kick();
  });
}
