import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Activity } from '../../api/client';

const TYPE_COLORS: Record<string, string> = {
  restaurant: '#ef4444',
  museum: '#8b5cf6',
  landmark: '#f59e0b',
  park: '#10b981',
  attraction: '#2563eb',
  default: '#64748b',
};

function createNumberedIcon(num: number, color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      color:white;
      width:26px;height:26px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      font-size:11px;font-weight:700;
    "><span style="transform:rotate(45deg)">${num}</span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -28],
  });
}

interface Props {
  activity: Activity;
  index: number;
}

export function ActivityMarker({ activity, index }: Props) {
  if (activity.lat == null || activity.lng == null) return null;

  const color = TYPE_COLORS[activity.type] ?? TYPE_COLORS.default;
  const icon = createNumberedIcon(index + 1, color);

  return (
    <Marker position={[activity.lat, activity.lng]} icon={icon}>
      <Popup maxWidth={260}>
        <div className="text-sm">
          <strong>{activity.name}</strong>
          <p className="text-slate-500 text-xs mt-1">{activity.time} · {activity.duration_minutes} min · {activity.estimated_cost}</p>
          <p className="text-slate-600 text-xs mt-1 leading-relaxed">{activity.description}</p>
        </div>
      </Popup>
    </Marker>
  );
}
