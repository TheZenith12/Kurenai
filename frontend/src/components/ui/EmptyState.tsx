'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center py-20 px-6"
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 blur-2xl opacity-40" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4), transparent 70%)' }} />
        <p className="empty-float relative text-6xl select-none">{icon}</p>
      </div>
      <p className="text-white/70 font-black text-lg">{title}</p>
      {description && <p className="text-white/35 text-sm mt-1.5 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
