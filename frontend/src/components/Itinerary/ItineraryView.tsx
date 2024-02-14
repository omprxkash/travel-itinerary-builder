import { useTripStore } from '../../store/tripStore';
import { DayCard } from './DayCard';
import { ExportButton } from '../Export/ExportButton';

export function ItineraryView() {
  const { itinerary } = useTripStore();
  if (!itinerary) return null;

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold mb-1">{itinerary.destination}</h2>
        <p className="text-blue-100 text-sm leading-relaxed">{itinerary.summary}</p>
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm bg-white/20 rounded-full px-3 py-1">
            💰 {itinerary.total_budget_estimate}
          </span>
          <ExportButton itinerary={itinerary} />
        </div>
      </div>

      {/* Days */}
      <div className="space-y-3">
        {itinerary.days.map((day, idx) => (
          <DayCard key={day.day} day={day} dayIdx={idx} />
        ))}
      </div>

      {/* Packing tips */}
      {itinerary.packing_tips.length > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <h3 className="font-semibold text-green-800 text-sm mb-2">🎒 Packing tips</h3>
          <ul className="space-y-1">
            {itinerary.packing_tips.map((tip, i) => (
              <li key={i} className="text-xs text-green-700">• {tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
