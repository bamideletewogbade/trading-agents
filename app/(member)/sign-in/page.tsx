import { AUTH } from '@/content/auth';
import { AuthScreen } from '@/components/auth/AuthScreen';

export const metadata = { title: AUTH.signIn.title };

export default function SignInPage() {
  return <AuthScreen kind="sign-in" />;
}
