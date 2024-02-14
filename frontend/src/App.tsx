import { useTripStore } from './store/tripStore';
import { TripForm } from './components/TripForm/TripForm';
import { ItineraryView } from './components/Itinerary/ItineraryView';
import { TripMap } from './components/Map/TripMap';

function App() {
  const { itinerary, loading } = useTripStore();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3">
        <span className="text-2xl">✈️</span>
        <div>
          <h1 className="font-bold text-slate-900 text-lg leading-none">Travel Planner</h1>
          <p className="text-xs text-slate-400 mt-0.5">Day-by-day itineraries, built offline</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 65px)' }}>
        <aside className="w-[420px] shrink-0 flex flex-col bg-white border-r border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <TripForm />
          </div>
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <div className="text-3xl mb-2 animate-bounce">✈️</div>
                <p className="text-sm">Crafting your itinerary…</p>
              </div>
            </div>
          )}
          {!loading && itinerary && (
            <div className="flex-1 overflow-y-auto p-4">
              <ItineraryView />
            </div>
          )}
          {!loading && !itinerary && (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <div className="text-4xl mb-3">🗺️</div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Fill in the form above to generate a personalised day-by-day itinerary.
                  Your route will appear on the map.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-400">
                  <div className="bg-slate-50 rounded-xl p-2">
                    <div className="text-lg mb-1">🗼</div>Paris
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2">
                    <div className="text-lg mb-1">⛩️</div>Tokyo
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2">
                    <div className="text-lg mb-1">🏟️</div>Rome
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 relative">
          <TripMap />
        </main>
      </div>
    </div>
  );
}

export default App;
