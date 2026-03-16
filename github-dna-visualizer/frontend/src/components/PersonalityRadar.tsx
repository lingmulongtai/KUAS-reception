import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import { PersonalityScores } from '../types';
import { TranslationKey, translations } from '../i18n';

interface PersonalityRadarProps {
  scores: PersonalityScores;
  lang: 'ja' | 'en';
  username?: string;
}

function t(lang: 'ja' | 'en', key: TranslationKey): string {
  return translations[lang][key];
}

export function PersonalityRadar({ scores, lang, username }: PersonalityRadarProps) {
  const data = [
    { subject: t(lang, 'creator'), value: scores.creator, fullMark: 100 },
    { subject: t(lang, 'collaborator'), value: scores.collaborator, fullMark: 100 },
    { subject: t(lang, 'communicator'), value: scores.communicator, fullMark: 100 },
    { subject: t(lang, 'maintainer'), value: scores.maintainer, fullMark: 100 },
    { subject: t(lang, 'explorer'), value: scores.explorer, fullMark: 100 },
  ];

  const topTrait = data.reduce((a, b) => a.value > b.value ? a : b);

  return (
    <motion.div
      className="bg-gh-surface border border-gh-border rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-lg font-bold text-white mb-4">
        🎯 {t(lang, 'personalitySection')}
      </h3>

      {username && (
        <p className="text-gh-muted text-sm mb-4">
          {lang === 'ja'
            ? `@${username} の開発スタイルは「${topTrait.subject}」が最も強い`
            : `@${username}'s strongest trait: "${topTrait.subject}"`}
        </p>
      )}

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#30363d" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#c9d1d9', fontSize: 12 }}
            />
            <Radar
              name={username ?? 'User'}
              dataKey="value"
              stroke="#58a6ff"
              fill="#58a6ff"
              fillOpacity={0.2}
              animationBegin={0}
              animationDuration={800}
            />
            <Tooltip
              contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}
              formatter={(value: number) => [`${value}/100`, '']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {data.map(item => (
          <div key={item.subject} className="text-center p-2 bg-gh-bg rounded-lg">
            <div className="text-lg font-bold font-mono gradient-text">{item.value}</div>
            <div className="text-xs text-gh-muted">{item.subject}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
