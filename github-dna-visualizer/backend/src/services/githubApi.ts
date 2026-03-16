import fetch from 'node-fetch';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API = 'https://api.github.com';
const GITHUB_GRAPHQL = 'https://api.github.com/graphql';
const MAX_REPOS_FOR_LANGUAGE_STATS = 30;

// In-memory cache
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  }
  return headers;
}

interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  followers: number;
  following: number;
  location: string | null;
  company: string | null;
  blog: string | null;
  public_repos: number;
  created_at: string;
  updated_at: string;
}

interface GitHubRepo {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  fork: boolean;
  html_url: string;
}

interface GitHubEvent {
  type: string;
  created_at: string;
  payload: Record<string, unknown>;
}

interface ContributionDay {
  contributionCount: number;
  date: string;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface GraphQLData {
  user: {
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: number;
        weeks: ContributionWeek[];
      };
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalIssueContributions: number;
    };
    repositories: {
      nodes: Array<{
        name: string;
        stargazerCount: number;
        forkCount: number;
        primaryLanguage: { name: string; color: string } | null;
        createdAt: string;
        updatedAt: string;
        description: string | null;
      }>;
    };
  };
}

export interface AggregatedGitHubData {
  user: GitHubUser;
  repos: GitHubRepo[];
  events: GitHubEvent[];
  languageStats: Record<string, number>;
  contributions: GraphQLData['user']['contributionsCollection'];
  graphqlRepos: GraphQLData['user']['repositories']['nodes'];
  rateLimit: {
    remaining: number | null;
    limit: number | null;
    reset: string | null;
  };
}

async function fetchUser(username: string): Promise<{ user: GitHubUser; rateLimit: AggregatedGitHubData['rateLimit'] }> {
  const response = await fetch(`${GITHUB_API}/users/${username}`, { headers: getHeaders() });
  if (!response.ok) {
    if (response.status === 404) throw new Error(`User '${username}' not found`);
    if (response.status === 403) throw new Error('GitHub API rate limit exceeded');
    throw new Error(`GitHub API error: ${response.status}`);
  }
  const user = await response.json() as GitHubUser;
  return {
    user,
    rateLimit: {
      remaining: response.headers.get('x-ratelimit-remaining') ? Number(response.headers.get('x-ratelimit-remaining')) : null,
      limit: response.headers.get('x-ratelimit-limit') ? Number(response.headers.get('x-ratelimit-limit')) : null,
      reset: response.headers.get('x-ratelimit-reset'),
    },
  };
}

async function fetchRepos(username: string): Promise<GitHubRepo[]> {
  const response = await fetch(
    `${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated&type=all`,
    { headers: getHeaders() }
  );
  if (!response.ok) throw new Error(`Failed to fetch repos: ${response.status}`);
  return response.json() as Promise<GitHubRepo[]>;
}

async function fetchEvents(username: string): Promise<GitHubEvent[]> {
  const response = await fetch(
    `${GITHUB_API}/users/${username}/events?per_page=100`,
    { headers: getHeaders() }
  );
  if (!response.ok) return [];
  return response.json() as Promise<GitHubEvent[]>;
}

async function fetchLanguages(owner: string, repo: string): Promise<Record<string, number>> {
  const cacheKey = `lang:${owner}/${repo}`;
  const cached = getFromCache<Record<string, number>>(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/languages`,
    { headers: getHeaders() }
  );
  if (!response.ok) return {};
  const data = await response.json() as Record<string, number>;
  setCache(cacheKey, data);
  return data;
}

async function fetchGraphQL(username: string): Promise<GraphQLData> {
  const query = `
    query ($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
        }
        repositories(first: 100, orderBy: {field: STARGAZERS, direction: DESC}) {
          nodes {
            name
            stargazerCount
            forkCount
            primaryLanguage { name color }
            createdAt
            updatedAt
            description
          }
        }
      }
    }
  `;

  const response = await fetch(GITHUB_GRAPHQL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ query, variables: { login: username } }),
  });

  if (!response.ok) throw new Error(`GraphQL API error: ${response.status}`);
  const result = await response.json() as { data?: GraphQLData; errors?: Array<{ message: string }> };
  if (result.errors) throw new Error(result.errors[0].message);
  if (!result.data) throw new Error('No GraphQL data returned');
  return result.data;
}

export async function getAggregatedData(username: string): Promise<AggregatedGitHubData> {
  const cacheKey = `user:${username}`;
  const cached = getFromCache<AggregatedGitHubData>(cacheKey);
  if (cached) return cached;

  const [{ user, rateLimit }, repos, events] = await Promise.all([
    fetchUser(username),
    fetchRepos(username),
    fetchEvents(username),
  ]);

  // Fetch language stats for non-fork repos (limit to avoid rate limits)
  const nonForkRepos = repos.filter(r => !r.fork).slice(0, MAX_REPOS_FOR_LANGUAGE_STATS);
  const languageResults = await Promise.all(
    nonForkRepos.map(r => fetchLanguages(username, r.name))
  );
  const languageStats: Record<string, number> = {};
  for (const langs of languageResults) {
    for (const [lang, bytes] of Object.entries(langs)) {
      languageStats[lang] = (languageStats[lang] || 0) + bytes;
    }
  }

  // GraphQL data (optional - requires token for contributions)
  let graphqlData: GraphQLData | null = null;
  if (GITHUB_TOKEN) {
    try {
      graphqlData = await fetchGraphQL(username);
    } catch (e) {
      console.warn('GraphQL fetch failed, falling back to REST only:', e);
    }
  }

  const data: AggregatedGitHubData = {
    user,
    repos,
    events,
    languageStats,
    contributions: graphqlData?.user.contributionsCollection ?? {
      contributionCalendar: { totalContributions: 0, weeks: [] },
      totalCommitContributions: 0,
      totalPullRequestContributions: 0,
      totalIssueContributions: 0,
    },
    graphqlRepos: graphqlData?.user.repositories.nodes ?? [],
    rateLimit,
  };

  setCache(cacheKey, data);
  return data;
}
