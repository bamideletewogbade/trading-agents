import { GLOSSARY_PAGE } from '@/content/glossary';
import { Glossary } from '@/components/marketing/Glossary';
import { PageHero } from '@/components/marketing/Section';

export const metadata = {
  title: GLOSSARY_PAGE.meta.title,
  description: GLOSSARY_PAGE.meta.description,
};

export default function GlossaryPage() {
  return (
    <>
      <PageHero
        kicker={GLOSSARY_PAGE.hero.kicker}
        titleLead={GLOSSARY_PAGE.hero.titleLead}
        titleGold={GLOSSARY_PAGE.hero.titleGold}
        lead={GLOSSARY_PAGE.hero.lead}
      />
      <section className="border-t border-line py-10 sm:py-14">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <Glossary />
        </div>
      </section>
    </>
  );
}
