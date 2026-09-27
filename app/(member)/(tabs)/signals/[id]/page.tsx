import { SIGNALS } from '@/content/signals';
import { marketById } from '@/lib/markets/catalog';
import { MarketDetail } from '@/components/signals/MarketDetail';

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  const market = marketById(id);
  return {
    title: market
      ? `${market.name} · ${SIGNALS.meta.title}`
      : SIGNALS.meta.title,
  };
}

export default async function MarketPage({ params }: Params) {
  const { id } = await params;
  return <MarketDetail key={id} id={id} />;
}
