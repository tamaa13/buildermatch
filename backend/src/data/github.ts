import { config } from "../config";
import { log } from "../util/log";
import type { GithubStats } from "../types";

// Public GitHub REST. Unauthenticated gets 60 req/hour; GITHUB_TOKEN lifts it
// to 5000/hour. Nothing here needs write scope.
async function gh<T>(path: string): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      "user-agent": "memegard-backend/0.1",
      accept: "application/vnd.github+json",
    };
    if (config.githubToken) headers.authorization = `Bearer ${config.githubToken}`;
    const res = await fetch(`https://api.github.com${path}`, { headers });
    if (!res.ok) {
      if (res.status !== 404) log.warn("github api non-2xx", { path, status: res.status });
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    log.warn("github api failed", { path, err: String(e) });
    return null;
  }
}

export async function getGithubStats(username: string): Promise<GithubStats | null> {
  const user = await gh<{ public_repos: number; updated_at?: string }>(`/users/${username}`);
  if (!user) return null;

  // Pull top 30 most-recently-pushed repos to compute stars + languages.
  const repos = await gh<
    Array<{ stargazers_count: number; language: string | null; pushed_at: string }>
  >(`/users/${username}/repos?per_page=30&sort=pushed`);
  if (!repos) {
    return {
      username,
      publicRepos: user.public_repos,
      totalStars: 0,
      topLanguages: [],
      activeLast90d: false,
    };
  }

  const langCount = new Map<string, number>();
  let stars = 0;
  let latestPush = 0;
  for (const r of repos) {
    stars += r.stargazers_count;
    if (r.language) langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1);
    const t = Date.parse(r.pushed_at);
    if (Number.isFinite(t) && t > latestPush) latestPush = t;
  }
  const topLanguages = [...langCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => x[0]);
  const activeLast90d = latestPush > 0 && Date.now() - latestPush < 90 * 86_400_000;
  return { username, publicRepos: user.public_repos, totalStars: stars, topLanguages, activeLast90d };
}
