// Web-тай ижил dark cinematic theme
export const colors = {
  bg: '#020008',
  bgCard: 'rgba(4,0,10,0.60)',
  bgElevated: 'rgba(8,0,16,0.55)',
  border: 'rgba(255,255,255,0.08)',
  borderBright: 'rgba(220,38,38,0.35)',

  // Primary — red (web-тай ижил)
  primary: '#dc2626',
  primaryDark: '#991b1b',
  primaryLight: '#f87171',

  // Accent — gold/orange
  accent: '#ff6b35',
  accentGold: '#ffd700',
  accentBlue: '#38bdf8',

  gradient: ['#dc2626', '#b91c1c'] as [string, string],
  gradientDark: ['#7f1d1d', '#450a0a'] as [string, string],
  gradientGold: ['#ff8c00', '#ffd700'] as [string, string],
  gradientHero: ['#ff2020', '#cc0000'] as [string, string],

  // backward compat
  pink: '#ff6b35',
  pinkLight: '#ff8c5a',

  text: '#F0F0EE',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.35)',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#38bdf8',

  hp: {
    high: '#10B981',
    mid: '#F59E0B',
    low: '#EF4444',
  },

  rarity: {
    R: '#60A5FA',
    SR: '#A78BFA',
    SSR: '#F59E0B',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const font = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  hero: 32,
};
