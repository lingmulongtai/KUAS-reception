import { GitHubData, PersonalityScores } from '../types';

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function calculatePersonalityScores(data: GitHubData): PersonalityScores {
  const { repos, contributions, graphqlRepos } = data;

  const ownRepos = repos.filter(r => !r.fork);
  const totalRepos = repos.length;

  // Creator: number of original repos
  const creator = clamp(Math.round((ownRepos.length / Math.max(totalRepos, 1)) * 100));

  // Collaborator: PR contributions + forks
  const totalForks = graphqlRepos.reduce((sum, r) => sum + r.forkCount, 0);
  const prContribs = contributions.totalPullRequestContributions;
  const collaborator = clamp(Math.round(
    (Math.min(prContribs, 200) / 200) * 50 +
    (Math.min(totalForks, 100) / 100) * 50
  ));

  // Communicator: issue contributions
  const issueContribs = contributions.totalIssueContributions;
  const communicator = clamp(Math.round(Math.min(issueContribs, 200) / 200 * 100));

  // Maintainer: update frequency
  const recentlyUpdated = repos.filter(r => {
    const updatedAt = new Date(r.updated_at);
    const monthsAgo = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo < 6;
  }).length;
  const commitContribs = contributions.totalCommitContributions;
  const maintainer = clamp(Math.round(
    (Math.min(recentlyUpdated, 10) / 10) * 40 +
    (Math.min(commitContribs, 500) / 500) * 60
  ));

  // Explorer: language diversity
  const languageSet = new Set(repos.map(r => r.language).filter(Boolean));
  const explorer = clamp(Math.round(Math.min(languageSet.size, 10) / 10 * 100));

  return { creator, collaborator, communicator, maintainer, explorer };
}
