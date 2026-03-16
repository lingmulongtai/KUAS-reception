import { motion } from 'framer-motion';
import { GitHubUser } from '../types';
import { TranslationKey, translations } from '../i18n';

interface ProfileHeaderProps {
  user: GitHubUser;
  lang: 'ja' | 'en';
}

function t(lang: 'ja' | 'en', key: TranslationKey): string {
  return translations[lang][key];
}

export function ProfileHeader({ user, lang }: ProfileHeaderProps) {
  const createdAt = new Date(user.created_at);
  const yearsActive = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365));

  return (
    <motion.div
      className="bg-gh-surface border border-gh-border rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <img
          src={user.avatar_url}
          alt={user.login}
          className="w-24 h-24 rounded-full ring-2 ring-gh-blue"
        />
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-white">{user.name ?? user.login}</h2>
          <p className="text-gh-muted font-mono">@{user.login}</p>
          {user.bio && <p className="mt-2 text-gh-text">{user.bio}</p>}

          <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-gh-muted">
            {user.location && (
              <span>📍 {user.location}</span>
            )}
            {user.company && (
              <span>🏢 {user.company}</span>
            )}
            {user.blog && (
              <a href={user.blog} target="_blank" rel="noopener noreferrer" className="text-gh-blue hover:underline">
                🔗 {user.blog}
              </a>
            )}
          </div>

          <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-6">
            <div className="text-center">
              <div className="text-xl font-bold font-mono gradient-text">{user.followers.toLocaleString()}</div>
              <div className="text-xs text-gh-muted">{t(lang, 'followers')}</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold font-mono gradient-text">{user.following.toLocaleString()}</div>
              <div className="text-xs text-gh-muted">{t(lang, 'following')}</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold font-mono gradient-text">{user.public_repos.toLocaleString()}</div>
              <div className="text-xs text-gh-muted">{t(lang, 'repos')}</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold font-mono gradient-text">{yearsActive}</div>
              <div className="text-xs text-gh-muted">{t(lang, 'yearsActive')}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
