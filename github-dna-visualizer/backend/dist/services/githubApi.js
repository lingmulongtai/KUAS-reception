"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAggregatedData = getAggregatedData;
const node_fetch_1 = __importDefault(require("node-fetch"));
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API = 'https://api.github.com';
const GITHUB_GRAPHQL = 'https://api.github.com/graphql';
const MAX_REPOS_FOR_LANGUAGE_STATS = 30;
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
function getFromCache(key) {
    const entry = cache.get(key);
    if (!entry)
        return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}
function setCache(key, data) {
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}
function getHeaders() {
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
    };
    if (GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }
    return headers;
}
async function fetchUser(username) {
    const response = await (0, node_fetch_1.default)(`${GITHUB_API}/users/${username}`, { headers: getHeaders() });
    if (!response.ok) {
        if (response.status === 404)
            throw new Error(`User '${username}' not found`);
        if (response.status === 403)
            throw new Error('GitHub API rate limit exceeded');
        throw new Error(`GitHub API error: ${response.status}`);
    }
    const user = await response.json();
    return {
        user,
        rateLimit: {
            remaining: response.headers.get('x-ratelimit-remaining') ? Number(response.headers.get('x-ratelimit-remaining')) : null,
            limit: response.headers.get('x-ratelimit-limit') ? Number(response.headers.get('x-ratelimit-limit')) : null,
            reset: response.headers.get('x-ratelimit-reset'),
        },
    };
}
async function fetchRepos(username) {
    const response = await (0, node_fetch_1.default)(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated&type=all`, { headers: getHeaders() });
    if (!response.ok)
        throw new Error(`Failed to fetch repos: ${response.status}`);
    return response.json();
}
async function fetchEvents(username) {
    const response = await (0, node_fetch_1.default)(`${GITHUB_API}/users/${username}/events?per_page=100`, { headers: getHeaders() });
    if (!response.ok)
        return [];
    return response.json();
}
async function fetchLanguages(owner, repo) {
    const cacheKey = `lang:${owner}/${repo}`;
    const cached = getFromCache(cacheKey);
    if (cached)
        return cached;
    const response = await (0, node_fetch_1.default)(`${GITHUB_API}/repos/${owner}/${repo}/languages`, { headers: getHeaders() });
    if (!response.ok)
        return {};
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
}
async function fetchGraphQL(username) {
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
    const response = await (0, node_fetch_1.default)(GITHUB_GRAPHQL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ query, variables: { login: username } }),
    });
    if (!response.ok)
        throw new Error(`GraphQL API error: ${response.status}`);
    const result = await response.json();
    if (result.errors)
        throw new Error(result.errors[0].message);
    if (!result.data)
        throw new Error('No GraphQL data returned');
    return result.data;
}
async function getAggregatedData(username) {
    const cacheKey = `user:${username}`;
    const cached = getFromCache(cacheKey);
    if (cached)
        return cached;
    const [{ user, rateLimit }, repos, events] = await Promise.all([
        fetchUser(username),
        fetchRepos(username),
        fetchEvents(username),
    ]);
    // Fetch language stats for non-fork repos (limit to avoid rate limits)
    const nonForkRepos = repos.filter(r => !r.fork).slice(0, MAX_REPOS_FOR_LANGUAGE_STATS);
    const languageResults = await Promise.all(nonForkRepos.map(r => fetchLanguages(username, r.name)));
    const languageStats = {};
    for (const langs of languageResults) {
        for (const [lang, bytes] of Object.entries(langs)) {
            languageStats[lang] = (languageStats[lang] || 0) + bytes;
        }
    }
    // GraphQL data (optional - requires token for contributions)
    let graphqlData = null;
    if (GITHUB_TOKEN) {
        try {
            graphqlData = await fetchGraphQL(username);
        }
        catch (e) {
            console.warn('GraphQL fetch failed, falling back to REST only:', e);
        }
    }
    const data = {
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
