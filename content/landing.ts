/**
 * Every word on the landing page. Numbers never live here: a line that
 * needs one takes it as an argument, already calculated by an engine and
 * formatted (CLAUDE.md rule 1).
 */

export const LANDING = {
  hero: {
    eyebrow: 'For Ghana and Nigeria · Courses, signals and tools',
    titleLead: 'Learn to trade.',
    titleGold: 'Practise before you risk real money.',
    lead: 'Courses you play, from zero. Signals that show their reasons and their record. A journal that measures every trade. Start with pretend money. No get-rich-quick.',
    primary: 'Start free',
    secondary: 'Try a lesson here',
    promises: [
      'Start from zero',
      'Signals with reasons',
      'Pretend money first',
    ],
  },

  ask: {
    label: 'What do you want to understand?',
    placeholders: [
      'how an IPO works',
      'what RSI actually means',
      'why I keep getting stopped out',
      'how to read a chart',
      'is forex leverage dangerous?',
      'what moves the naira',
    ],
    go: 'Find it',
    hint: 'Type it your own way. We\u2019ll find the lessons.',
    none: 'Nothing on that yet. Try \u201ccharts\u201d, \u201crisk\u201d, \u201cIPO\u201d or \u201cRSI\u201d. Or start the first course.',
    results: (count: number) => (count === 1 ? '1 lesson' : `${count} lessons`),
    play: 'Play it now',
    open: 'See it in the courses',
  },

  demo: {
    label: 'Lesson · Support, candles and stops',
    stock: 'KOKO, a made-up cocoa company',
    steps: ['Read a candle', 'Find the floor', 'Plan the trade'],
    future: 'Not yet',
    candle: {
      title: 'Step through the candles',
      earlier: 'Earlier candle',
      later: 'Later candle',
      up: 'Up candle: buyers won',
      down: 'Down candle: sellers won',
      flat: 'Flat: nobody won',
      open: 'Open',
      high: 'High',
      low: 'Low',
      close: 'Close',
      body: 'Body',
      upperWick: 'Top wick',
      lowerWick: 'Bottom wick',
      wickNote: (lower: string) =>
        `The bottom wick is ${lower} long: price was pushed down there, and buyers pushed it back up before the candle closed.`,
      next: 'Next: find the floor',
    },
    floor: {
      title: 'Where do buyers keep stepping in?',
      prompt:
        'Price has turned back up from the same place more than once. Which line is it?',
      line: (key: string) => `Line ${key.toUpperCase()}`,
      right: (count: number, price: string) =>
        `Yes. Price fell to ${price} ${count} times and buyers stepped in every time. That floor is support.`,
      resistance: (count: number, price: string) =>
        `That's the ceiling: price rose to ${price} ${count} times and sellers pushed it back. It's resistance, the opposite of what we want. Try again.`,
      middle:
        'Price passed straight through this line in both directions. It didn’t hold anything. Try again.',
      reveal: 'Show me',
      next: 'Next: plan the trade',
    },
    plan: {
      title: 'Price is back at the floor. Plan the trade.',
      setup: (shares: number, entry: string) =>
        `You buy ${shares} shares at ${entry}. Before you do: where are you wrong?`,
      choices: {
        room: (price: string, risk: string) => ({
          label: `Below support, with room: ${price}`,
          detail: `Risks ${risk}`,
        }),
        tight: (price: string, risk: string) => ({
          label: `Right under the line: ${price}`,
          detail: `Risks ${risk}`,
        }),
        none: () => ({
          label: 'No stop. I’ll watch it.',
          detail: 'Risks: nobody knows',
        }),
      },
      go: 'Show what happened',
      pick: 'Pick a stop first',
      other: {
        bounce: 'Replay: what if support broke?',
        break: 'Replay: what if support held?',
      },
      again: 'Try a different stop',
      fresh: 'New chart',
      compare: 'Same chart, every plan',
      stopped: 'Stopped out',
      held: 'Still holding',
      ended: {
        bounce: 'Support held',
        break: 'Support broke',
      },
    },
  },

  /** The coach's lines after the chart lesson, by ending and stop. Numbers come in formatted. */
  planCoach: {
    bounce: {
      room: (pnl: string, risk: string) =>
        `Support held, and your stop had room for the wick. You risked ${risk} and made ${pnl}. That’s a plan working.`,
      tight: (low: string, stop: string) =>
        `You were right about support and still lost. The first candle dipped to ${low} and took your stop at ${stop} before buyers stepped in. A stop goes past the noise, not on the line.`,
      none: (pnl: string, worst: string) =>
        `It worked, this time: ${pnl}. But at the worst moment you were ${worst} with no plan for it going further. Replay the break.`,
    },
    break: {
      room: (loss: string) =>
        `Support broke and your stop sold at the price you chose before you bought: a ${loss} loss. That’s a good trade that didn’t work, and it’s over.`,
      tight: (loss: string) =>
        `Out quickly, for ${loss}. Small. But remember that the same stop lost money when support held, too.`,
      none: (pnl: string, worst: string) =>
        `No stop, no exit. You’re at ${pnl}, and it was ${worst} at the worst. That’s how accounts end: not in one loss, in one loss with no plan.`,
    },
  },

  desk: {
    kicker: 'One desk',
    title: 'Learn, read the market and track your trades in one place.',
    lead: 'Open your desk and see your next lesson, today’s signals and how your own trades are going.',
    modules: [
      'Courses',
      'Signals',
      'Paper account',
      'Journal',
      'Tools',
      'Your desk',
    ],
    all: 'Every feature',
  },

  signals: {
    kicker: 'Signals',
    title: 'Signals that show their work.',
    lead: 'Entry, stop and target, the reasons for and against, and how the same rules have done on that market, losses included.',
    all: 'See every market',
    how: 'How signals work',
  },

  curriculum: {
    kicker: 'Courses',
    title: 'Seven courses, from zero to a plan.',
    lead: 'Every lesson is a small market you control: make a call, see what happens, learn why. Go in order, or jump to what you need, like RSI or reading a company’s accounts.',
    lessonsCount: (n: number) => `${n} lessons`,
    status: {
      live: 'Play it now',
      planned: 'Coming soon',
    },
  },

  risk: {
    kicker: 'Risk Lab',
    title: 'See how fast leverage can wipe you out.',
    lead: 'Few people see this before they trade. Try it with a pretend $100.',
    setup: 'You have $100. Choose your leverage.',
    position: 'Position',
    closedAt: 'Closed out if the market falls',
    predict: (move: string) =>
      `The market will end ${move} lower. What happens to your $100?`,
    bands: {
      little: 'I lose a little',
      lot: 'I lose a lot',
      all: 'I lose all of it',
    },
    run: 'Run the market',
    pick: 'Make your prediction first',
    another: 'Another day, same leverage',
    retry: 'Try another leverage',
    equity: 'Your $100',
    liquidated: 'Closed out',
    guessed: {
      right: 'You called it.',
      wrong: 'Not what you expected.',
    },
    coach: {
      survived: (end: string, pnl: string) =>
        `The market ended ${end} and you’re ${pnl}. At this leverage a small move is a big share of your money.`,
      dipKilled: (end: string, worst: string, closed: string) =>
        `The market ended only ${end}, but on the way it fell ${worst}. At this leverage you were closed out at ${closed}. The ending didn’t matter; the path did.`,
      fastKilled: (closed: string) =>
        `Closed out at ${closed}, long before the market finished falling. That’s what high leverage buys you: less room than an ordinary day’s wobble.`,
    },
  },

  local: {
    kicker: 'Made for here',
    title: 'Money lessons built on Ghana and Nigeria.',
    lead: 'Real inflation from Ghana’s 2022 and Nigeria’s 2023, the cedi and the naira, T-bills, commodities, IPOs and the fees nobody mentions.',
    lessons: ['f3', 'f7', 'f8', 'f0', 'm6', 's6'],
    play: 'Play it',
  },

  closing: {
    title: 'Your first lesson takes a few minutes.',
    lead: 'No card. Start with a chart and a choice, then open your desk: courses, signals, a journal and tools.',
    cta: 'Start free',
    secondary: 'Try a lesson here',
  },
  roadmapStrip: {
    cta: 'See every course',
    search: 'Or look for one topic',
  },

  footer: {
    disclaimer:
      'Educational only. Not financial advice. Every price on this site is simulated or clearly marked as historical data, and nothing here moves real money.',
  },
} as const;
