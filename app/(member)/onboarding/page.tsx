import { ONBOARDING } from '@/content/onboarding';
import { Conversation } from '@/components/onboarding/Conversation';

export const metadata = { title: ONBOARDING.meta.title };

export default function OnboardingPage() {
  return <Conversation />;
}
