import { PRACTICE } from '@/content/practice';
import { PracticeRound } from '@/components/practice/PracticeRound';

export const metadata = { title: PRACTICE.title };

type Props = { searchParams: Promise<{ lesson?: string }> };

/** A practice round, full screen like a lesson; `?lesson=f3` keeps it to one lesson. */
export default async function PracticeRoundPage({ searchParams }: Props) {
  const { lesson } = await searchParams;
  const one =
    typeof lesson === 'string' && /^[a-z0-9]{1,8}$/.test(lesson)
      ? lesson
      : undefined;
  return <PracticeRound key={one ?? 'all'} lesson={one} />;
}
