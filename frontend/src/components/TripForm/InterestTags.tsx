const INTERESTS = [
  { id: 'history', label: 'History', emoji: '🏛️' },
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'food', label: 'Food', emoji: '🍜' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🌙' },
  { id: 'adventure', label: 'Adventure', emoji: '🧗' },
];

interface Props {
  selected: string[];
  onChange(interests: string[]): void;
}

export function InterestTags({ selected, onChange }: Props) {
  const toggle = (id: string) => {
    onChange(
      selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {INTERESTS.map((i) => {
        const active = selected.includes(i.id);
        return (
          <button
            key={i.id}
            type="button"
            onClick={() => toggle(i.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              active
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-700'
            }`}
          >
            <span>{i.emoji}</span>
            {i.label}
          </button>
        );
      })}
    </div>
  );
}
