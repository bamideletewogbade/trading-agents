'use client';

/**
 * A choice among a few fixed options, like 5× · 10× · 20× · 50× (design
 * brief §6). Radio semantics, so arrow keys move between options and a
 * screen reader announces "3 of 4".
 */
export function Segmented<T extends string>({
  name,
  label,
  options,
  value,
  onChange,
}: {
  name: string;
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 type-label text-fg-2">{label}</legend>
      <div
        className="grid gap-1 rounded-md border border-line bg-raised p-1"
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        }}
      >
        {options.map((option) => {
          const chosen = option.value === value;
          return (
            <label
              key={option.value}
              className={`relative flex min-h-11 cursor-pointer items-center justify-center rounded-sm border num type-body transition-colors duration-(--duration-base) has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${
                chosen
                  ? 'border-gold bg-gold-soft font-semibold text-fg'
                  : 'border-transparent text-fg-2 hover:text-fg'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={chosen}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
