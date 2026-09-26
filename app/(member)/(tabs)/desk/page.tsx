import { DESK } from '@/content/desk';
import { Desk } from '@/components/desk/Desk';

export const metadata = { title: DESK.meta.title };

export default function DeskPage() {
  return <Desk />;
}
