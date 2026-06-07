import { ReactNode } from 'react';
import { AlertTriangle, BarChart3, RadioTower } from 'lucide-react';
import type { ViewTab } from '../types';

interface LayoutProps {
  children: ReactNode;
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
}

const tabs: { id: ViewTab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'dashboard', label: '综合看板', icon: BarChart3 },
  { id: 'alerts', label: '异动报警', icon: AlertTriangle },
];

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#06b6d4,#10b981,#f59e0b)] shadow-lg shadow-cyan-500/10">
              <RadioTower className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none text-slate-100">PolyPulse</h1>
              <p className="mt-0.5 text-[11px] text-slate-500">Polymarket intelligence console</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-xs sm:flex">
            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-300">
              live
            </span>
            <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-400">
              xAPI linked
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
