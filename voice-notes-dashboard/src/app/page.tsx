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
  const [stage, setStage] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setStage('processing');
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/context-from-voice', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setStage('done');
      onSaved();
    } catch (err: any) {
      setError(err.message);
      setStage('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <h2 className="text-[#00ff88] font-mono text-sm uppercase tracking-widest">weekend context</h2>
          <button onClick={onClose} className="text-[#888] hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="p-6">
          {stage === 'idle' && (
            <>
              <p className="text-[#888] font-mono text-xs mb-4 leading-relaxed">
                record a quick voice note saying where you were, who you were with, and when — the app will extract the details and tag your recordings automatically.
              </p>
              <p className="text-[#555] font-mono text-[10px] mb-5 italic">
                e.g. "I was in Berlin at CDV on Friday night into Saturday morning, I was with Tom and Maria, really energetic techno night"
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".m4a,.mp3,.wav"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-[#00ff88] text-black font-mono text-sm py-3 rounded hover:bg-[#00dd77] transition-colors"
              >
                ↑ upload context voice note
              </button>
            </>
          )}

          {stage === 'processing' && (
            <div className="text-center py-6">
              <p className="text-[#00ff88] font-mono text-sm animate-pulse">transcribing + extracting context...</p>
            </div>
          )}

          {stage === 'done' && result && (
            <div className="space-y-3">
              <p className="text-[#00ff88] font-mono text-xs uppercase tracking-wider">extracted</p>
              <div className="bg-[#111] border border-[#2a2a2a] rounded p-3 space-y-1.5 text-xs font-mono">
                {result.extracted.city && <p><span className="text-[#555]">city:</span> <span className="text-[#f0f0f0]">{result.extracted.city}</span></p>}
                {result.extracted.venue && <p><span className="text-[#555]">venue:</span> <span className="text-[#f0f0f0]">{result.extracted.venue}</span></p>}
                {result.extracted.people?.length > 0 && <p><span className="text-[#555]">with:</span> <span className="text-[#f0f0f0]">{result.extracted.people.join(', ')}</span></p>}
                {result.extracted.vibe && <p><span className="text-[#555]">vibe:</span> <span className="text-[#f0f0f0]">{result.extracted.vibe}</span></p>}
                {result.extracted.date_from && <p><span className="text-[#555]">from:</span> <span className="text-[#f0f0f0]">{new Date(result.extracted.date_from).toLocaleString()}</span></p>}
                {result.extracted.date_to && <p><span className="text-[#555]">to:</span> <span className="text-[#f0f0f0]">{new Date(result.extracted.date_to).toLocaleString()}</span></p>}
              </div>
              <p className="text-[#555] font-mono text-[10px]">
                {result.linkedCount} recording{result.linkedCount !== 1 ? 's' : ''} tagged
              </p>
              <p className="text-[#444] font-mono text-[10px] italic line-clamp-2">"{result.transcript}"</p>
              <button onClick={onClose} className="w-full bg-[#333] text-[#aaa] font-mono text-sm py-2 rounded hover:bg-[#444] transition-colors mt-2">done</button>
            </div>
          )}

          {stage === 'error' && (
            <div className="space-y-3">
              <p className="text-red-400 font-mono text-xs">{error}</p>
              <button onClick={() => setStage('idle')} className="w-full bg-[#333] text-[#aaa] font-mono text-sm py-2 rounded hover:bg-[#444] transition-colors">try again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface NoteCardProps {
  note: Note;
  onToggleCleanup: (id: number) => void;
  onPlay: (id: number) => void;
  onProcess: (id: number) => void;
  isPlaying: boolean;
  activeNoteId: number | null;
  processing: boolean;
}

function NoteCard({ note, onToggleCleanup, onPlay, onProcess, isPlaying, activeNoteId, processing }: NoteCardProps) {
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
          {note.status === 'unprocessed' || note.status === 'error' ? (
            <button
              onClick={() => onProcess(note.id)}
              disabled={processing}
              className="text-[10px] font-mono px-2 py-0.5 rounded border bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30 hover:bg-[#00ff88]/20 disabled:opacity-50 transition-colors"
            >
              {processing ? 'processing...' : '▶ process'}
            </button>
          ) : (
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
          )}
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
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleProcess = async (id: number) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: note.file_path, noteId: id }),
      });
      fetchNotes();
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        alert(`Upload failed: ${err.error}`);
      }
    }
    setUploading(false);
    fetchNotes();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
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
            <input
              ref={fileInputRef}
              type="file"
              accept=".m4a,.mp3,.wav"
              multiple
              className="hidden"
              onChange={e => handleUpload(e.target.files)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs font-mono px-3 py-1.5 bg-[#1a1a1a] border border-[#333] text-[#aaa] rounded hover:border-[#00ff88] hover:text-[#00ff88] disabled:opacity-50 transition-colors"
            >
              {uploading ? 'uploading...' : '↑ upload'}
            </button>
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
      <main
        className="max-w-7xl mx-auto px-6 py-6"
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-dashed border-[#00ff88] rounded-xl px-16 py-12 text-center">
              <p className="text-[#00ff88] font-mono text-lg">drop to upload</p>
              <p className="text-[#555] font-mono text-xs mt-1">.m4a · .mp3 · .wav</p>
            </div>
          </div>
        )}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-[#555] font-mono text-sm animate-pulse">loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div
            className="text-center py-20 border-2 border-dashed border-[#222] rounded-xl cursor-pointer hover:border-[#333] transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="text-[#444] font-mono text-sm mb-2">no notes found</p>
            <p className="text-[#333] font-mono text-xs">
              {typeFilter !== 'all' || locationFilter || statusFilter !== 'all'
                ? 'try adjusting your filters'
                : 'drag & drop .m4a files here, or click to upload'}
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
                onProcess={handleProcess}
                isPlaying={isPlaying}
                activeNoteId={activeNoteId}
                processing={processingIds.has(note.id)}
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
