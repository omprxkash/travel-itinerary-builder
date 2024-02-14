import { Polyline } from 'react-leaflet';
import type { LatLngTuple } from 'leaflet';
import type { Activity } from '../../api/client';

interface Props {
  activities: Activity[];
  opacity?: number;
}

export function RoutePolyline({ activities, opacity = 0.7 }: Props) {
  const positions: LatLngTuple[] = activities
    .filter((a) => a.lat != null && a.lng != null)
    .map((a) => [a.lat!, a.lng!]);

  if (positions.length < 2) return null;

  return (
    <Polyline
      positions={positions}
      pathOptions={{ color: '#2563eb', weight: 2.5, dashArray: '6 5', opacity }}
    />
  );
}
