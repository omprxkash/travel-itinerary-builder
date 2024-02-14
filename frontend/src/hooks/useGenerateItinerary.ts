import { api } from '../api/client';
import type { TripInput } from '../api/client';
import { useTripStore } from '../store/tripStore';

export function useGenerateItinerary() {
  const { setItinerary, setLoading, setError } = useTripStore();

  const generate = async (input: TripInput) => {
    setLoading(true);
    setError(null);
    try {
      const itinerary = await api.generateItinerary(input);
      setItinerary(itinerary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return { generate };
}
