import { Wifi, WifiOff } from 'lucide-react'

interface TopStatusBarProps {
  statusMessage: string
  connected: boolean
  slot?: React.ReactNode
}

export function TopStatusBar({ statusMessage, connected, slot }: TopStatusBarProps) {
  return (
    <div className="glass-panel glass-outline flex items-center justify-between gap-4 px-6 py-3">
      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-200">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/50 shadow-inner dark:bg-slate-900/60">
          {connected ? (
            <Wifi className="h-4 w-4 text-emerald-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-amber-400" />
          )}
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white shadow-lg">
            LIVE
          </span>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500/80 dark:text-slate-400">Reception Ops</p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{statusMessage}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs tracking-wide text-slate-500 dark:text-slate-400">
        {slot}
      </div>
    </div>
  )
}
