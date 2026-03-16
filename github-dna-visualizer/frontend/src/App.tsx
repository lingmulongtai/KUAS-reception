import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileHeader } from './components/ProfileHeader';
import { LanguageDNA } from './components/LanguageDNA';
import { ActivityHeatmap } from './components/ActivityHeatmap';
import { StarDistribution } from './components/StarDistribution';
import { PersonalityRadar } from './components/PersonalityRadar';
import { Timeline } from './components/Timeline';
import { DNALoader } from './components/DNALoader';
import { ReadmeGenerator } from './components/ReadmeGenerator';
import { useGithubData } from './hooks/useGithubData';
import { useCardGenerator } from './hooks/useCardGenerator';
import { calculatePersonalityScores } from './utils/scoreCalculator';
import { Language, translations } from './i18n';
import { GitHubData } from './types';

function t(lang: Language, key: keyof typeof translations.ja): string {
  return translations[lang][key];
}

function VisualizerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState(searchParams.get('user') ?? '');
  const [inputValue, setInputValue] = useState(searchParams.get('user') ?? '');
  const [lang, setLang] = useState<Language>('ja');
  const { data, loading, error, fetchData } = useGithubData();
  const { generateCard } = useCardGenerator();

  const handleSearch = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setUsername(trimmed);
    setSearchParams({ user: trimmed });
    fetchData(trimmed);
  }, [fetchData, setSearchParams]);

  useEffect(() => {
    const urlUser = searchParams.get('user');
    if (urlUser && urlUser !== username) {
      setInputValue(urlUser);
      setUsername(urlUser);
      fetchData(urlUser);
    }
  // Only run on mount to initialize from URL params — intentionally omit deps to avoid re-fetch on navigation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scores = data ? calculatePersonalityScores(data) : null;

  return (
    <div className="min-h-screen bg-gh-bg">
      {/* Header */}
      <header className="border-b border-gh-border sticky top-0 z-50 bg-gh-bg/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧬</span>
            <span className="font-bold text-white hidden sm:inline">GitHub DNA Visualizer</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/compare')}
              className="px-3 py-1.5 text-xs border border-gh-border text-gh-muted rounded-lg hover:border-gh-blue hover:text-gh-blue transition-colors"
            >
              {t(lang, 'compareMode')}
            </button>
            <button
              onClick={() => setLang(l => l === 'ja' ? 'en' : 'ja')}
              className="px-3 py-1.5 text-xs border border-gh-border text-gh-muted rounded-lg hover:border-gh-blue hover:text-gh-blue transition-colors"
            >
              {lang === 'ja' ? 'EN' : 'JA'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="gradient-text">{t(lang, 'title')}</span>
          </motion.h1>
          <motion.p
            className="text-gh-muted text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {t(lang, 'subtitle')}
          </motion.p>
        </div>

        {/* Search */}
        <motion.div
          className="flex gap-2 mb-8 max-w-lg mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch(inputValue)}
            placeholder={t(lang, 'placeholder')}
            className="flex-1 bg-gh-surface border border-gh-border rounded-lg px-4 py-3 text-gh-text placeholder-gh-muted font-mono focus:outline-none focus:border-gh-blue transition-colors"
          />
          <button
            onClick={() => handleSearch(inputValue)}
            disabled={loading}
            className="px-6 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #58a6ff, #bc8cff)' }}
          >
            {loading ? t(lang, 'searching') : t(lang, 'search')}
          </button>
        </motion.div>

        {/* Rate limit indicator */}
        {data?.rateLimit.remaining !== null && data && (
          <div className="text-center mb-4">
            <span className="text-xs text-gh-muted font-mono">
              {t(lang, 'rateLimit')}: {data.rateLimit.remaining}/{data.rateLimit.limit} {t(lang, 'remaining')}
            </span>
          </div>
        )}

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div
              className="flex justify-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DNALoader lang={lang} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-red-400">❌ {error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {data && scores && !loading && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              <ProfileHeader user={data.user} lang={lang} />
              <LanguageDNA languageStats={data.languageStats} lang={lang} />
              <ActivityHeatmap calendar={data.contributions.contributionCalendar} lang={lang} />
              <StarDistribution repos={data.repos} lang={lang} />
              <PersonalityRadar scores={scores} lang={lang} username={data.user.login} />
              <Timeline repos={data.repos} lang={lang} />

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 justify-center pt-4">
                <button
                  onClick={() => generateCard(data, scores)}
                  className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #58a6ff, #bc8cff)' }}
                >
                  🖼️ {t(lang, 'generateCard')}
                </button>
                <ReadmeGenerator data={data} scores={scores} lang={lang} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!data && !loading && !error && (
          <motion.div
            className="text-center py-16 text-gh-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-6xl mb-4">🧬</p>
            <p className="text-lg">{lang === 'ja' ? 'ユーザー名を入力して解析を開始してください' : 'Enter a username to start analyzing'}</p>
          </motion.div>
        )}
      </main>

      <footer className="border-t border-gh-border mt-12 py-6 text-center text-gh-muted text-sm">
        <p>🧬 GitHub DNA Visualizer — Built with ❤️ using GitHub API</p>
      </footer>
    </div>
  );
}

function ComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [lang, setLang] = useState<Language>('ja');
  const [usernameA, setUsernameA] = useState(searchParams.get('a') ?? '');
  const [usernameB, setUsernameB] = useState(searchParams.get('b') ?? '');
  const [inputA, setInputA] = useState(searchParams.get('a') ?? '');
  const [inputB, setInputB] = useState(searchParams.get('b') ?? '');
  const dataA = useGithubData();
  const dataB = useGithubData();

  const handleCompare = useCallback(() => {
    const trimA = inputA.trim();
    const trimB = inputB.trim();
    if (!trimA || !trimB) return;
    setUsernameA(trimA);
    setUsernameB(trimB);
    dataA.fetchData(trimA);
    dataB.fetchData(trimB);
  }, [inputA, inputB, dataA, dataB]);

  useEffect(() => {
    const a = searchParams.get('a');
    const b = searchParams.get('b');
    if (a && b) {
      setInputA(a);
      setInputB(b);
      dataA.fetchData(a);
      dataB.fetchData(b);
    }
  // Only run on mount to initialize from URL params — intentionally omit deps to avoid re-fetch on navigation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scoresA = dataA.data ? calculatePersonalityScores(dataA.data) : null;
  const scoresB = dataB.data ? calculatePersonalityScores(dataB.data) : null;

  return (
    <div className="min-h-screen bg-gh-bg">
      <header className="border-b border-gh-border sticky top-0 z-50 bg-gh-bg/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="text-gh-muted hover:text-white transition-colors">
              ←
            </button>
            <span className="text-2xl">🧬</span>
            <span className="font-bold text-white hidden sm:inline">
              {lang === 'ja' ? '比較モード' : 'Compare Mode'}
            </span>
          </div>
          <button
            onClick={() => setLang(l => l === 'ja' ? 'en' : 'ja')}
            className="px-3 py-1.5 text-xs border border-gh-border text-gh-muted rounded-lg hover:border-gh-blue hover:text-gh-blue transition-colors"
          >
            {lang === 'ja' ? 'EN' : 'JA'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          <span className="gradient-text">{lang === 'ja' ? '開発者DNA比較' : 'Developer DNA Comparison'}</span>
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl mx-auto">
          <input
            type="text"
            value={inputA}
            onChange={e => setInputA(e.target.value)}
            placeholder={lang === 'ja' ? 'ユーザー1' : 'User 1'}
            className="flex-1 bg-gh-surface border border-gh-border rounded-lg px-4 py-3 text-gh-text placeholder-gh-muted font-mono focus:outline-none focus:border-gh-blue"
          />
          <span className="self-center text-gh-muted font-bold">VS</span>
          <input
            type="text"
            value={inputB}
            onChange={e => setInputB(e.target.value)}
            placeholder={lang === 'ja' ? 'ユーザー2' : 'User 2'}
            className="flex-1 bg-gh-surface border border-gh-border rounded-lg px-4 py-3 text-gh-text placeholder-gh-muted font-mono focus:outline-none focus:border-gh-blue"
          />
          <button
            onClick={handleCompare}
            disabled={dataA.loading || dataB.loading}
            className="px-6 py-3 rounded-lg font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #58a6ff, #bc8cff)' }}
          >
            {lang === 'ja' ? '比較' : 'Compare'}
          </button>
        </div>

        {(dataA.loading || dataB.loading) && (
          <div className="flex justify-center py-12"><DNALoader lang={lang} /></div>
        )}

        {dataA.data && dataB.data && scoresA && scoresB && !dataA.loading && !dataB.loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CompareColumn
              data={dataA.data}
              scores={scoresA}
              username={usernameA}
              lang={lang}
            />
            <CompareColumn
              data={dataB.data}
              scores={scoresB}
              username={usernameB}
              lang={lang}
            />
          </div>
        )}
      </main>
    </div>
  );
}

interface CompareColumnProps {
  data: GitHubData;
  scores: ReturnType<typeof calculatePersonalityScores>;
  username: string;
  lang: Language;
}

function CompareColumn({ data, scores, username, lang }: CompareColumnProps) {
  return (
    <div className="space-y-4">
      <ProfileHeader user={data.user} lang={lang} />
      <LanguageDNA languageStats={data.languageStats} lang={lang} />
      <PersonalityRadar scores={scores} lang={lang} username={username} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VisualizerPage />} />
        <Route path="/compare" element={<ComparePage />} />
      </Routes>
    </BrowserRouter>
  );
}
