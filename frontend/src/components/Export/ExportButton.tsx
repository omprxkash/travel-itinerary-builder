import { useState } from 'react';
import { api } from '../../api/client';
import type { Itinerary } from '../../api/client';

interface Props {
  itinerary: Itinerary;
}

export function ExportButton({ itinerary }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.exportPdf(itinerary);
    } catch (err) {
      setError('PDF export failed — make sure the backend is running on port 8000');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-full transition-colors"
      >
        {loading ? '⏳ Exporting…' : '📄 Export PDF'}
      </button>
      {error && <p className="text-red-300 text-xs mt-1">{error}</p>}
    </div>
  );
}
