import { CoachChat } from '@/components/coach/CoachChat';
import { COACH_CHAT } from '@/content/coach';
import { capabilities } from '@/lib/capabilities';

export const metadata = { title: COACH_CHAT.meta.title };

export default function CoachPage() {
  // Written replies need only the coach; the database is for the ledger.
  return <CoachChat configured={capabilities().coach} />;
}
