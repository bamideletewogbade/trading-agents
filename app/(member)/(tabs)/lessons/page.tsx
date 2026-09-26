import { LIBRARY } from '@/content/member';
import { Library } from '@/components/member/Library';

export const metadata = { title: LIBRARY.meta.title };

export default function LessonsPage() {
  return <Library />;
}
