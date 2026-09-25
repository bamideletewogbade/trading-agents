'use client';

import { useState } from 'react';
import { formatMoney, fromMinor } from '@/lib/core/money';
import { Segmented } from '@/components/ui/Segmented';
import { Slider } from '@/components/ui/Slider';

/**
 * The controls, to feel on a real phone. Nothing here computes a
 * consequence: that is Phase 1's engines. The slider only formats the amount
 * it holds, through lib/core/money like everything else.
 */

const LEVERAGE = [
  { value: '5', label: '5×' },
  { value: '10', label: '10×' },
  { value: '20', label: '20×' },
  { value: '50', label: '50×' },
] as const;

const CHIPS = ['Rent', 'Home', 'Savings', 'Kofi’s guy', 'Spend'] as const;

export function SpecimenControls() {
  const [leverage, setLeverage] =
    useState<(typeof LEVERAGE)[number]['value']>('5');
  const [savingsPesewas, setSavingsPesewas] = useState(30_000);
  const [chip, setChip] = useState<(typeof CHIPS)[number]>('Savings');

  return (
    <div className="space-y-6">
      <Segmented
        name="leverage"
        label="Leverage"
        options={LEVERAGE}
        value={leverage}
        onChange={setLeverage}
      />

      <Slider
        label="Savings each month"
        value={savingsPesewas}
        min={0}
        max={300_000}
        step={10_000}
        format={(pesewas) => formatMoney(fromMinor(pesewas, 'GHS'))}
        onChange={setSavingsPesewas}
      />

      <fieldset>
        <legend className="mb-2 type-label text-fg-2">Put GH₵100 in</legend>
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((name) => {
            const chosen = name === chip;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={chosen}
                onClick={() => setChip(name)}
                className={`min-h-11 rounded-sm border px-3 type-small font-semibold transition-colors duration-(--duration-base) ${
                  chosen
                    ? 'border-gold bg-gold-soft text-fg'
                    : 'border-edge bg-raised text-fg-2'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
