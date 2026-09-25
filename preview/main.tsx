import { createRoot } from 'react-dom/client';
import { guessCountry } from '@/lib/core/country';
import { PaydayFlow } from '@/components/experiences/payday/PaydayFlow';
import './preview.css';

/**
 * The first 3 minutes as a standalone page: the same engine, content and
 * components as the site, bundled for the browser alone. The country is
 * guessed from the phone's language setting (en-NG, en-KE) and one tap away
 * from the others on the first screen.
 */
const region = navigator.language.split('-')[1];
createRoot(document.getElementById('root')!).render(
  <PaydayFlow initialCountry={guessCountry(region)} />,
);
