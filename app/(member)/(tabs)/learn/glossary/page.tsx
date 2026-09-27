import { GLOSSARY_PAGE } from '@/content/glossary';
import { Glossary } from '@/components/marketing/Glossary';

export const metadata = { title: GLOSSARY_PAGE.meta.title };

/** The glossary inside the app, so looking up a word doesn't leave it. */
export default function MemberGlossaryPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-5 pb-8 sm:px-8 lg:pt-8">
      <p className="font-mono type-label text-gold">
        {GLOSSARY_PAGE.hero.kicker}
      </p>
      <h1 className="mt-1 type-display text-fg">
        {GLOSSARY_PAGE.hero.titleLead} {GLOSSARY_PAGE.hero.titleGold}
      </h1>
      <p className="mt-2 mb-6 max-w-[60ch] type-body text-fg-2">
        {GLOSSARY_PAGE.hero.lead}
      </p>
      <Glossary />
    </div>
  );
}
