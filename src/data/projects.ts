export type Project = {
  n: string;
  title: string;
  sub: string;
  desc: string;
  tags: string[];
  links: { label: string; href: string }[];
  note?: string;
  /** Renders the live password-strength demo inside this row. */
  demo?: boolean;
};

export const projects: Project[] = [
  {
    n: '01',
    title: 'Stash',
    sub: 'A personal finance tracker',
    desc: 'Track income and expenses, set monthly budgets and savings goals, and see where your money goes with clean analytics. Handles multiple currencies with live exchange rates, and reads bank-statement CSVs to auto-detect recurring charges and frequent stores — kept honest by 44 Playwright end-to-end tests.',
    tags: [
      'React',
      'TypeScript',
      'Vite',
      'Tailwind CSS',
      'Chart.js',
      'Node',
      'Express',
      'Prisma',
      'SQLite',
      'JWT auth',
      'Playwright',
    ],
    links: [
      { label: 'Live', href: 'https://stash.rasslab.dev' },
      { label: 'GitHub', href: 'https://github.com/rasselchioe/spending-tracker' },
    ],
  },
  {
    n: '02',
    title: 'Kadence',
    sub: 'Editorial cycling analytics for one rider',
    desc: 'A private, single-user GPX archive — a from-scratch parser computes distance, elevation, Normalized Power, per-kilometre splits and FIETS-style climb categories, rendered as an editorial dashboard where the MapLibre map and speed, heart-rate and power charts share one cursor. An archive, not a network.',
    tags: ['Next.js 15', 'TypeScript', 'Tailwind', 'MapLibre', 'Recharts', 'PostgreSQL', 'GPX parsing', 'Unit tests'],
    links: [{ label: 'GitHub', href: 'https://github.com/rasselchioe/kadence' }],
  },
  {
    n: '03',
    title: 'Photography Portfolio',
    sub: 'A cinematic photography exhibition',
    desc: 'A cinematic, exhibition-style photography portfolio with editorial motion — GSAP and Lenis-driven scenes, static export, and Cloudflare R2-ready images.',
    tags: ['Next.js 15', 'TypeScript', 'Tailwind v4', 'Framer Motion', 'GSAP', 'Lenis', 'Cloudflare R2'],
    links: [],
    note: 'private repo',
  },
  {
    n: '04',
    title: 'Password Strength Auditor',
    sub: 'Static analyser + cracking simulator',
    desc: 'Scores passwords across length, charset variety, keyboard walks, dictionary hits, entropy and HIBP k-anonymity — then proves the score empirically by cracking weak examples with dictionary, rule-mutation and bounded brute-force attacks over MD5, SHA and bcrypt, with timings.',
    tags: ['Python', 'Entropy estimation', 'HIBP k-anonymity', 'bcrypt vs MD5/SHA', 'Dictionary attacks', 'CLI'],
    links: [{ label: 'GitHub', href: 'https://github.com/rasselchioe/password-strength-auditor' }],
    demo: true,
  },
];
