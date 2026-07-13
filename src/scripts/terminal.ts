import gsap from 'gsap';
import { projects } from '../data/projects';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const slug = (title: string) => title.toLowerCase().replace(/\s+/g, '-');

const HELP = [
  'available commands:',
  '  whoami         who is asking',
  '  projects       list selected work',
  "  open <name>    open a project (e.g. 'open stash')",
  '  skills         what I work with',
  '  cv             open the CV (PDF)',
  '  contact        how to reach me',
  '  nmap           scan rasslab.dev',
  '  sudo hire-me   you know what to do',
  '  clear, exit',
];

const NMAP = [
  'Starting Nmap 7.95 ( https://nmap.org )',
  'Nmap scan report for rasslab.dev',
  'PORT     STATE    SERVICE',
  '22/tcp   filtered ssh',
  '80/tcp   open     http → 301 https',
  '443/tcp  open     https',
  '1337/tcp open     hire-me',
  'Nmap done: 1 host scanned — no vulnerabilities, plenty of opportunities.',
];

const HIRE_ME = [
  '[sudo] password for guest: **********',
  'access granted.',
  '> initiating placement protocol (2026/27)',
  '> role: cybersecurity / software testing / IT',
  '> location: Liverpool (open to Manchester)',
  '> next step: rasselchioe@gmail.com',
];

const SKILLS = [
  'cybersecurity    password auditing, hashing & salting, entropy, HIBP k-anonymity',
  'testing          Playwright, pytest, JUnit, black-box & end-to-end',
  'full-stack       TypeScript, React, Node/Express, Prisma, SQL, Python',
];

const CONTACT = [
  'email      rasselchioe@gmail.com',
  'github     github.com/rasselchioe',
  'linkedin   linkedin.com/in/rassel-susanto-chioe',
  "cv         type 'cv' to open the PDF",
];

export function initTerminal() {
  const root = document.getElementById('terminal');
  const panel = document.getElementById('term-panel');
  const backdrop = document.getElementById('term-backdrop');
  const out = document.getElementById('term-out');
  const form = document.getElementById('term-form');
  const input = document.getElementById('term-input') as HTMLInputElement | null;
  if (!root || !panel || !backdrop || !out || !form || !input) return;

  let isOpen = false;
  let lastFocus: Element | null = null;
  const history: string[] = [];
  let hIndex = -1;

  const print = (lines: string[], cls = 'text-muted') => {
    for (const line of lines) {
      const div = document.createElement('div');
      div.className = cls;
      div.textContent = line || ' ';
      out.appendChild(div);
    }
    out.scrollTop = out.scrollHeight;
  };

  const openTerm = () => {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    root.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    window.dispatchEvent(new CustomEvent('rl:scroll-lock', { detail: true }));
    if (out.childElementCount === 0) {
      print(["rasslab shell — type 'help' to get started"], 'text-accent');
      print(['']);
    }
    if (!reduced()) {
      gsap.fromTo(panel, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: 'power4.out' });
      gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.35 });
    }
    input.focus();
  };

  const closeTerm = () => {
    if (!isOpen) return;
    isOpen = false;
    document.body.style.overflow = '';
    window.dispatchEvent(new CustomEvent('rl:scroll-lock', { detail: false }));
    const done = () => root.classList.add('hidden');
    if (reduced()) {
      done();
    } else {
      gsap.to(panel, { yPercent: 100, duration: 0.4, ease: 'power3.in', onComplete: done });
      gsap.to(backdrop, { opacity: 0, duration: 0.3 });
    }
    (lastFocus as HTMLElement | null)?.focus?.();
  };

  const openProject = (arg: string) => {
    if (!arg) return print(["usage: open <name> — try 'projects' for the list"]);
    const p = projects.find(
      (x) => x.n === arg || x.n === arg.padStart(2, '0') || slug(x.title).includes(arg.toLowerCase()),
    );
    if (!p) return print([`open: ${arg}: no such project — try 'projects'`]);
    if (!p.links.length) return print([`${slug(p.title)}: ${p.note ?? 'private'} — nothing public to open (yet)`]);
    print([`opening ${p.title} → ${p.links[0].href}`], 'text-accent');
    window.open(p.links[0].href, '_blank', 'noopener');
  };

  const run = (raw: string) => {
    const [cmd = '', ...rest] = raw.split(/\s+/);
    const arg = rest.join(' ');
    switch (cmd.toLowerCase()) {
      case 'help':
        return print(HELP);
      case 'whoami':
        return print([
          'guest (uid=1000)',
          'this site belongs to Rassel Chioe — BSc Computer Science (Year in',
          'Industry) at the University of Liverpool, cybersecurity focus.',
        ]);
      case 'projects':
      case 'ls':
        return print(projects.map((p) => `(${p.n}) ${slug(p.title).padEnd(26)} ${p.sub}`));
      case 'open':
        return openProject(arg);
      case 'skills':
        return print(SKILLS);
      case 'cv':
        print(['opening /cv.pdf'], 'text-accent');
        return window.open('/cv.pdf', '_blank', 'noopener');
      case 'cat':
        if (arg === 'cv.pdf') {
          print(['opening /cv.pdf'], 'text-accent');
          return window.open('/cv.pdf', '_blank', 'noopener');
        }
        return print([`cat: ${arg || 'file'}: try 'cat cv.pdf' or 'open <project>'`]);
      case 'contact':
      case 'socials':
        return print(CONTACT);
      case 'nmap':
        return print(NMAP);
      case 'sudo':
        if (arg.toLowerCase() === 'hire-me' || arg.toLowerCase() === 'hire me') return print(HIRE_ME, 'text-accent');
        return print(['guest is not in the sudoers file. This incident will be reported (to no one).']);
      case 'hire-me':
      case 'hire':
        return print(["try it with more conviction: 'sudo hire-me'"]);
      case 'rm':
        return print(['rm: permission denied — nice try though.']);
      case 'echo':
        return print([arg]);
      case 'clear':
        out.textContent = '';
        return;
      case 'exit':
      case 'q':
      case ':q':
        return closeTerm();
      case '':
        return;
      default:
        return print([`sh: ${cmd}: command not found — try 'help'`]);
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    input.value = '';
    print([`$ ${raw}`], 'text-ink');
    if (raw) {
      history.push(raw);
      hIndex = history.length;
      run(raw);
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault();
      hIndex = Math.max(0, hIndex - 1);
      input.value = history[hIndex] ?? '';
    } else if (e.key === 'ArrowDown' && history.length) {
      e.preventDefault();
      hIndex = Math.min(history.length, hIndex + 1);
      input.value = history[hIndex] ?? '';
    }
  });

  // Keep focus on the prompt — it's the only interactive element in the dialog.
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      input.focus();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      return closeTerm();
    }
    if (e.key !== '`' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
      if (t !== input) return; // literal backtick in other inputs (e.g. password demo)
      e.preventDefault();
      return closeTerm();
    }
    e.preventDefault();
    openTerm();
  });

  document.querySelectorAll<HTMLElement>('[data-terminal-open]').forEach((el) => {
    el.addEventListener('click', openTerm);
  });
  backdrop.addEventListener('click', closeTerm);
  panel.addEventListener('click', () => input.focus());
}
