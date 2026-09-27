import { SIGNALS } from '@/content/signals';
import { SignalsFeed } from '@/components/signals/SignalsFeed';

export const metadata = {
  title: SIGNALS.meta.title,
  description: SIGNALS.meta.description,
};

export default function SignalsPage() {
  return <SignalsFeed />;
}
