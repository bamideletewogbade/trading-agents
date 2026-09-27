import { DESK } from '@/content/desk';
import { Dashboard } from '@/components/desk/Dashboard';

export const metadata = { title: DESK.meta.title };

export default function DeskPage() {
  return <Dashboard />;
}
