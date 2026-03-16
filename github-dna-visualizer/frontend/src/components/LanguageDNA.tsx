import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getLanguageColor } from '../utils/githubColors';
import { TranslationKey, translations } from '../i18n';

interface LanguageDNAProps {
  languageStats: Record<string, number>;
  lang: 'ja' | 'en';
}

function t(lang: 'ja' | 'en', key: TranslationKey): string {
  return translations[lang][key];
}

export function LanguageDNA({ languageStats, lang }: LanguageDNAProps) {
  const totalBytes = Object.values(languageStats).reduce((a, b) => a + b, 0);

  const data = Object.entries(languageStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, bytes]) => ({
      name,
      value: bytes,
      percentage: Math.round((bytes / Math.max(totalBytes, 1)) * 100),
      color: getLanguageColor(name),
    }));

  const top5 = data.slice(0, 5);

  return (
    <motion.div
      className="bg-gh-surface border border-gh-border rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-lg font-bold text-white mb-4">
        🧬 {t(lang, 'languageSection')}
      </h3>
      <p className="text-gh-muted text-sm mb-6">{t(lang, 'languageDNA')}</p>

      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-64 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}
                formatter={(value: number, name: string) => [
                  `${Math.round((value / Math.max(totalBytes, 1)) * 100)}%`,
                  name,
                ]}
              />
              <Legend
                formatter={(value) => <span style={{ color: '#c9d1d9', fontSize: '12px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          {top5.map((langItem, i) => (
            <motion.div
              key={langItem.name}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <span className="text-gh-muted font-mono text-sm w-4">{i + 1}</span>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: langItem.color }}
              />
              <span className="text-gh-text text-sm flex-1">{langItem.name}</span>
              <div className="flex-1 bg-gh-bg rounded-full h-2 max-w-32">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: langItem.color }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${langItem.percentage}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                />
              </div>
              <span className="text-gh-muted font-mono text-xs w-10 text-right">
                {langItem.percentage}%
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
