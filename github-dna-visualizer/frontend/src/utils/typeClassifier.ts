import { ContributionDay } from '../types';

export type DeveloperType = 'night-owl' | 'early-bird' | 'weekend-warrior' | 'all-day' | 'balanced';

export interface DeveloperTypeInfo {
  type: DeveloperType;
  label_ja: string;
  label_en: string;
  emoji: string;
  description_ja: string;
  description_en: string;
}

export function classifyDeveloperType(days: ContributionDay[]): DeveloperTypeInfo {
  const byDayOfWeek = new Array(7).fill(0);

  for (const day of days) {
    const d = new Date(day.date);
    byDayOfWeek[d.getDay()] += day.contributionCount;
  }

  const weekdayTotal = byDayOfWeek.slice(1, 6).reduce((a, b) => a + b, 0);
  const weekendTotal = byDayOfWeek[0] + byDayOfWeek[6];
  const total = weekdayTotal + weekendTotal;

  if (total === 0) {
    return {
      type: 'balanced',
      label_ja: 'バランス型',
      label_en: 'Balanced',
      emoji: '⚖️',
      description_ja: 'コントリビューションデータがありません',
      description_en: 'No contribution data available',
    };
  }

  const weekendRatio = weekendTotal / total;

  if (weekendRatio > 0.5) {
    return {
      type: 'weekend-warrior',
      label_ja: '週末戦士',
      label_en: 'Weekend Warrior',
      emoji: '⚔️',
      description_ja: '週末に集中してコードを書くタイプ',
      description_en: 'Prefers to code intensely on weekends',
    };
  }

  // Since we don't have hourly data from REST API, classify by weekday pattern
  const maxDay = byDayOfWeek.indexOf(Math.max(...byDayOfWeek));

  if (maxDay === 1 || maxDay === 2) {
    return {
      type: 'early-bird',
      label_ja: '朝型エンジニア',
      label_en: 'Early Bird',
      emoji: '🌅',
      description_ja: '週の初めに活発にコードを書くタイプ',
      description_en: 'Most active at the start of the week',
    };
  }

  if (maxDay === 4 || maxDay === 5) {
    return {
      type: 'night-owl',
      label_ja: '夜型エンジニア',
      label_en: 'Night Owl',
      emoji: '🦉',
      description_ja: '週の終わりに向けて活発になるタイプ',
      description_en: 'Gets more active toward end of week',
    };
  }

  return {
    type: 'all-day',
    label_ja: '常時稼働型',
    label_en: 'All-Day Coder',
    emoji: '💻',
    description_ja: '曜日を問わず安定してコードを書くタイプ',
    description_en: 'Consistently contributes throughout the week',
  };
}
