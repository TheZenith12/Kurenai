/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Kurenai dark cinematic theme — matches landing page
        background:  '#020008',
        surface:     '#0a0012',
        'surface-2': '#100018',
        border:      'rgba(255,255,255,0.08)',
        primary: {
          DEFAULT:    '#8B5CF6',
          foreground: '#fff',
          glow:       '#A78BFA',
          dark:       '#6D28D9',
        },
        pink: {
          DEFAULT: '#EC4899',
          light:   '#F472B6',
        },
        accent: {
          DEFAULT: 'hsl(38, 100%, 58%)',
          blue:    'hsl(199, 100%, 58%)',
          red:     'hsl(355, 90%, 60%)',
          green:   'hsl(148, 72%, 50%)',
        },
        muted: {
          DEFAULT:    'hsl(224, 14%, 42%)',
          foreground: 'hsl(224, 12%, 58%)',
        },
        foreground:         'hsl(220, 20%, 95%)',
        'foreground-muted': 'hsl(224, 12%, 60%)',
      },
      fontFamily: {
        sans:  ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono:  ['var(--font-mono)', 'monospace'],
        anime: ['var(--font-anime)', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'glow-pulse':   'glowPulse 2s ease-in-out infinite alternate',
        'float':        'float 3s ease-in-out infinite',
        'skill-impact': 'skillImpact 0.5s ease-out',
        'slide-up':     'slideUp 0.3s ease-out',
        'fade-in':      'fadeIn 0.2s ease-out',
        'hp-shake':     'hpShake 0.4s ease-out',
        'energy-pulse': 'energyPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        glowPulse:  { '0%': { boxShadow:'0 0 8px hsl(258,90%,66%)' }, '100%': { boxShadow:'0 0 24px hsl(258,90%,66%), 0 0 48px hsl(258,90%,40%)' } },
        float:      { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-8px)' } },
        skillImpact:{ '0%': { transform:'scale(1)' }, '50%': { transform:'scale(1.5)' }, '100%': { transform:'scale(1)' } },
        slideUp:    { '0%': { transform:'translateY(20px)', opacity:'0' }, '100%': { transform:'translateY(0)', opacity:'1' } },
        fadeIn:     { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
        hpShake:    { '0%,100%': { transform:'translateX(0)' }, '25%': { transform:'translateX(-4px)' }, '75%': { transform:'translateX(4px)' } },
        energyPulse:{ '0%,100%': { opacity:'1' }, '50%': { opacity:'0.6' } },
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(124,58,237,0.5), 0 0 40px rgba(124,58,237,0.2)',
        'glow-yellow': '0 0 20px rgba(245,158,11,0.5)',
        'glow-red':    '0 0 20px rgba(239,68,68,0.5)',
        'glow-blue':   '0 0 20px rgba(6,182,212,0.5)',
        'glow-green':  '0 0 20px rgba(52,211,153,0.5)',
        'card':        '0 4px 24px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.04) inset',
        'card-hover':  '0 8px 40px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06) inset',
      },
    },
  },
  plugins: [],
};
