// In-browser toy version of the Password Strength Auditor. Heuristics only —
// the real project adds HIBP k-anonymity checks and an empirical cracking
// simulator. Nothing here ever leaves the page.

const COMMON = new Set([
  'password', '123456', '12345678', '1234', '12345', '123456789', '1234567890', 'qwerty', 'abc123',
  '111111', '1234567', 'dragon', '123123', 'baseball', 'iloveyou', 'trustno1', 'sunshine', 'master',
  'welcome', 'shadow', 'ashley', 'football', 'jesus', 'michael', 'ninja', 'mustang', 'password1',
  'monkey', 'letmein', '696969', 'superman', '654321', '1qaz2wsx', 'qazwsx', 'princess', 'azerty',
  '000000', 'admin', 'letmein1', 'batman', 'login', 'starwars', 'hello', 'freedom', 'whatever',
  '666666', 'charlie', 'aa123456', 'donald', 'password123', 'qwerty123', '1q2w3e4r', 'zaq12wsx',
  'killer', 'hottie', 'loveme', '7777777', 'jordan', 'harley', 'robert', 'matthew', 'daniel',
  'andrew', 'lakers', 'andrea', 'buster', 'joshua', 'soccer', 'hockey', 'george', 'pepper',
  'thomas', 'jessica', 'amanda', 'jennifer', 'hunter', 'michelle', 'tigger', 'corvette', 'mercedes',
  'secret', 'summer', 'internet', 'samsung', 'ranger', 'computer', 'nicole', 'ginger', 'purple',
  'cookie', 'maggie', 'hannah', 'banana', 'orange', 'cheese', 'pokemon', 'pikachu', 'naruto',
  'minecraft', 'liverpool', 'chelsea', 'arsenal', 'asdfgh', 'zxcvbn', 'asdf1234', 'passw0rd',
  'p@ssw0rd', 'abc12345', 'qwertyuiop', '1q2w3e', 'iloveu', '123qwe', '123abc', 'a123456',
  '123321', '555555', '888888', 'lovely', 'jordan23', 'eminem', 'slipknot', 'metallica',
  'blink182', 'rockyou', 'flower', 'monster', 'justin', 'anthony', 'friends', 'butterfly',
  'gabriel', 'wizard', 'peanut', 'cooper', 'toyota', 'nirvana', 'chicken', 'diamond', 'scooter',
  'richard', 'yankees', 'ferrari', 'testing', 'test123', 'welcome1', 'guest', 'root', 'toor',
  'pass', 'love', 'god', 'winter', 'spring', 'autumn', 'london', 'england', 'united',
]);

const LEET: Record<string, string> = { '@': 'a', '4': 'a', '3': 'e', '1': 'l', '!': 'i', '0': 'o', '$': 's', '5': 's', '7': 't' };

const WALK_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890'];

export type PwResult = {
  bits: number;
  pool: number;
  verdict: 'critical' | 'weak' | 'fair' | 'strong' | 'excellent';
  score: 0 | 1 | 2 | 3 | 4;
  findings: string[];
  times: { label: string; value: string }[];
};

const normalizeLeet = (pw: string) =>
  pw
    .toLowerCase()
    .split('')
    .map((c) => LEET[c] ?? c)
    .join('');

function charPool(pw: string): number {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
  return pool || 26;
}

/** Longest run at each position of ascending/descending char codes or repeats. */
function sequencePenalty(pw: string, findings: string[]): number {
  let penalty = 0;
  let repeats = 0;
  let seqs = 0;
  for (let i = 1; i < pw.length; i++) {
    const d = pw.charCodeAt(i) - pw.charCodeAt(i - 1);
    if (d === 0) {
      penalty += 4;
      repeats++;
    } else if (d === 1 || d === -1) {
      penalty += 3.5;
      seqs++;
    }
  }
  if (repeats >= 2) findings.push('repeated characters');
  if (seqs >= 2) findings.push("character sequences ('abcd', '4321', …)");
  return penalty;
}

function keyboardWalkPenalty(pw: string, findings: string[]): number {
  const lower = pw.toLowerCase();
  let walked = 0;
  for (const row of WALK_ROWS) {
    const rev = row.split('').reverse().join('');
    for (let len = lower.length; len >= 4; len--) {
      for (let i = 0; i + len <= lower.length; i++) {
        const chunk = lower.slice(i, i + len);
        if (row.includes(chunk) || rev.includes(chunk)) {
          walked = Math.max(walked, len);
        }
      }
    }
  }
  if (walked >= 4) {
    findings.push(`keyboard walk (${walked} keys)`);
    return (walked - 2) * 5;
  }
  return 0;
}

function humanize(seconds: number): string {
  if (seconds < 1) return 'instant';
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 86400 * 365) return `${Math.round(seconds / 86400)} days`;
  const years = seconds / (86400 * 365);
  if (years < 1e3) return `${Math.round(years)} years`;
  if (years < 1e6) return `${Math.round(years / 1e3)}k years`;
  if (years < 1e9) return `${Math.round(years / 1e6)}M years`;
  if (years < 13.8e9) return `${Math.round(years / 1e9)}B years`;
  return 'older than the universe';
}

export function analyze(pw: string): PwResult {
  const findings: string[] = [];
  const pool = charPool(pw);
  let bits = pw.length * Math.log2(pool);

  const leet = normalizeLeet(pw);
  if (COMMON.has(pw.toLowerCase()) || COMMON.has(leet)) {
    bits = Math.min(bits, 8);
    findings.push('common password — dictionary hit in seconds');
  } else {
    for (const word of COMMON) {
      if (word.length >= 5 && leet.includes(word)) {
        bits -= 18;
        findings.push(`contains the common word '${word}'`);
        break;
      }
    }
    bits -= sequencePenalty(pw, findings);
    bits -= keyboardWalkPenalty(pw, findings);
    if (/(?:19|20)\d{2}/.test(pw)) {
      bits -= 8;
      findings.push('contains a year — a favourite of rule-based attacks');
    }
  }

  if (pw.length > 0 && pw.length < 8) findings.push('under 8 characters');
  if (pool <= 26 && pw.length > 0) findings.push('single character class');

  bits = Math.max(pw.length ? 1 : 0, bits);

  const score = bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
  const verdicts = ['critical', 'weak', 'fair', 'strong', 'excellent'] as const;

  // Average-case guesses: half the search space.
  const guesses = Math.pow(2, Math.max(bits - 1, 0));
  const times = [
    { label: 'online attack — throttled, 10/s', value: humanize(guesses / 10) },
    { label: 'offline — bcrypt, 10⁴/s', value: humanize(guesses / 1e4) },
    { label: 'offline — MD5 on a GPU, 10¹⁰/s', value: humanize(guesses / 1e10) },
  ];

  return { bits: Math.round(bits), pool, verdict: verdicts[score], score, findings, times };
}
