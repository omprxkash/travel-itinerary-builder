import { create } from 'zustand';
import type { Activity, Itinerary, TripInput } from '../api/client';

interface TripStore {
  tripInput: Partial<TripInput>;
  itinerary: Itinerary | null;
  loading: boolean;
  error: string | null;

  setTripInput(input: Partial<TripInput>): void;
  setItinerary(itinerary: Itinerary | null): void;
  setLoading(loading: boolean): void;
  setError(error: string | null): void;
  clearItinerary(): void;
  updateActivity(dayIdx: number, actIdx: number, patch: Partial<Activity>): void;
  reorderActivities(dayIdx: number, from: number, to: number): void;
}

export const useTripStore = create<TripStore>((set) => ({
  tripInput: {
    num_travelers: 1,
    budget_level: 'mid-range',
    interests: [],
  },
  itinerary: null,
  loading: false,
  error: null,

  setTripInput: (input) =>
    set((s) => ({ tripInput: { ...s.tripInput, ...input } })),

  setItinerary: (itinerary) => set({ itinerary }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  clearItinerary: () => set({ itinerary: null, error: null }),

  updateActivity: (dayIdx, actIdx, patch) =>
    set((s) => {
      if (!s.itinerary) return s;
      const days = s.itinerary.days.map((day, di) => {
        if (di !== dayIdx) return day;
        const activities = day.activities.map((act, ai) =>
          ai === actIdx ? { ...act, ...patch } : act
        );
        return { ...day, activities };
      });
      return { itinerary: { ...s.itinerary, days } };
    }),

  reorderActivities: (dayIdx, from, to) =>
    set((s) => {
      if (!s.itinerary) return s;
      const days = s.itinerary.days.map((day, di) => {
        if (di !== dayIdx) return day;
        const acts = [...day.activities];
        const [moved] = acts.splice(from, 1);
        acts.splice(to, 0, moved);
        return { ...day, activities: acts };
      });
      return { itinerary: { ...s.itinerary, days } };
    }),
}));
