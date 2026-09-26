import { PRACTICE } from '@/content/practice';
import { PracticeHome } from '@/components/practice/PracticeHome';

export const metadata = { title: PRACTICE.meta.title };

export default function PracticePage() {
  return <PracticeHome />;
}
