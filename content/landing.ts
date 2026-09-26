/**
 * Every word on the landing page. Numbers never live here: a line that
 * needs one takes it as an argument, already calculated by an engine and
 * formatted (CLAUDE.md rule 1).
 */

export const LANDING = {
  nav: {
    roadmap: 'Roadmap',
    lessons: 'Lessons',
    riskLab: 'Risk Lab',
    coach: 'Coach',
    start: 'Try a lesson',
  },

  hero: {
    eyebrow: 'Trading and investing, taught by doing',
    title: 'Learn to read the market. Practise before it costs you.',
    lead: 'Charts, technical and fundamental analysis, and real strategies, in lessons you play rather than read. Simulated and historical markets, a coach that asks before it tells, and never a signal.',
    primary: 'Read your first chart',
    secondary: 'See the roadmap',
    promises: [
      'No signals',
      'No real money',
      'Follow the path or take one lesson',
    ],
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

  ticker: {
    label: 'Lessons, not prices',
    items: {
      liquidation: (leverage: number, move: string) =>
        `${leverage}× leverage · a ${move} dip closes you out`,
      recovery: (loss: string, gain: string) =>
        `Lose ${loss} · you need +${gain} to get back`,
      doubling: (start: string, end: string) =>
        `“Doubles every 30 days” · ${start} becomes ${end} in a year · nothing real does that`,
      sizing: (risk: string, account: string, stop: string, shares: number) =>
        `Risk ${risk} of ${account} with a ${stop} stop · buy ${shares} shares`,
      support:
        'Support is where buyers stepped in before · not a promise they will again',
      rsi: 'RSI above 70 means price rose fast · not that it must fall',
    },
  },

  loop: {
    kicker: 'How every lesson works',
    title: 'Not a course. A flight simulator for trading.',
    lead: 'Pilots don’t learn turbulence from a PDF. Every lesson puts a market in your hands and lets you cause what happens.',
    steps: [
      ['See it', 'A real-looking market, not a diagram'],
      ['Touch it', 'Drag the stop, change the leverage, move the average'],
      ['Predict', 'Say what you think happens before it does'],
      ['Decide', 'Commit, with your reasoning'],
      ['Consequence', 'The market plays out. No look-ahead.'],
      ['Why', 'The coach explains what you caused'],
      ['Again', 'Change one thing and replay the same market'],
    ],
    old: ['Watch', 'Read', 'Quiz', 'Forget'],
    oldLabel: 'Not this',
  },

  curriculum: {
    kicker: 'Roadmap and lessons',
    title: 'One path from zero to disciplined. Or just the lesson you need.',
    lead: 'The roadmap takes you from what a price is to a 30-day paper challenge, in order. Already trading? Skip it: every lesson stands alone, so you can learn exactly how RSI works, or how to read an income statement, and nothing else.',
    tabs: { path: 'The roadmap', single: 'Single lessons' },
    stage: (n: number) => `Stage ${n}`,
    lessonsCount: (n: number) => `${n} lessons`,
    summary: (stages: number) => `lessons · ${stages} stages`,
    minutes: (n: number) => `${n} min`,
    needs: 'Builds on',
    all: 'All topics',
    status: {
      live: 'Play it now',
      next: 'Being built',
      planned: 'On the roadmap',
    },
    truth: {
      simulation: 'Simulation',
      historical: 'Historical data',
      educational: 'Educational',
    },
    placement: {
      title: 'Already trade?',
      body: 'A five-minute placement check will skip you past what you already know, straight to the stage where your mistakes are.',
    },
    riskFirst:
      'Risk comes third, before any strategy. You learn where you’re wrong before you learn where to buy.',
  },

  risk: {
    kicker: 'Risk Lab',
    title: 'The lesson that saves accounts.',
    lead: 'Every signals group sells entries. Almost none of them teach this.',
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

  coach: {
    kicker: 'The coach',
    title: 'A coach that asks before it tells.',
    lead: 'It sees what you did in the simulation, remembers where you struggle, and teaches the way a good mentor does: with a question first.',
    chat: {
      coach1: (leverage: number) =>
        `Before I say anything: at ${leverage}×, how far do you think the market can fall before your $100 is gone?`,
      learner1: 'Maybe 10%?',
      coach2: (move: string) =>
        `Try it. Set the fall to ${move} and watch what’s left.`,
      learner2: 'Wait. It’s all gone?',
      coach3: (move: string, leverage: number) =>
        `All of it. ${move} times ${leverage} is almost your whole deposit, and that’s where the exchange closes you out. Now: what would you change first, the leverage or the stop?`,
    },
    points: [
      [
        'Numbers from the simulation',
        'Every figure it says comes from the market engine. It’s never allowed to make one up, and a guard checks every sentence.',
      ],
      [
        'It knows your habits',
        'Stops too tight? Moving them? Buying after three green candles? It notices, and builds your next lesson around it.',
      ],
      [
        'Never a signal',
        'It will explain any setup. It will never tell you to buy or sell anything real.',
      ],
    ],
  },

  local: {
    kicker: 'Built for here',
    title: 'The markets you actually trade, the traps you actually meet.',
    markets: [
      ['Forex', 'Including USD/GHS and USD/NGN, and why they move'],
      ['Stocks', 'The GSE and the NGX, and US stocks through local apps'],
      [
        'Commodities',
        'Cocoa, gold and oil: what they do to the cedi and the naira',
      ],
      ['Crypto', 'Volatility, leverage, and exchanges, without the hype'],
    ],
    scamTitle: 'Signals groups, “account managers”, doubling schemes',
    scamBody: (start: string, end: string) =>
      `If ${start} really doubled every 30 days, it would be ${end} in a year. Our lessons teach the maths that makes those promises fall apart, and the red flags that come before them.`,
  },

  whatsapp: {
    kicker: 'On WhatsApp',
    title: 'One chart a day, in the app you already open.',
    lead: 'A 60-second daily rep: a chart, a question, your answer, the reason. It keeps the habit alive between lessons. It’s a coach for our lessons, not a chatbot and never a signals channel.',
    bubbleFrom: 'Sika Lab',
    bubble:
      'Daily rep · Chart 41. Price has touched this level three times. You want to buy here. Where does your stop go?',
    options: [
      'A · Right on the line',
      'B · Below it, past the wicks',
      'C · No stop',
    ],
    reply: 'B',
  },

  field: {
    kicker: 'What we learned from the field',
    title: 'Others proved the pieces. Nobody put them together here.',
    items: [
      [
        'Babypips',
        'A free, school-style path works: 350+ lessons, graded from preschool up.',
        'It’s reading. We make every lesson playable.',
      ],
      [
        'Brilliant',
        'Learning by solving, not watching, keeps people for years.',
        'The same idea, pointed at markets.',
      ],
      [
        'Duolingo',
        'A small daily habit beats a long weekly one.',
        'A daily chart on WhatsApp, and a streak that forgives.',
      ],
      [
        'Khanmigo',
        'An AI tutor that asks first can be priced as its own layer.',
        'A coach that asks first, and whose numbers are checked.',
      ],
      [
        'Trading simulators',
        'Paper money and replays are engaging.',
        'They teach picking. We teach judgement, with a lesson in every replay.',
      ],
      [
        'African fintechs',
        'Cowrywise, Bamboo and Ladda publish good articles.',
        'Nobody here lets you practise first. That’s the gap.',
      ],
    ],
  },

  never: {
    kicker: 'What you’ll never see here',
    items: [
      'Buy or sell signals, or trade calls',
      'Promised returns or profit screenshots',
      'Countdown timers and fake urgency',
      'An AI that touches your money',
      'Leaderboards ranked by profit',
      'Lambos',
    ],
  },

  pricing: {
    kicker: 'How it’s paid for',
    title: 'Free to start. Pay by MoMo when it’s earned it.',
    tiers: [
      [
        'Free',
        'The first stage of the roadmap, a daily chart on WhatsApp, and single lessons to try.',
      ],
      [
        'Pass',
        'The whole roadmap, the coach, and market replays. Paid by mobile money through Paystack. Nothing renews without you.',
      ],
      [
        'Partners',
        'Banks, brokers, telcos, universities and employers can sponsor access for their people.',
      ],
    ],
    note: 'Prices are set with our pilot learners, not before.',
  },

  build: {
    kicker: 'Where we are',
    title: 'What’s built, and what comes next',
    items: [
      [
        'Now',
        'Two lessons playable on this page: support and stops, and leverage.',
      ],
      [
        'Next',
        'The lesson player: full charts, the first two stages of the roadmap, and progress saved.',
      ],
      [
        'Then',
        'The coach, live. Technical analysis lessons with indicators you can drag.',
      ],
      [
        'After',
        'Market replays on historical data, fundamental analysis, and the daily chart on WhatsApp.',
      ],
      ['Later', 'Passes by MoMo, partner access, the 30-day paper challenge.'],
    ],
  },

  closing: {
    title: 'Your first chart takes three minutes.',
    cta: 'Read your first chart',
  },

  footer: {
    disclaimer:
      'Educational only. Not financial advice. Every price on this site is simulated or clearly marked as historical data, and nothing here moves real money.',
  },
} as const;
