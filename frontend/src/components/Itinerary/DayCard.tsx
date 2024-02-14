import { useState } from 'react';
import type { DayPlan } from '../../api/client';
import { ActivityCard } from './ActivityCard';
import { useTripStore } from '../../store/tripStore';

interface Props {
  day: DayPlan;
  dayIdx: number;
}

export function DayCard({ day, dayIdx }: Props) {
  const [open, setOpen] = useState(true);
  const { reorderActivities } = useTripStore();
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    reorderActivities(dayIdx, dragIdx, targetIdx);
    setDragIdx(null);
  };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-100 transition-colors text-left"
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center">
              {day.day}
            </span>
            <span className="font-semibold text-slate-800 text-sm">{day.theme}</span>
          </div>
          <div className="flex gap-3 mt-1 ml-9 text-xs text-slate-400">
            <span>{day.date}</span>
            <span>·</span>
            <span>{day.daily_budget_estimate}</span>
          </div>
        </div>
        <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {day.activities.map((act, actIdx) => (
            <div
              key={actIdx}
              draggable
              onDragStart={() => handleDragStart(actIdx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(actIdx)}
              className={`transition-opacity ${dragIdx === actIdx ? 'opacity-40' : 'opacity-100'}`}
            >
              <ActivityCard
                activity={act}
                dayIdx={dayIdx}
                actIdx={actIdx}
              />
            </div>
          ))}
          {day.transport_tips && (
            <p className="text-xs text-slate-400 mt-2 px-1">🚇 {day.transport_tips}</p>
          )}
        </div>
      )}
    </div>
  );
}
