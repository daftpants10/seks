'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface WeekendContext {
  id: number;
  city: string | null;
  venue: string | null;
  people: string | null;
  vibe: string | null;
  date_from: string | null;
  date_to: string | null;
  notes: string | null;
  created_at: string | null;
}

interface Note {
  id: number;
  original_filename: string;
  ai_title: string | null;
  type: 'spoken' | 'reference' | 'unprocessed' | null;
  transcript: string | null;
  rhymes: string | null;
  key_phrases: string | null;
  bpm: number | null;
  file_path: string;
  duration_seconds: number | null;
  created_at: string | null;
  processed_at: string | null;
  needs_cleanup: number;
  status: string;
  context_cities: string | null;
  context_venues: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDuration(secs: number | null): string {
  if (!secs) return '';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TypeBadge({ type }: { type: string | null }) {
  const colors: Record<string, string> = {
    spoken: 'bg-blue-900 text-blue-300 border border-blue-700',
    reference: 'bg-purple-900 text-purple-300 border border-purple-700',
    unprocessed: 'bg-zinc-800 text-zinc-400 border border-zinc-600',
  };
  const cls = colors[type || 'unprocessed'] || colors.unprocessed;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider ${cls}`}>
      {type || 'unprocessed'}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    processed: 'bg-[#00ff88]',
    processing: 'bg-yellow-400 animate-pulse',
    error: 'bg-red-500',
    unprocessed: 'bg-zinc-600',
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || 'bg-zinc-600'}`} title={status} />
  );
}

