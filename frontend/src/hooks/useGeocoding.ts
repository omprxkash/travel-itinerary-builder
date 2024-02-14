import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { GeoResult } from '../api/client';

export function useGeocoding(query: string, debounceMs = 600) {
  const [result, setResult] = useState<GeoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!query || query.length < 3) {
      setResult(null);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const geo = await api.geocode(query);
        setResult(geo);
      } catch (err) {
        console.debug('Geocoding failed:', err);
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, debounceMs]);

  return { result, loading };
}
