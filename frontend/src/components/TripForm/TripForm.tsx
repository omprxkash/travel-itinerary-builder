import { useEffect, useState, type FormEvent } from 'react';
import type { TripInput } from '../../api/client';
import { useGeocoding } from '../../hooks/useGeocoding';
import { useTripStore } from '../../store/tripStore';
import { useGenerateItinerary } from '../../hooks/useGenerateItinerary';
import { InterestTags } from './InterestTags';

const SUPPORTED_CITIES = ['Paris', 'Tokyo', 'Rome'];

export function TripForm() {
  const { tripInput, setTripInput, loading, error } = useTripStore();
  const { generate } = useGenerateItinerary();

  const [destination, setDestination] = useState(tripInput.destination ?? '');
  const [startDate, setStartDate] = useState(tripInput.start_date ?? '');
  const [endDate, setEndDate] = useState(tripInput.end_date ?? '');
  const [numTravelers, setNumTravelers] = useState(tripInput.num_travelers ?? 1);
  const [budgetLevel, setBudgetLevel] = useState<TripInput['budget_level']>(
    tripInput.budget_level ?? 'mid-range'
  );
  const [interests, setInterests] = useState<string[]>(tripInput.interests ?? []);

  const { result: geoResult } = useGeocoding(destination);

  useEffect(() => {
    setTripInput({ destination, start_date: startDate, end_date: endDate, num_travelers: numTravelers, budget_level: budgetLevel, interests });
  }, [destination, startDate, endDate, numTravelers, budgetLevel, interests]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!destination || !startDate || !endDate) return;
    generate({
      destination: destination.trim(),
      start_date: startDate,
      end_date: endDate,
      num_travelers: numTravelers,
      budget_level: budgetLevel,
      interests,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Destination */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Where to?
        </label>
        <div className="relative">
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Paris, Tokyo, Rome…"
            autoComplete="off"
            list="city-suggestions"
            required
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <datalist id="city-suggestions">
            {SUPPORTED_CITIES.map((c) => <option key={c} value={c} />)}
          </datalist>
          {geoResult && (
            <p className="text-xs text-slate-500 mt-1 truncate">📍 {geoResult.display_name}</p>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            required
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Travelers */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Travelers</label>
        <input
          type="number"
          value={numTravelers}
          min={1}
          max={20}
          onChange={(e) => setNumTravelers(Number(e.target.value))}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Budget */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Budget</label>
        <div className="grid grid-cols-3 gap-2">
          {(['budget', 'mid-range', 'luxury'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setBudgetLevel(level)}
              className={`py-2 rounded-lg text-sm font-medium border capitalize transition-all ${
                budgetLevel === level
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              {level === 'budget' ? '💰 Budget' : level === 'mid-range' ? '💳 Mid-range' : '✨ Luxury'}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          What do you love? <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <InterestTags selected={interests} onChange={setInterests} />
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
      >
        {loading ? 'Building your trip…' : 'Plan my trip →'}
      </button>
    </form>
  );
}
