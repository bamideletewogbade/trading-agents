import { COURSES_PAGE } from '@/content/pages';
import { AskBox } from '@/components/marketing/AskBox';
import { RoadmapExplorer } from '@/components/marketing/RoadmapExplorer';

export const metadata = {
  title: COURSES_PAGE.meta.title,
  description: COURSES_PAGE.meta.description,
};

/**
 * The courses on one screen: a short header with the search beside it,
 * then the course map (components/marketing/RoadmapExplorer.tsx). Every
 * course is one tap away; nothing makes you scroll past the others.
 */
export default function CoursesPage() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto max-w-[1200px] px-4 pt-8 pb-14 sm:px-8 lg:pt-12">
        <div className="lg:flex lg:items-end lg:justify-between lg:gap-10">
          <div>
            <p className="font-mono type-label text-gold">
              {COURSES_PAGE.hero.kicker}
            </p>
            <h1 className="mt-2 max-w-[20ch] text-[2rem] leading-[2.375rem] font-[680] tracking-[-0.03em] text-balance text-fg sm:text-[2.75rem] sm:leading-[3.125rem]">
              {COURSES_PAGE.hero.title}
            </h1>
            <p className="mt-2 max-w-[56ch] type-body text-fg-2">
              {COURSES_PAGE.hero.lead}
            </p>
          </div>
          <div className="mt-5 w-full lg:mt-0 lg:max-w-[420px]">
            <p className="mb-2 font-mono type-label text-fg-2">
              {COURSES_PAGE.ask}
            </p>
            <AskBox compact />
          </div>
        </div>
        <div className="mt-8">
          <RoadmapExplorer />
        </div>
      </div>
    </section>
  );
}
