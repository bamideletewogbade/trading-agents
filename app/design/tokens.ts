/**
 * What the specimen page shows. The values repeat app/globals.css, and the
 * contrast figures are the ones measured for docs/design-brief.md §3; the
 * page is for judging them on a phone, not a second source of truth.
 */

export const SURFACES = [
  { name: 'ink', hex: '#0A0C10', role: 'Page', swatch: 'bg-ink' },
  {
    name: 'panel',
    hex: '#12161C',
    role: 'Cards, sheets, charts',
    swatch: 'bg-panel',
  },
  {
    name: 'raised',
    hex: '#1A1F27',
    role: 'Inputs, pressed',
    swatch: 'bg-raised',
  },
  { name: 'line', hex: '#262D38', role: 'Hairlines', swatch: 'bg-line' },
  {
    name: 'edge',
    hex: '#65707F',
    role: 'Control borders · 3.6:1',
    swatch: 'bg-edge',
  },
] as const;

export const INKS = [
  {
    name: 'fg',
    hex: '#E9EDF2',
    role: 'Primary text · 15.4:1',
    text: 'text-fg',
  },
  {
    name: 'fg-2',
    hex: '#AEB6C2',
    role: 'Secondary text · 8.9:1',
    text: 'text-fg-2',
  },
  {
    name: 'muted',
    hex: '#848D9C',
    role: 'Lowest readable grey · 5.4:1',
    text: 'text-muted',
  },
  {
    name: 'gold',
    hex: '#EBAE3F',
    role: 'You, look here · 9.2:1',
    text: 'text-gold',
  },
  {
    name: 'gain',
    hex: '#2BC4A0',
    role: 'Gain, with ▲ and a word · 8.2:1',
    text: 'text-gain',
  },
  {
    name: 'loss',
    hex: '#F2735F',
    role: 'Loss, with ▼ and a word · 6.4:1',
    text: 'text-loss',
  },
  {
    name: 'info',
    hex: '#6AA2F0',
    role: 'Information, simulation · 7.0:1',
    text: 'text-info',
  },
] as const;

export const SERIES = [
  { slot: 1, hex: '#C98500', role: 'You', swatch: 'bg-series-1' },
  { slot: 2, hex: '#3987E5', role: 'What if', swatch: 'bg-series-2' },
  { slot: 3, hex: '#199E70', role: '', swatch: 'bg-series-3' },
  { slot: 4, hex: '#9085E9', role: '', swatch: 'bg-series-4' },
  { slot: 5, hex: '#E66767', role: '', swatch: 'bg-series-5' },
  { slot: 6, hex: '#008300', role: '', swatch: 'bg-series-6' },
  { slot: 7, hex: '#D55181', role: '', swatch: 'bg-series-7' },
] as const;

export const TYPE_SCALE = [
  { name: 'hero', className: 'type-hero', sample: 'GH₵5.03 billion' },
  {
    name: 'display',
    className: 'type-display',
    sample: 'Let’s test how you think about money.',
  },
  { name: 'title', className: 'type-title', sample: 'Risk Lab' },
  {
    name: 'heading',
    className: 'type-heading',
    sample: 'The phone breaks on day 17',
  },
  {
    name: 'body',
    className: 'type-body',
    sample:
      'Rent is due in 10 days. Your mum asks for GH₵400. Wo ho te sɛn? Ẹ káàárọ̀.',
  },
  {
    name: 'small',
    className: 'type-small',
    sample: '₦2,500 · KSh 250 · GH₵1,250.50 · l1I 0O',
  },
  { name: 'label', className: 'type-label', sample: 'Months of cover' },
] as const;
