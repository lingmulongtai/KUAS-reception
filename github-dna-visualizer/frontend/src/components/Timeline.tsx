import { motion } from 'framer-motion';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { GitHubRepo } from '../types';
import { TranslationKey, translations } from '../i18n';

interface TimelineProps {
  repos: GitHubRepo[];
  lang: 'ja' | 'en';
}

function t(lang: 'ja' | 'en', key: TranslationKey): string {
  return translations[lang][key];
}

export function Timeline({ repos, lang }: TimelineProps) {
  // Aggregate by year
  const yearMap = new Map<number, { reposCreated: number; starsEarned: number; cumulative: number }>();

  for (const repo of repos) {
    const year = new Date(repo.created_at).getFullYear();
    const existing = yearMap.get(year) ?? { reposCreated: 0, starsEarned: 0, cumulative: 0 };
    yearMap.set(year, {
      reposCreated: existing.reposCreated + 1,
      starsEarned: existing.starsEarned + repo.stargazers_count,
      cumulative: 0,
    });
  }

  const years = Array.from(yearMap.entries())
    .sort(([a], [b]) => a - b);

  let cumulative = 0;
  const data = years.map(([year, stats]) => {
    cumulative += stats.reposCreated;
    return {
      year: String(year),
      [t(lang, 'reposCreated')]: stats.reposCreated,
      [t(lang, 'starsEarned')]: stats.starsEarned,
      cumulative,
    };
  });

  if (data.length === 0) {
    return (
      <motion.div
        className="bg-gh-surface border border-gh-border rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h3 className="text-lg font-bold text-white mb-4">📈 {t(lang, 'timelineSection')}</h3>
        <p className="text-gh-muted text-sm">{lang === 'ja' ? 'データがありません' : 'No data available'}</p>
      </motion.div>
    );
  }

  const reposCreatedKey = t(lang, 'reposCreated');
  const starsEarnedKey = t(lang, 'starsEarned');

  return (
    <motion.div
      className="bg-gh-surface border border-gh-border rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-lg font-bold text-white mb-6">
        📈 {t(lang, 'timelineSection')}
      </h3>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
            <XAxis dataKey="year" tick={{ fill: '#8b949e', fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fill: '#8b949e', fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8b949e', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}
            />
            <Legend formatter={(value) => <span style={{ color: '#c9d1d9', fontSize: '12px' }}>{value}</span>} />
            <Bar yAxisId="left" dataKey={reposCreatedKey} fill="#58a6ff" opacity={0.8} radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey={starsEarnedKey} fill="#bc8cff" opacity={0.8} radius={[4, 4, 0, 0]} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cumulative"
              stroke="#39d353"
              strokeWidth={2}
              dot={{ fill: '#39d353' }}
              name={lang === 'ja' ? '累計リポジトリ数' : 'Cumulative Repos'}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
