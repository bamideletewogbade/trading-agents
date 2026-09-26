/**
 * The mindset page: what trading is and isn't, the noise-vs-signal game,
 * and the honest maths of "extra income". Numbers arrive formatted from the
 * page, which gets them from lib/engines.
 */

export const MINDSET = {
  meta: {
    title: 'Noise vs signal: the trader’s mindset',
    description:
      'Trading is a skill, not a lottery ticket. Learn to tell noise from signal, why protecting the downside comes first, and what honest extra income looks like.',
  },
  hero: {
    kicker: 'The trader’s mindset',
    titleLead: 'Most of what moves is',
    titleGold: 'noise.',
    lead: 'The market talks all day. WhatsApp talks louder. People who last in this learn to ignore almost all of it, and act on the little that matters. That’s a skill, and you can practise it.',
  },

  filter: {
    kicker: 'Try it',
    title: 'Turn the noise down',
    lead: 'The grey line is a made-up price: a slow climb buried under daily wobble. Slide the filter (a moving average) and watch the real direction appear.',
    label: 'Filter length',
    days: (n: number) => (n === 1 ? 'Off' : `${n} days`),
    price: 'Price',
    line: 'Filtered',
    turns: (price: number, filtered: number) =>
      `The price changed direction ${price} times. Your filtered line: ${filtered}.`,
    tradeoff:
      'Longer is calmer, but slower to notice a real turn. Every filter trades noise for delay. That trade-off is what the Technical Analysis stage is about.',
  },

  game: {
    kicker: 'Play',
    title: 'Noise or signal?',
    lead: 'Eight things you’ll see this month. Tap what you think each one is.',
    noise: 'Noise',
    signal: 'Signal',
    right: 'Right',
    wrong: 'Not quite',
    next: 'Next',
    score: (right: number) => `${right} right`,
    final: (right: number, total: number) => `${right} of ${total}`,
    done: (right: number, total: number) =>
      right === total
        ? `All ${total}. You already think like a trader. Now practise it on real charts.`
        : `${right} of ${total}. The ones you missed are exactly what the roadmap trains.`,
    again: 'Play again',
    cards: [
      {
        text: 'WhatsApp broadcast: “🚀 This coin will 10× by Friday. Last chance to enter!!”',
        answer: 'noise',
        why: 'Urgency, a promised return, and no reason given. Three red flags in one line.',
      },
      {
        text: 'The central bank raises its policy rate by 2 points.',
        answer: 'signal',
        why: 'Rates change what money costs everywhere: loans, bonds, the currency, company profits.',
      },
      {
        text: 'A stock you follow fell 2% today, on no news.',
        answer: 'noise',
        why: 'Prices wobble every day. One move with no reason behind it tells you very little.',
      },
      {
        text: 'A company reports profit down 40% on last year.',
        answer: 'signal',
        why: 'A share is a claim on a company’s profits. A 40% fall is real information.',
      },
      {
        text: 'Someone on X posts a screenshot of ₦2 million profit from one trade.',
        answer: 'noise',
        why: 'You see one win. Not the losses, the account size, or whether it even happened.',
      },
      {
        text: 'A new FX policy is announced and the naira moves sharply.',
        answer: 'signal',
        why: 'A policy change shifts the rules everyone trades under. Anything priced in naira feels it.',
      },
      {
        text: 'Your friend says: “Everybody is buying. You’ll miss out.”',
        answer: 'noise',
        why: 'That’s FOMO, the fear of missing out. It’s a feeling, not information, and it’s the most expensive one in trading.',
      },
      {
        text: 'An IPO prospectus lists oil prices and currency swings as key risks.',
        answer: 'signal',
        why: 'A company telling you what could go wrong is some of the most useful reading there is.',
      },
    ] as const,
  },

  principles: {
    kicker: 'How traders who last think',
    items: [
      [
        'It’s a skill, not a lottery ticket',
        'Skills are practised, measured and improved. That’s why you practise here, where mistakes cost nothing.',
      ],
      [
        'Protect the downside first',
        'Before “how much can I make?”, ask “where am I wrong, and what does it cost?” Every lesson asks it.',
      ],
      [
        'Judge the decision, not the result',
        'A good trade can lose. A reckless one can win. Over a hundred trades, only the good decisions add up.',
      ],
      [
        'Most days, do nothing',
        'Waiting for a setup that fits your plan is part of the job, not a failure to act.',
      ],
      [
        'Size small, stay in the game',
        'Risking a little on each trade means no single loss can end you.',
      ],
    ] as const,
  },

  honest: {
    kicker: 'Extra income, honestly',
    title: 'What a good month looks like, and what a scheme promises',
    good: (rate: string, capital: string, gain: string) =>
      `A strong month for a skilled trader might be around ${rate}. On ${capital}, that’s ${gain}. Real, but not life-changing on its own, and some months are negative.`,
    scheme: (rate: string, capital: string, result: string) =>
      `A scheme promising ${rate} a month is claiming ${capital} becomes ${result} in a year. If anyone could do that, they wouldn’t need your money.`,
    point:
      'The real edge isn’t a secret strategy. It’s skill, patience, and not losing big. That grows slowly, and it lasts.',
  },

  cta: {
    title: 'Ready to practise?',
    primary: 'Start free',
    secondary: 'See the roadmap',
  },
} as const;