interface WeekendModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function WeekendModal({ onClose, onSaved }: WeekendModalProps) {
  const [form, setForm] = useState({
    city: '',
    venue: '',
    people: '',
    vibe: '',
    date_from: '',
    date_to: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/weekend-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <h2 className="text-[#00ff88] font-mono text-sm uppercase tracking-widest">weekend context</h2>
          <button onClick={onClose} className="text-[#888] hover:text-white text-lg leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#888] uppercase tracking-wider block mb-1">city</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                placeholder="new york"
                className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 text-sm font-mono text-[#f0f0f0] placeholder-[#555] focus:outline-none focus:border-[#00ff88]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#888] uppercase tracking-wider block mb-1">venue</label>
              <input
                type="text"
                value={form.venue}
                onChange={e => setForm({ ...form, venue: e.target.value })}
                placeholder="the studio"
                className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 text-sm font-mono text-[#f0f0f0] placeholder-[#555] focus:outline-none focus:border-[#00ff88]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[#888] uppercase tracking-wider block mb-1">who you were with</label>
            <input
              type="text"
              value={form.people}
              onChange={e => setForm({ ...form, people: e.target.value })}
              placeholder="comma separated names"
              className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 text-sm font-mono text-[#f0f0f0] placeholder-[#555] focus:outline-none focus:border-[#00ff88]"
            />
          </div>

          <div>
            <label className="text-[10px] text-[#888] uppercase tracking-wider block mb-1">vibe</label>
            <input
              type="text"
              value={form.vibe}
              onChange={e => setForm({ ...form, vibe: e.target.value })}
              placeholder="late night, creative, energetic..."
              className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 text-sm font-mono text-[#f0f0f0] placeholder-[#555] focus:outline-none focus:border-[#00ff88]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#888] uppercase tracking-wider block mb-1">date from</label>
              <input
                type="datetime-local"
                value={form.date_from}
                onChange={e => setForm({ ...form, date_from: e.target.value })}
                required
                className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 text-sm font-mono text-[#f0f0f0] focus:outline-none focus:border-[#00ff88]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#888] uppercase tracking-wider block mb-1">date to</label>
              <input
                type="datetime-local"
                value={form.date_to}
                onChange={e => setForm({ ...form, date_to: e.target.value })}
                required
                className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 text-sm font-mono text-[#f0f0f0] focus:outline-none focus:border-[#00ff88]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[#888] uppercase tracking-wider block mb-1">notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="any other context..."
              rows={2}
              className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 text-sm font-mono text-[#f0f0f0] placeholder-[#555] focus:outline-none focus:border-[#00ff88] resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#00ff88] text-black font-mono text-sm py-2 rounded hover:bg-[#00dd77] disabled:opacity-50 transition-colors"
            >
              {saving ? 'saving...' : 'save context'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 bg-[#333] text-[#aaa] font-mono text-sm py-2 rounded hover:bg-[#444] transition-colors"
            >
              cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface NoteCardProps {
  note: Note;
  onToggleCleanup: (id: number) => void;
  onPlay: (id: number) => void;
  isPlaying: boolean;
  activeNoteId: number | null;
}

function NoteCard({ note, onToggleCleanup, onPlay, isPlaying, activeNoteId }: NoteCardProps) {
  let rhymes: string[] = [];
  let keyPhrases: string[] = [];
  try { rhymes = JSON.parse(note.rhymes || '[]'); } catch {}
  try { keyPhrases = JSON.parse(note.key_phrases || '[]'); } catch {}

  const cities = note.context_cities ? note.context_cities.split(',').filter(Boolean) : [];

  return (
    <div className={`bg-[#1a1a1a] border rounded-lg p-4 transition-all ${
      activeNoteId === note.id ? 'border-[#00ff88]' : 'border-[#2a2a2a] hover:border-[#444]'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-[#555] font-mono truncate mb-0.5">{note.original_filename}</p>
          <h3 className="text-[#f0f0f0] font-mono text-sm leading-tight">
            {note.ai_title || (note.type === 'reference' ? 'untitled reference' : 'untitled')}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusDot status={note.status} />
          <TypeBadge type={note.type} />
        </div>
      </div>

      {/* BPM for reference tracks */}
      {note.type === 'reference' && note.bpm && (
        <div className="mb-2">
          <span className="text-[#00ff88] font-mono text-lg font-semibold">{note.bpm}</span>
          <span className="text-[#555] text-xs ml-1">bpm</span>
        </div>
      )}

      {/* Transcript preview */}
      {note.transcript && (
        <p className="text-[#777] text-xs font-mono leading-relaxed mb-2 line-clamp-2">
          "{note.transcript}"
        </p>
      )}

      {/* Rhymes */}
      {rhymes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {rhymes.slice(0, 4).map((r, i) => (
            <span key={i} className="text-[10px] bg-[#2a1a3a] text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-mono">
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Key phrases */}
      {keyPhrases.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {keyPhrases.slice(0, 5).map((p, i) => (
            <span key={i} className="text-[10px] bg-[#1a2a1a] text-[#00ff88] border border-[#1a4a1a] px-1.5 py-0.5 rounded font-mono">
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Location tags */}
      {cities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {cities.map((city, i) => (
            <span key={i} className="text-[10px] bg-[#1a1a2a] text-blue-300 border border-blue-900 px-1.5 py-0.5 rounded font-mono">
              📍 {city}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#555] font-mono">{formatDate(note.created_at)}</span>
          {note.duration_seconds && (
            <span className="text-[10px] text-[#555] font-mono">{formatDuration(note.duration_seconds)}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleCleanup(note.id)}
            className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
              note.needs_cleanup
                ? 'bg-orange-900 text-orange-300 border-orange-700'
                : 'bg-[#222] text-[#555] border-[#333] hover:border-[#555]'
            }`}
            title="toggle needs cleanup"
          >
            {note.needs_cleanup ? '⚠ cleanup' : 'cleanup?'}
          </button>
          <button
            onClick={() => onPlay(note.id)}
            className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
              activeNoteId === note.id
                ? 'bg-[#00ff88] text-black border-[#00ff88]'
                : 'bg-[#222] text-[#00ff88] border-[#00ff88]/30 hover:border-[#00ff88]'
            }`}
          >
            {activeNoteId === note.id ? (isPlaying ? '⏸ pause' : '▶ play') : '▶ play'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [contexts, setContexts] = useState<WeekendContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showWeekendModal, setShowWeekendModal] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchNotes = useCallback(async () => {
    const params = new URLSearchParams();
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (locationFilter) params.set('location', locationFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);

    const res = await fetch(`/api/notes?${params}`);
    if (res.ok) setNotes(await res.json());
  }, [typeFilter, locationFilter, statusFilter]);

  const fetchContexts = async () => {
    const res = await fetch('/api/weekend-context');
    if (res.ok) setContexts(await res.json());
  };

  useEffect(() => {
    Promise.all([fetchNotes(), fetchContexts()]).finally(() => setLoading(false));
  }, [fetchNotes]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Gather unique cities for tag cloud
  const allCities = Array.from(new Set(
    notes.flatMap(n => n.context_cities ? n.context_cities.split(',').filter(Boolean) : [])
  ));

  const handleToggleCleanup = async (id: number) => {
    const res = await fetch(`/api/notes/${id}/toggle-cleanup`, { method: 'POST' });
    if (res.ok) {
      const { needs_cleanup } = await res.json();
      setNotes(prev => prev.map(n => n.id === id ? { ...n, needs_cleanup } : n));
    }
  };

  const handlePlay = (id: number) => {
    if (activeNoteId === id) {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
      return;
    }

    setActiveNoteId(id);
    setIsPlaying(true);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(`/api/audio/${id}`);
    audioRef.current = audio;
    audio.play();
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsPlaying(false);
      alert('Could not play audio. File may not exist on disk.');
    };
  };

  const handleExport = async () => {
    setExporting(true);
    setExportMsg('');
    try {
      const res = await fetch('/api/export', { method: 'POST' });
      const data = await res.json();
      if (data.authRequired) {
        setExportMsg('Auth required — visit /api/auth/google first');
      } else if (data.url) {
        setExportMsg(`Exported! ${data.url}`);
      } else {
        setExportMsg(data.error || 'Export failed');
      }
    } finally {
      setExporting(false);
    }
  };

  const spokenCount = notes.filter(n => n.type === 'spoken').length;
  const referenceCount = notes.filter(n => n.type === 'reference').length;
  const unprocessedCount = notes.filter(n => n.status === 'unprocessed' || n.status === 'processing').length;

  return (
    <div className="min-h-screen bg-[#111111]">
      {/* Header */}
      <header className="border-b border-[#222] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-[#00ff88] font-mono text-xl tracking-tight">voice notes</h1>
            <p className="text-[#555] text-[11px] font-mono mt-0.5">
              {notes.length} notes · {spokenCount} spoken · {referenceCount} reference
              {unprocessedCount > 0 && ` · ${unprocessedCount} pending`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWeekendModal(true)}
              className="text-xs font-mono px-3 py-1.5 bg-[#1a1a1a] border border-[#333] text-[#aaa] rounded hover:border-[#00ff88] hover:text-[#00ff88] transition-colors"
            >
              + this weekend
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="text-xs font-mono px-3 py-1.5 bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] rounded hover:bg-[#00ff88]/20 disabled:opacity-50 transition-colors"
            >
              {exporting ? 'exporting...' : '↗ export sheets'}
            </button>
          </div>
        </div>
        {exportMsg && (
          <div className="max-w-7xl mx-auto mt-2">
            <p className="text-xs font-mono text-[#aaa] bg-[#1a1a1a] border border-[#333] px-3 py-1.5 rounded">{exportMsg}</p>
          </div>
        )}
      </header>

      {/* Filter bar */}
      <div className="border-b border-[#222] px-6 py-3">
        <div className="max-w-7xl mx-auto space-y-2">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Type filter */}
            <div className="flex items-center gap-1">
              {(['all', 'spoken', 'reference', 'unprocessed'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`text-[11px] font-mono px-3 py-1 rounded transition-colors ${
                    typeFilter === t
                      ? 'bg-[#00ff88] text-black'
                      : 'bg-[#1a1a1a] text-[#888] border border-[#333] hover:border-[#555]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1">
              {(['all', 'processed', 'unprocessed', 'error'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-[11px] font-mono px-3 py-1 rounded transition-colors ${
                    statusFilter === s
                      ? 'bg-[#222] text-[#f0f0f0] border border-[#555]'
                      : 'bg-[#1a1a1a] text-[#666] border border-[#2a2a2a] hover:border-[#444]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Location tag cloud */}
          {allCities.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-[#555] font-mono uppercase tracking-wider">locations:</span>
              {allCities.map(city => (
                <button
                  key={city}
                  onClick={() => setLocationFilter(locationFilter === city ? '' : city)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                    locationFilter === city
                      ? 'bg-blue-900 text-blue-200 border-blue-600'
                      : 'bg-[#1a1a2a] text-blue-400 border-blue-900 hover:border-blue-600'
                  }`}
                >
                  {city}
                </button>
              ))}
              {locationFilter && (
                <button
                  onClick={() => setLocationFilter('')}
                  className="text-[10px] font-mono text-[#555] hover:text-[#aaa] transition-colors"
                >
                  clear ×
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-[#555] font-mono text-sm animate-pulse">loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#444] font-mono text-sm mb-2">no notes found</p>
            <p className="text-[#333] font-mono text-xs">
              {typeFilter !== 'all' || locationFilter || statusFilter !== 'all'
                ? 'try adjusting your filters'
                : 'start recording on your Apple Watch to see notes here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onToggleCleanup={handleToggleCleanup}
                onPlay={handlePlay}
                isPlaying={isPlaying}
                activeNoteId={activeNoteId}
              />
            ))}
          </div>
        )}
      </main>

      {/* Active audio indicator */}
      {activeNoteId && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-[#00ff88]/30 rounded-full px-4 py-2 flex items-center gap-3 shadow-lg">
          <div className={`w-2 h-2 rounded-full bg-[#00ff88] ${isPlaying ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-mono text-[#aaa]">
            {isPlaying ? 'playing' : 'paused'} — note #{activeNoteId}
          </span>
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
              }
              setActiveNoteId(null);
              setIsPlaying(false);
            }}
            className="text-[#555] hover:text-[#aaa] text-xs"
          >
            ×
          </button>
        </div>
      )}

      {showWeekendModal && (
        <WeekendModal
          onClose={() => setShowWeekendModal(false)}
          onSaved={() => {
            fetchContexts();
            fetchNotes();
          }}
        />
      )}
    </div>
  );
}
