/**
 * Every word on the landing page. Numbers never live here: a line that
 * needs one takes it as an argument, already calculated by an engine and
 * formatted (CLAUDE.md rule 1).
 */

export const LANDING = {
  hero: {
    eyebrow: 'Made for Ghana and Nigeria · Start from zero',
    titleLead: 'Would you take this trade?',
    titleGold: 'Practise before it costs you.',
    lead: 'Start with the simplest one: buy a share, pick a selling price, see what you gain or lose. Then charts, stops and risk, one small decision at a time.',
    primary: 'Try your first trade',
    secondary: 'Explore the learning path',
    promises: ['Pretend money', 'No account needed', 'Free to start'],
  },

  firstShare: {
    kicker: 'Your first trade',
    badge: 'Made-up example',
    title: 'A share. Two prices. What changes?',
    intro:
      'You buy one share (a small piece of a company) and sell it later. Pick the selling price.',
    diagram: 'Compare the price you pay with the price you sell for',
    buy: 'You buy for',
    sell: 'You sell for',
    choose: 'What if the selling price is…',
    scenarios: { higher: 'Higher ↑', lower: 'Lower ↓', same: 'The same =' },
    reveal: 'See the result',
    outcome: {
      gain: (amount: string) => `You gain ${amount}.`,
      loss: (amount: string) => `You lose ${amount}.`,
      same: (_amount: string) => 'You break even.',
    },
    explain: {
      gain: 'You sold for more than you paid. Try a lower selling price to see the other side.',
      loss: 'You sold for less than you paid. A price can fall as well as rise.',
      same: 'You sold for exactly what you paid. There is no gain or loss in this example.',
    },
    next: 'Next: what makes a price move?',
    note: 'Simulated prices in Ghana cedis. Fees and taxes are left out of this first example; they can reduce a gain or increase a loss.',
  },

  ticker: {
    label: 'Lessons you can play today',
    count: (n: number) => `${n} live`,
  },

  steps: {
    kicker: 'How it works',
    title: 'Decide. See what happens. Learn why.',
    lead: 'Every lesson is a small market you control. You make the call with pretend money, the result plays out, and the explanation arrives while it still matters.',
    items: [
      [
        'Make the call',
        'Pick a price, a stop or an answer. It’s your decision, not a textbook quiz.',
      ],
      [
        'Watch it play out',
        'See what your choice would have done, with pretend money and every chart clearly labelled.',
      ],
      [
        'Learn why, then go again',
        'Get a plain explanation, replay with a different choice, and meet what you got wrong again later.',
      ],
    ],
  },

  starter: {
    kicker: 'Where are you starting?',
    title: 'Pick the one that sounds like you.',
    items: [
      {
        title: 'I’ve never traded',
        body: 'Start with what a price is and where gains and losses come from. No jargon, no pressure.',
        href: '/lesson/m1',
        cta: 'Start from zero',
      },
      {
        title: 'I trade, but I keep losing',
        body: 'Most losses come from where the stop sits and how big the trade is. Practise both without the pain.',
        href: '/lesson/r1',
        cta: 'Find the leak',
      },
      {
        title: 'I want to understand the news',
        body: 'Inflation, the cedi, the naira, an IPO: see what it means for your money, with the numbers worked out.',
        href: '/lesson/f3',
        cta: 'See what moves your money',
      },
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
    title: 'A place to keep learning.',
    lead: 'Find your next lesson, revisit something you missed, or explore the tools as your confidence grows.',
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
    kicker: 'Today’s signals, live',
    title: 'Signals that show their work.',
    lead: 'Every call comes with its stop and target, the reasons against it, a checklist of what must be true, and the same rules’ full record on that market, losses included. Paper-trade them first.',
    all: 'See every market',
    how: 'How signals work',
  },

  curriculum: {
    kicker: 'Courses',
    title: 'From your first price to a plan of your own.',
    lead: 'How markets work, then charts, risk and strategy. Follow the path in order, or jump straight to what you need, like RSI or stop losses. Each course shows what you can play today.',
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
    title: 'Built on the cedi, the naira and prices you know.',
    lead: 'Inflation, currencies, T-bills and company shares, through Ghanaian and Nigerian examples. Anything taken from real history is labelled as historical data.',
    lessons: ['f3', 'f0', 'm6'],
    cards: {
      f3: {
        title: 'Why does the same money buy less?',
        body: 'See what inflation did to savings in Ghana and Nigeria, from real history.',
      },
      f0: {
        title: 'What does buying into an IPO mean?',
        body: 'Walk through how a company sells shares to the public, with a local example.',
      },
      m6: {
        title: 'Who gets paid when you trade?',
        body: 'Brokers, signal sellers and “account managers”: see who earns from your trades, win or lose.',
      },
    },
    play: 'Play it',
  },

  closing: {
    title: 'Make your next mistake here, not with real money.',
    lead: 'Lessons are free to start and run on pretend money. Keep going as a guest, or make an account later to keep your progress on every device.',
    cta: 'Start your first lesson',
    secondary: 'Try the first trade again',
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
