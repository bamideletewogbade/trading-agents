import { headers } from 'next/headers';
import { guessCountry, isCountryCode } from '@/lib/core/country';
import { PLAY } from '@/content/copy/play';
import { PaydayFlow } from '@/components/experiences/payday/PaydayFlow';

export const metadata = { title: PLAY.title };

/**
 * The first 3 minutes, full screen: no tabs while a month is being lived.
 * The country is guessed from Cloudflare's `cf-ipcountry` header (or
 * `?country=NG`, for testing and for links shared across borders) and is
 * one tap away from the others on the first screen.
 */
export default async function PaydayPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const asked =
    typeof params.country === 'string' ? params.country.toUpperCase() : '';
  const country = isCountryCode(asked)
    ? asked
    : guessCountry((await headers()).get('cf-ipcountry'));
  return <PaydayFlow initialCountry={country} />;
}
