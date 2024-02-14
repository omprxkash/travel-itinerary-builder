import { useState } from 'react';
import type { Activity } from '../../api/client';
import { EditModal } from './EditModal';
import { useTripStore } from '../../store/tripStore';

const TYPE_ICONS: Record<string, string> = {
  restaurant: '🍽️',
  museum: '🏛️',
  landmark: '📍',
  park: '🌿',
  attraction: '⭐',
  sightseeing: '👁️',
  default: '📌',
};

interface Props {
  activity: Activity;
  dayIdx: number;
  actIdx: number;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function ActivityCard({ activity, dayIdx, actIdx, dragHandleProps }: Props) {
  const [editing, setEditing] = useState(false);
  const { updateActivity } = useTripStore();

  const icon = TYPE_ICONS[activity.type] ?? TYPE_ICONS.default;

  return (
    <>
      <div className="flex gap-3 group">
        <div
          {...dragHandleProps}
          className="mt-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 select-none px-0.5"
          title="Drag to reorder" aria-label="Drag to reorder this activity"
        >
          ⣿
        </div>
        <div className="flex-1 bg-white border border-slate-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <span className="text-lg leading-none mt-0.5">{icon}</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {activity.time}
                  </span>
                  <span className="font-semibold text-slate-800 text-sm">{activity.name}</span>
                  {activity.booking_required && (
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                      Book ahead
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{activity.description}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                  <span>📍 {activity.address}</span>
                  <span>⏱ {activity.duration_minutes} min</span>
                  <span>💰 {activity.estimated_cost}</span>
                </div>
                {activity.tips && (
                  <p className="text-xs text-slate-400 mt-1.5 italic">💡 {activity.tips}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-slate-400 hover:text-blue-600 whitespace-nowrap px-2 py-1 rounded hover:bg-blue-50 transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <EditModal
          activity={activity}
          onSave={(patch) => updateActivity(dayIdx, actIdx, patch)}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
