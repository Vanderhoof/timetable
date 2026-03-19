/**
 * Edit distance utilities for fuzzy name matching
 */

/**
 * Levenshtein distance between two strings (case-insensitive).
 */
export function editDistance(a: string, b: string): number {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  const m = s1.length;
  const n = s2.length;

  // dp[i][j] = edit distance between s1[0..i-1] and s2[0..j-1]
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Find the closest string in haystack to needle within maxDist (inclusive).
 * Returns the closest match, or null if no match within threshold.
 * If needle exactly matches a haystack entry, returns null (no suggestion needed).
 */
export function closestMatch(
  needle: string,
  haystack: string[],
  maxDist: number
): string | null {
  let best: string | null = null;
  let bestDist = maxDist + 1;

  for (const candidate of haystack) {
    if (candidate === needle) return null; // exact match — no suggestion needed
    const d = editDistance(needle, candidate);
    if (d <= maxDist && d < bestDist) {
      bestDist = d;
      best = candidate;
    }
  }

  return best;
}
