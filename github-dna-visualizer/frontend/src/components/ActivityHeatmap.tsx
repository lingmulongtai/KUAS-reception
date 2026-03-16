import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ContributionCalendar } from '../types';
import { classifyDeveloperType } from '../utils/typeClassifier';
import { TranslationKey, translations } from '../i18n';

interface ActivityHeatmapProps {
  calendar: ContributionCalendar;
  lang: 'ja' | 'en';
}

function t(lang: 'ja' | 'en', key: TranslationKey): string {
  return translations[lang][key];
}

function getHeatmapColor(count: number, max: number): string {
  if (count === 0) return '#161b22';
  const ratio = count / Math.max(max, 1);
  if (ratio < 0.25) return '#0e4429';
  if (ratio < 0.5) return '#006d32';
  if (ratio < 0.75) return '#26a641';
  return '#39d353';
}

export function ActivityHeatmap({ calendar, lang }: ActivityHeatmapProps) {
  const allDays = calendar.weeks.flatMap(w => w.contributionDays);
  const maxCount = Math.max(...allDays.map(d => d.contributionCount), 1);

  const dayOfWeekLabels = lang === 'ja'
    ? ['日', '月', '火', '水', '木', '金', '土']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const byDayOfWeek = dayOfWeekLabels.map((label, i) => ({
    name: label,
    count: allDays
      .filter(d => new Date(d.date).getDay() === i)
      .reduce((sum, d) => sum + d.contributionCount, 0),
  }));

  const developerType = classifyDeveloperType(allDays);
  const typeLabel = lang === 'ja' ? developerType.label_ja : developerType.label_en;
  const typeDesc = lang === 'ja' ? developerType.description_ja : developerType.description_en;

  const recentWeeks = calendar.weeks.slice(-26); // Last 6 months

  return (
    <motion.div
      className="bg-gh-surface border border-gh-border rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-lg font-bold text-white mb-4">
        📊 {t(lang, 'activitySection')}
      </h3>

      {/* Developer type badge */}
      <div className="mb-6 inline-flex items-center gap-2 px-3 py-2 bg-gh-bg border border-gh-border rounded-lg">
        <span className="text-2xl">{developerType.emoji}</span>
        <div>
          <p className="text-white font-bold text-sm">{typeLabel}</p>
          <p className="text-gh-muted text-xs">{typeDesc}</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto mb-6">
        {calendar.weeks.length > 0 ? (
          <div>
            <p className="text-gh-muted text-xs mb-2">
              {t(lang, 'totalContributions')}: <span className="text-gh-blue font-mono">{calendar.totalContributions.toLocaleString()}</span>
            </p>
            <div className="flex gap-1">
              {recentWeeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.contributionDays.map((day, di) => (
                    <div
                      key={di}
                      className="w-3 h-3 rounded-sm transition-colors hover:ring-1 hover:ring-gh-blue"
                      style={{ background: getHeatmapColor(day.contributionCount, maxCount) }}
                      title={`${day.date}: ${day.contributionCount} contributions`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gh-muted text-sm">
            {lang === 'ja' ? 'コントリビューションデータを取得するにはGitHub Tokenが必要です' : 'GitHub Token required to fetch contribution data'}
          </p>
        )}
      </div>

      {/* Day of week chart */}
      <div className="h-40">
        <p className="text-gh-muted text-xs mb-2">{lang === 'ja' ? '曜日別活動量' : 'Activity by day of week'}</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byDayOfWeek}>
            <XAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: 12 }} />
            <YAxis tick={{ fill: '#8b949e', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}
            />
            <Bar dataKey="count" fill="#58a6ff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
