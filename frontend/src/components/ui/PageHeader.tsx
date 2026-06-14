'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type Accent = 'purple' | 'cyan' | 'amber' | 'red' | 'green';

const ACCENTS: Record<Accent, { from: string; pillBg: string; pillText: string; pillBorder: string; border: string }> = {
  purple: { from: 'rgba(168,85,247,0.12)', pillBg: 'rgba(168,85,247,0.15)', pillText: '#d8b4fe', pillBorder: 'rgba(168,85,247,0.3)', border: 'rgba(168,85,247,0.2)' },
  cyan:   { from: 'rgba(6,182,212,0.12)',  pillBg: 'rgba(6,182,212,0.15)',  pillText: '#67e8f9', pillBorder: 'rgba(6,182,212,0.3)',  border: 'rgba(6,182,212,0.2)'  },
  amber:  { from: 'rgba(245,158,11,0.12)', pillBg: 'rgba(245,158,11,0.15)', pillText: '#fbbf24', pillBorder: 'rgba(245,158,11,0.3)', border: 'rgba(245,158,11,0.2)' },
  red:    { from: 'rgba(220,38,38,0.12)',  pillBg: 'rgba(220,38,38,0.15)',  pillText: '#fca5a5', pillBorder: 'rgba(220,38,38,0.3)',  border: 'rgba(220,38,38,0.2)'  },
  green:  { from: 'rgba(16,185,129,0.12)', pillBg: 'rgba(16,185,129,0.15)', pillText: '#6ee7b7', pillBorder: 'rgba(16,185,129,0.3)', border: 'rgba(16,185,129,0.2)' },
};

export function PageHeader({
  pill,
  title,
  subtitle,
  accent = 'purple',
  right,
}: {
  pill: string;
  title: string;
  subtitle?: string;
  accent?: Accent;
  right?: ReactNode;
}) {
  const a = ACCENTS[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="page-header-glow relative overflow-hidden rounded-2xl p-5"
      style={{ background: `linear-gradient(135deg, ${a.from} 0%, rgba(0,0,0,0) 70%)`, border: `1px solid ${a.border}` }}
    >
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="section-pill mb-2 inline-flex" style={{ background: a.pillBg, color: a.pillText, border: `1px solid ${a.pillBorder}` }}>
            {pill}
          </span>
          <h1 className="text-2xl font-black text-white mt-1 leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-white/40 mt-0.5">{subtitle}</p>}
        </div>
        {right && <div className="flex-shrink-0">{right}</div>}
      </div>
    </motion.div>
  );
}
