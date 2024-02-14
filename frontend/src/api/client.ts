export interface TripInput {
  destination: string;
  start_date: string;
  end_date: string;
  num_travelers: number;
  budget_level: 'budget' | 'mid-range' | 'luxury';
  interests: string[];
  requirements?: string;
}

export interface Activity {
  time: string;
  name: string;
  type: string;
  description: string;
  duration_minutes: number;
  estimated_cost: string;
  address: string;
  tips?: string;
  booking_required?: boolean;
  lat?: number | null;
  lng?: number | null;
}

export interface DayPlan {
  day: number;
  date: string;
  theme: string;
  activities: Activity[];
  daily_budget_estimate: string;
  transport_tips: string;
}

export interface Itinerary {
  destination: string;
  summary: string;
  days: DayPlan[];
  total_budget_estimate: string;
  packing_tips: string[];
}

export interface GeoResult {
  lat: number;
  lng: number;
  display_name: string;
}

export interface CityInfo {
  name: string;
  display_name: string;
  country: string;
  lat: number;
  lng: number;
  poi_count: number;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  generateItinerary(input: TripInput): Promise<Itinerary> {
    return apiFetch('/api/generate', { method: 'POST', body: JSON.stringify(input) });
  },

  geocode(q: string): Promise<GeoResult> {
    return apiFetch(`/api/geocode?q=${encodeURIComponent(q)}`);
  },

  getCities(): Promise<CityInfo[]> {
    return apiFetch('/api/cities');
  },

  async exportPdf(itinerary: Itinerary): Promise<void> {
    const res = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itinerary),
    });
    if (!res.ok) throw new Error('PDF export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `itinerary-${itinerary.destination.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
