import { AUTH } from '@/content/auth';
import { AuthScreen } from '@/components/auth/AuthScreen';

export const metadata = { title: AUTH.signUp.title };

export default function SignUpPage() {
  return <AuthScreen kind="sign-up" />;
}
