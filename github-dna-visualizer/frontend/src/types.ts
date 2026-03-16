export interface GitHubUser {
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

export interface GitHubRepo {
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

export interface GitHubEvent {
  type: string;
  created_at: string;
  payload: Record<string, unknown>;
}

export interface ContributionDay {
  contributionCount: number;
  date: string;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface ContributionsCollection {
  contributionCalendar: ContributionCalendar;
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
}

export interface GraphQLRepo {
  name: string;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string; color: string } | null;
  createdAt: string;
  updatedAt: string;
  description: string | null;
}

export interface GitHubData {
  user: GitHubUser;
  repos: GitHubRepo[];
  events: GitHubEvent[];
  languageStats: Record<string, number>;
  contributions: ContributionsCollection;
  graphqlRepos: GraphQLRepo[];
  rateLimit: {
    remaining: number | null;
    limit: number | null;
    reset: string | null;
  };
}

export interface PersonalityScores {
  creator: number;
  collaborator: number;
  communicator: number;
  maintainer: number;
  explorer: number;
}
