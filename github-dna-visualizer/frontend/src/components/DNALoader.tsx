import { motion } from 'framer-motion';

interface DNALoaderProps {
  lang?: 'ja' | 'en';
}

export function DNALoader({ lang = 'ja' }: DNALoaderProps) {
  const strands = Array.from({ length: 10 }, (_, i) => i);
  const loadingText = lang === 'ja' ? 'DNA を解析中...' : 'Analyzing DNA...';

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative w-16 h-40 flex items-center justify-center">
        {strands.map((i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: i % 2 === 0 ? '#58a6ff' : '#bc8cff',
              top: `${i * 16}px`,
            }}
            animate={{
              x: [0, 40, 0, -40, 0],
              scale: [1, 0.8, 1, 0.8, 1],
              opacity: [1, 0.6, 1, 0.6, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.12,
              ease: 'easeInOut',
            }}
          />
        ))}
        {strands.map((i) => (
          <motion.div
            key={`r-${i}`}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: i % 2 === 0 ? '#bc8cff' : '#58a6ff',
              top: `${i * 16}px`,
            }}
            animate={{
              x: [0, -40, 0, 40, 0],
              scale: [1, 0.8, 1, 0.8, 1],
              opacity: [1, 0.6, 1, 0.6, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.12,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <motion.p
        className="text-gh-muted font-mono text-sm"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {loadingText}
      </motion.p>
    </div>
  );
}
