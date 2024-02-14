import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import { useTripStore } from "../../store/tripStore";
import { ActivityMarker } from "./ActivityMarker";
import { RoutePolyline } from "./RoutePolyline";
import type { Activity } from "../../api/client";

const DEFAULT_CENTER: LatLngTuple = [35.6762, 139.6503];

function FlyToCenter({ center, zoom }: { center: LatLngTuple; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

interface Props {
  activeDay?: number;
}

export function TripMap({ activeDay = 0 }: Props) {
  const { itinerary } = useTripStore();
  const [selectedDay, setSelectedDay] = useState(activeDay);

  const allActivities: Activity[] = itinerary
    ? itinerary.days.flatMap((d) => d.activities)
    : [];

  const dayActivities: Activity[] = itinerary
    ? (itinerary.days[selectedDay]?.activities ?? allActivities)
    : [];

  const firstWithCoords = dayActivities.find((a) => a.lat != null);
  const center: LatLngTuple = firstWithCoords
    ? [firstWithCoords.lat!, firstWithCoords.lng!]
    : DEFAULT_CENTER;

  return (
    <div className="flex flex-col h-full">
      {itinerary && itinerary.days.length > 1 && (
        <div className="flex gap-1.5 flex-wrap p-2 bg-white border-b border-slate-100">
          <button
            onClick={() => setSelectedDay(-1)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              selectedDay === -1 ? "bg-blue-600 text-white border-blue-600" : "text-slate-600 border-slate-200 hover:border-blue-300"
            }`}
          >
            All days
          </button>
          {itinerary.days.map((d, i) => (
            <button
              key={d.day}
              onClick={() => setSelectedDay(i)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                selectedDay === i ? "bg-blue-600 text-white border-blue-600" : "text-slate-600 border-slate-200 hover:border-blue-300"
              }`}
            >
              Day {d.day}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1">
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyToCenter center={center} zoom={12} />
          {(selectedDay === -1 ? allActivities : dayActivities).map((act, i) => (
            <ActivityMarker key={`${act.name}-${i}`} activity={act} index={i} />
          ))}
          <RoutePolyline activities={selectedDay === -1 ? allActivities : dayActivities} />
        </MapContainer>
      </div>
    </div>
  );
}
