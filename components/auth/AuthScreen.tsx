import { AUTH } from '@/content/auth';
import { NoiseField } from '@/components/three/NoiseField';
import { AuthCard } from './AuthCard';

/** Sign-in and sign-up share one screen: the reasons on the left, the form on the right. */
export function AuthScreen({ kind }: { kind: 'sign-in' | 'sign-up' }) {
  const copy = kind === 'sign-in' ? AUTH.signIn : AUTH.signUp;
  return (
    <div className="relative overflow-hidden">
      <NoiseField className="absolute inset-x-0 top-0 h-[380px] opacity-40 [mask-image:linear-gradient(to_bottom,black_30%,transparent)]" />
      <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[1200px] items-center gap-10 px-4 py-10 sm:px-8 lg:grid-cols-2">
        <div>
          <h1 className="text-[2.5rem] leading-[2.75rem] font-[700] tracking-[-0.03em] text-fg sm:text-[3.25rem] sm:leading-[3.5rem]">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-[44ch] type-body text-fg-2">{copy.lead}</p>
          <div className="mt-8 hidden lg:block">
            <p className="font-mono type-label text-gold">{AUTH.side.kicker}</p>
            <ul className="mt-4 space-y-3">
              {AUTH.side.points.map((point) => (
                <li key={point} className="flex gap-3 type-body text-fg">
                  <span aria-hidden className="text-gold">
                    ◆
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <p className="mt-6 type-small text-muted">{AUTH.side.promise}</p>
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <AuthCard kind={kind} />
        </div>
      </div>
    </div>
  );
}
