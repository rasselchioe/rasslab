/**
 * GitHub contribution calendar, fetched once at build time.
 *
 * The token never reaches the browser — this runs in Astro frontmatter during
 * `astro build`. Set GITHUB_TOKEN (a PAT with `read:user`) in `.env` or the
 * build shell; without it, or if the call fails, this returns null and the
 * heatmap card is simply not rendered. A portfolio should not show invented
 * activity, so there is deliberately no synthetic fallback.
 */

const LOGIN = 'rasselchioe';

/** `label: null` marks a spacer cell (see the partial-first-week note below). */
export type HeatmapCell = { level: number; label: string | null };

export type Contributions = {
  total: number;
  cells: HeatmapCell[];
};

const LEVELS: Record<string, number> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const QUERY = `query ($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

type Day = { date: string; contributionCount: number; contributionLevel: string };

export async function getContributions(): Promise<Contributions | null> {
  // Vite exposes .env files; a shell-exported variable only reaches process.env.
  const token =
    import.meta.env.GITHUB_TOKEN ??
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
      ?.GITHUB_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'rasslab.dev build',
      },
      body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const json = await res.json();
    const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar;
    const weeks: { contributionDays: Day[] }[] = calendar?.weeks ?? [];
    if (!weeks.length) return null;

    const fmt = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const cells: HeatmapCell[] = [];

    // The calendar's first week is partial. The grid flows down each column
    // over seven fixed rows, so a short first column would pull every later
    // week up with it — pad the missing days out instead.
    const lead = 7 - (weeks[0]?.contributionDays.length ?? 7);
    for (let i = 0; i < lead; i++) cells.push({ level: 0, label: null });

    for (const week of weeks) {
      for (const day of week.contributionDays) {
        const n = day.contributionCount;
        cells.push({
          level: LEVELS[day.contributionLevel] ?? 0,
          label: `${n} contribution${n === 1 ? '' : 's'} · ${fmt.format(new Date(day.date))}`,
        });
      }
    }

    return { total: calendar.totalContributions ?? 0, cells };
  } catch {
    // Offline, rate-limited, bad token — the build carries on without the card.
    return null;
  }
}
