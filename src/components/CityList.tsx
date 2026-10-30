import type { City } from '../types/weather';

interface CityListProps {
  cities: City[];
  selectedId?: number;
  disabled?: boolean;
  onSelect: (city: City) => void;
}

const coordinateFormat = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function baseLabel(city: City): string {
  return [city.name, city.admin1, city.country].filter(Boolean).join(', ');
}

export default function CityList({
  cities,
  selectedId,
  disabled = false,
  onSelect,
}: CityListProps) {
  if (cities.length === 0) return null;

  const labelCounts = new Map<string, number>();
  for (const city of cities) {
    const label = baseLabel(city);
    labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
  }

  return (
    <div
      role="group"
      aria-label="Cidades encontradas"
      className="flex min-w-0 flex-wrap gap-2 rounded-lg border border-white/10 bg-white/5 p-3 shadow-glass backdrop-blur-md"
    >
      {cities.map((city) => {
        const label = baseLabel(city);
        const isAmbiguous = (labelCounts.get(label) ?? 0) > 1;
        const text = isAmbiguous
          ? `${label} (${coordinateFormat.format(city.latitude)}, ${coordinateFormat.format(city.longitude)})`
          : label;
        const isSelected = city.id === selectedId;

        return (
          <button
            key={city.id}
            type="button"
            aria-disabled={disabled}
            aria-pressed={isSelected}
            onClick={() => !disabled && onSelect(city)}
            className={`min-h-11 max-w-full rounded-lg border px-3 py-2 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 ${
              isSelected
                ? 'border-accent-400 bg-accent-500 text-night-900'
                : 'border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}
