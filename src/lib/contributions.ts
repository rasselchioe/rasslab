import https from 'node:https';

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

/**
 * Deliberately node:https rather than fetch. Node's fetch pools its socket, and
 * a pooled socket outliving the build makes `astro build` abort on teardown
 * with exit 127 — which silently skips `wrangler deploy` in the deploy script.
 * keepAlive:false closes the connection as soon as the response is read.
 */
function postGraphQL(token: string, body: string): Promise<string | null> {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.github.com',
        path: '/graphql',
        method: 'POST',
        agent: new https.Agent({ keepAlive: false }),
        timeout: 8000,
        headers: {
          Authorization: `bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': new TextEncoder().encode(body).length,
          'User-Agent': 'rasslab.dev build',
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          resolve(null);
          return;
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      },
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.end(body);
  });
}

type Calendar = { totalContributions: number; weeks: { contributionDays: Day[] }[] };

/**
 * GitHub's GraphQL replicas disagree: three back-to-back reads returned 125,
 * 120 and 121 for the same calendar. Replicas that lag are missing the most
 * recent contributions, so they under-report — the highest total is the
 * freshest view. Take the whole winning calendar, not just its number, so the
 * cells and the total always come from the same response.
 */
const SAMPLES = 3;

function parseCalendar(raw: string | null): Calendar | null {
  if (!raw) return null;
  try {
    const cal = JSON.parse(raw)?.data?.user?.contributionsCollection?.contributionCalendar;
    return cal?.weeks?.length ? cal : null;
  } catch {
    return null;
  }
}

function toCells(weeks: { contributionDays: Day[] }[]): HeatmapCell[] {
  const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const cells: HeatmapCell[] = [];

  // The calendar's first week is partial. The grid flows down each column over
  // seven fixed rows, so a short first column would pull every later week up
  // with it — pad the missing days out instead.
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
  return cells;
}

export async function getContributions(): Promise<Contributions | null> {
  // Vite exposes .env files; a shell-exported variable only reaches process.env.
  const token =
    import.meta.env.GITHUB_TOKEN ??
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
      ?.GITHUB_TOKEN;
  if (!token) return null;

  try {
    const body = JSON.stringify({ query: QUERY, variables: { login: LOGIN } });
    const samples = await Promise.all(Array.from({ length: SAMPLES }, () => postGraphQL(token, body)));

    let freshest: Calendar | null = null;
    for (const raw of samples) {
      const cal = parseCalendar(raw);
      if (cal && (!freshest || cal.totalContributions > freshest.totalContributions)) freshest = cal;
    }
    if (!freshest) return null;

    return { total: freshest.totalContributions ?? 0, cells: toCells(freshest.weeks) };
  } catch {
    // Offline, rate-limited, bad token — the build carries on without the card.
    return null;
  }
}
