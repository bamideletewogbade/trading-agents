/**
 * The words of the Payday flow that don't change by country. Country words
 * (names, amounts, rent customs) live in content/scenarios/payday.ts.
 */

export const PLAY = {
  title: 'Payday',
  close: 'Leave',
  intro: {
    country: 'Where do you live?',
    countryHelp: 'Your money, your prices. You can change this any time.',
    heading: 'It’s payday.',
    pressures: 'Three things are already pulling at it:',
    start: 'Split the money',
    another: 'Same life, a new month. Something different may break.',
  },
  allocate: {
    heading: 'Split it',
    help: 'All of it has to go somewhere. Tap + and −, or use the shortcuts.',
    left: (amount: string) => `${amount} left to place`,
    done: 'All placed',
    match: (amount: string) => `Set to ${amount}`,
    rest: 'Put the rest here',
    less: (label: string) => `Less for ${label}`,
    more: (label: string) => `More for ${label}`,
    next: 'Next',
    notDone: (amount: string) => `Place the last ${amount} first.`,
  },
  predict: {
    heading: 'Before the month starts, a guess.',
    question:
      'If your income stopped after this month, how many days could you live on what you saved?',
    hint: (daily: string) => `Rent and living cost about ${daily} a day.`,
    label: 'Your guess',
    days: (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`,
    play: 'Play the month',
  },
  month: {
    day: (n: number) => `Day ${n}`,
    spending: 'Spending money',
    savings: 'Savings',
    owed: 'You owe',
    skip: 'Skip to the result',
    borrowed: 'borrowed',
  },
  result: {
    heading: 'Month end',
    cover: 'Your savings would last',
    savings: 'Savings left',
    owed: 'You owe',
    scheme: (friend: string) => `With ${friend}’s guy`,
    schemeNote: 'Not back yet',
    coach: 'Coach',
    whatIf: 'What if…?',
    another: 'Play another month',
    readAsText: 'Read the month as text',
  },
  whatIf: {
    heading: 'Change one thing',
    help: 'Same month, same repair, same day. Only your split changes.',
    custom: 'Change my split myself',
    you: 'You',
    them: 'What if',
    rows: {
      cover: 'Days of cover',
      savings: 'Savings left',
      owed: 'You owe',
      net: 'At month end',
    },
    net: 'Spending money and savings, minus what you owe.',
    tryAnother: 'Try another change',
    next: (friend: string) => `About ${friend}’s guy…`,
  },
  reveal: {
    heading: 'Doubling every 30 days',
    label: (stake: string) => `${stake} after two years, at his rate`,
    another: 'Want another one?',
    playAgain: 'Play another month',
    home: 'Back to home',
  },
} as const;
