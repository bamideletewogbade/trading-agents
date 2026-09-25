import { HOME } from '@/content/copy/shell';
import { BRAND } from '@/lib/brand';
import { TopBar } from '@/components/shell/TopBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IntelligenceMap } from '@/components/progress/IntelligenceMap';

/**
 * Home. For someone new, the first thing on it is the test of how they think
 * about money (spec §98): no sign-up, no video, no course list. The button
 * opens the Payday simulation once Phase 1 builds it.
 */
export default function HomePage() {
  return (
    <>
      <TopBar title={BRAND.name} />
      <div className="space-y-3">
        <section className="rounded-md border border-line bg-panel p-5">
          <p className="type-display text-fg">{HOME.opener}</p>
          <p className="mt-3 type-body text-fg-2">{HOME.openerDetail}</p>
          <div className="mt-6">
            <Button kind="primary" block disabled reason={HOME.startNotReady}>
              {HOME.start}
            </Button>
          </div>
        </section>

        <Card title={HOME.mapTitle}>
          <IntelligenceMap />
          <p className="mt-4 type-small text-muted">{HOME.mapEmpty}</p>
        </Card>

        <Card title={HOME.dailyTitle}>
          <p className="type-small text-fg-2">{HOME.dailyEmpty}</p>
        </Card>
      </div>
    </>
  );
}
