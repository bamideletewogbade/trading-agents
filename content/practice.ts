/**
 * Words for "practise your mistakes": the Practice tab, the round, and the
 * card on the path. Numbers arrive worked out (lib/progress/review.ts).
 */

const questions = (n: number) => (n === 1 ? '1 question' : `${n} questions`);

export const PRACTICE = {
  meta: { title: 'Practice' },
  title: 'Practise your mistakes',
  lead: 'Questions you got wrong come back here, spaced out so they stick.',
  ready: (n: number) => `${questions(n)} ready`,
  start: 'Start practice',
  practise: 'Practise',
  none: {
    title: 'Nothing to practise yet',
    body: 'When you get a question wrong in a lesson, it comes back here. Getting things wrong is how this works.',
    cta: 'Go to your path',
  },
  rest: {
    title: 'All caught up',
    next: (days: number) =>
      days <= 1
        ? 'Your next question comes back tomorrow.'
        : `Your next question comes back in ${days} days.`,
  },
  stats: {
    waiting: 'In practice',
    learned: 'Learned for good',
    xp: 'Practice XP',
  },
  byLesson: 'Your mistakes, by lesson',
  count: questions,
  how: (days: string) =>
    `Get one right and it comes back after ${days} days. Get it right every time and it’s learned for good. Get it wrong and it starts again.`,
  round: {
    exit: 'Leave practice',
    step: (n: number, total: number) => `Question ${n} of ${total}`,
    from: (title: string) => `From: ${title}`,
    loading: 'Getting your questions…',
    next: 'Next',
    finish: 'Finish',
    answer: 'Pick an answer',
    xpLabel: (xp: number) => `${xp} XP this round`,
    done: {
      kicker: 'Practice complete',
      score: (right: number, total: number) =>
        `${right} of ${total} right first time`,
      learned: (n: number) =>
        n === 1
          ? '1 question learned for good'
          : `${n} questions learned for good`,
      kept: 'Streak kept',
      streak: (days: number) => `${days}-day streak`,
      more: 'Practise more',
      back: 'Back to practice',
      path: 'Back to your path',
    },
    empty: {
      title: 'Nothing due right now',
      body: 'Those questions aren’t due yet, or you’ve already got them right.',
      cta: 'Back to practice',
    },
  },
  card: {
    title: 'Practise your mistakes',
    due: (n: number) => `${questions(n)} ready to try again`,
    cta: 'Practise',
  },
  missed: (n: number) => `Practise the ${n === 1 ? 'one' : n} you missed`,
};
