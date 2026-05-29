/** Tailwind v3 build config. Replaces the runtime cdn.tailwindcss.com script.
 *  Theme is the union of every inline `tailwind.config` that was embedded per page
 *  (all pages shared identical values; this is the superset from index.html).
 *  Re-run `npm run build:css` (see package.json) after adding new utility classes,
 *  otherwise newly-used classes will not be in assets/tailwind.css. */
module.exports = {
  content: ['./**/*.html', './assets/**/*.js'],
  // Blog rich-text uses these arbitrary-variant classes with HTML-encoded "&amp;".
  // The build scans raw HTML (encoded), so it would emit the wrong selector; the old
  // Play CDN scanned the decoded DOM. Safelist the decoded forms so list spacing holds.
  safelist: [
    '[&>li]:mt-2',
    '[&:not(:last-child)_ol]:pb-1',
    '[&:not(:last-child)_ul]:pb-1',
    '[&_>_*]:min-w-0',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FDFBF7',
        'cream-dark': '#F5F0E8',
        amber: {
          warm: '#C4841D',
          deep: '#8B5E14',
          light: '#E8A84C',
          glow: '#F4C77D',
        },
        charcoal: '#1A1714',
        'warm-gray': {
          100: '#F7F4EF',
          200: '#EDE8DF',
          300: '#D9D1C4',
          400: '#B8AD9E',
          500: '#8C8175',
          600: '#5A5249',
          700: '#4A4239',
          800: '#2E2822',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
};
