'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

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
  track_id: string | null;
  bars: string | null;
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

type SegmentForm = { city: string; venue: string; people: string; vibe: string; date_from: string; date_to: string; };

const emptySegment = (): SegmentForm => ({ city: '', venue: '', people: '', vibe: '', date_from: '', date_to: '' });

const toLocal = (iso: string | null) => {
  if (!iso) return '';
  try { return new Date(iso).toISOString().slice(0, 16); } catch { return ''; }
};

interface WeekendModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function WeekendModal({ onClose, onSaved }: WeekendModalProps) {
  const [stage, setStage] = useState<'idle' | 'processing' | 'review' | 'saving' | 'saved' | 'error'>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [totalLinked, setTotalLinked] = useState(0);
  const [segments, setSegments] = useState<SegmentForm[]>([emptySegment()]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateSegment = (i: number, field: keyof SegmentForm, value: string) => {
    setSegments(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const handleFile = async (file: File) => {
    setStage('processing');
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/context-from-voice', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTranscript(data.transcript);
      setSegments((data.segments || [data.extracted]).map((s: any) => ({
        city: s?.city || '',
        venue: s?.venue || '',
        people: Array.isArray(s?.people) ? s.people.join(', ') : (s?.people || ''),
        vibe: s?.vibe || '',
        date_from: toLocal(s?.date_from),
        date_to: toLocal(s?.date_to),
      })));
      setStage('review');
    } catch (err: any) {
      setError(err.message);
      setStage('error');
    }
  };

  const handleSave = async () => {
    setStage('saving');
    let linked = 0;
    try {
      for (const seg of segments) {
        const res = await fetch('/api/weekend-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...seg,
            date_from: seg.date_from ? new Date(seg.date_from).toISOString() : null,
            date_to: seg.date_to ? new Date(seg.date_to).toISOString() : null,
            notes: transcript || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        linked += data.linkedCount || 0;
      }
      setTotalLinked(linked);
      setStage('saved');
      onSaved();
    } catch (err: any) {
      setError(err.message);
      setStage('error');
    }
  };

  const ic = "w-full bg-[#222] border border-[#333] rounded px-2 py-1.5 text-xs font-mono text-[#f0f0f0] placeholder-[#555] focus:outline-none focus:border-[#00ff88]";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <h2 className="text-[#00ff88] font-mono text-sm uppercase tracking-widest">add context</h2>
          <button onClick={onClose} className="text-[#888] hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="p-5">
          {stage === 'idle' && (
            <div className="space-y-4">
              <p className="text-[#888] font-mono text-xs leading-relaxed">
                describe your whole weekend in one voice note — multiple cities and venues will be extracted as separate segments.
              </p>
              <p className="text-[#555] font-mono text-[10px] italic">
                e.g. "Friday in Berlin at Tresor, then flew to Bucharest Saturday for Platformer Wolf with Cap and Giles"
              </p>
              <input ref={fileInputRef} type="file" accept=".m4a,.mp3,.wav" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full bg-[#00ff88] text-black font-mono text-sm py-3 rounded hover:bg-[#00dd77] transition-colors">
                ↑ upload context voice note
              </button>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-[#222]" /><span className="text-[#444] text-[10px] font-mono">or</span><div className="flex-1 h-px bg-[#222]" />
              </div>
              <button onClick={() => setStage('review')}
                className="w-full bg-[#1a1a1a] border border-[#333] text-[#666] font-mono text-xs py-2 rounded hover:border-[#555] hover:text-[#888] transition-colors">
                enter manually
              </button>
            </div>
          )}

          {stage === 'processing' && (
            <div className="text-center py-8">
              <p className="text-[#00ff88] font-mono text-sm animate-pulse">transcribing + extracting locations...</p>
            </div>
          )}

          {(stage === 'review' || stage === 'saving') && (
            <div className="space-y-4">
              {transcript && <p className="text-[#444] font-mono text-[10px] italic line-clamp-2">"{transcript}"</p>}

              {segments.map((seg, i) => (
                <div key={i} className="border border-[#2a2a2a] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#00ff88] font-mono text-[10px] uppercase tracking-wider">
                      {segments.length > 1 ? `segment ${i + 1}` : 'location'}
                    </span>
                    {segments.length > 1 && (
                      <button onClick={() => setSegments(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-[#444] hover:text-red-400 text-xs transition-colors">✕</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">city</label>
                      <input className={ic} value={seg.city} onChange={e => updateSegment(i, 'city', e.target.value)} placeholder="Berlin" />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">venue</label>
                      <input className={ic} value={seg.venue} onChange={e => updateSegment(i, 'venue', e.target.value)} placeholder="Tresor" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">with</label>
                    <input className={ic} value={seg.people} onChange={e => updateSegment(i, 'people', e.target.value)} placeholder="comma separated names" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">vibe</label>
                    <input className={ic} value={seg.vibe} onChange={e => updateSegment(i, 'vibe', e.target.value)} placeholder="dark, energetic..." />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">from</label>
                      <input type="datetime-local" className={ic} value={seg.date_from} onChange={e => updateSegment(i, 'date_from', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">to</label>
                      <input type="datetime-local" className={ic} value={seg.date_to} onChange={e => updateSegment(i, 'date_to', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={() => setSegments(prev => [...prev, emptySegment()])}
                className="w-full border border-dashed border-[#333] text-[#555] font-mono text-xs py-2 rounded hover:border-[#555] hover:text-[#777] transition-colors">
                + add another location
              </button>

              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} disabled={stage === 'saving'}
                  className="flex-1 bg-[#00ff88] text-black font-mono text-sm py-2 rounded hover:bg-[#00dd77] disabled:opacity-50 transition-colors">
                  {stage === 'saving' ? 'saving...' : `save + tag (${segments.length} location${segments.length > 1 ? 's' : ''})`}
                </button>
                <button onClick={() => setStage('idle')}
                  className="px-4 bg-[#222] text-[#666] font-mono text-xs py-2 rounded hover:bg-[#333] transition-colors">back</button>
              </div>
            </div>
          )}

          {stage === 'saved' && (
            <div className="space-y-3 text-center py-4">
              <p className="text-[#00ff88] font-mono text-sm">saved {segments.length} location{segments.length > 1 ? 's' : ''}</p>
              <p className="text-[#555] font-mono text-xs">{totalLinked} recording{totalLinked !== 1 ? 's' : ''} tagged</p>
              <button onClick={onClose} className="w-full bg-[#333] text-[#aaa] font-mono text-sm py-2 rounded hover:bg-[#444] transition-colors">done</button>
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
  onUpdate: (id: number, updates: Partial<Note>) => void;
  isPlaying: boolean;
  activeNoteId: number | null;
  processing: boolean;
}

function NoteCard({ note, onToggleCleanup, onPlay, onProcess, onUpdate, isPlaying, activeNoteId, processing }: NoteCardProps) {
  let rhymes: string[] = [];
  let keyPhrases: string[] = [];
  try { rhymes = JSON.parse(note.rhymes || '[]'); } catch {}
  const [generatingBars, setGeneratingBars] = useState(false);
  const [showBars, setShowBars] = useState(false);
  const [barsVal, setBarsVal] = useState(note.bars || '');

  const handleGenerateBars = async () => {
    setGeneratingBars(true);
    const res = await fetch(`/api/notes/${note.id}/generate-bars`, { method: 'POST' });
    const data = await res.json();
    if (data.bars) {
      setBarsVal(data.bars);
      onUpdate(note.id, { bars: data.bars });
      setShowBars(true);
    }
    setGeneratingBars(false);
  };

  const saveBars = async () => {
    if (barsVal !== note.bars) {
      await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bars: barsVal }),
      });
      onUpdate(note.id, { bars: barsVal });
    }
  };
  try { keyPhrases = JSON.parse(note.key_phrases || '[]'); } catch {}

  const cities = note.context_cities ? note.context_cities.split(',').filter(Boolean) : [];
  const venues = note.context_venues ? note.context_venues.split(',').filter(Boolean) : [];

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(note.ai_title || '');
  const [editingTags, setEditingTags] = useState(false);
  const [tagsVal, setTagsVal] = useState(keyPhrases.join(', '));
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [transcriptVal, setTranscriptVal] = useState(note.transcript || '');
  const [editingTrackId, setEditingTrackId] = useState(false);
  const [trackIdVal, setTrackIdVal] = useState((note as any).track_id || '');

  const patch = async (fields: Record<string, any>) => {
    await fetch(`/api/notes/${note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    onUpdate(note.id, fields as any);
  };

  const saveTitle = async () => {
    setEditingTitle(false);
    if (titleVal !== note.ai_title) await patch({ ai_title: titleVal });
  };

  const saveTags = async () => {
    setEditingTags(false);
    const newPhrases = tagsVal.split(',').map(s => s.trim()).filter(Boolean);
    const newJson = JSON.stringify(newPhrases);
    if (newJson !== note.key_phrases) await patch({ key_phrases: newJson });
  };

  const saveTranscript = async () => {
    setEditingTranscript(false);
    if (transcriptVal !== note.transcript) await patch({ transcript: transcriptVal });
  };

  const saveTrackId = async () => {
    setEditingTrackId(false);
    if (trackIdVal !== (note as any).track_id) await patch({ track_id: trackIdVal });
  };

  return (
    <div className={`bg-[#1a1a1a] border rounded-lg p-4 transition-all ${
      activeNoteId === note.id ? 'border-[#00ff88]' : 'border-[#2a2a2a] hover:border-[#444]'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-[#555] font-mono truncate mb-0.5">{note.original_filename}</p>
          {editingTitle ? (
            <input
              autoFocus
              value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
              className="w-full bg-[#222] border border-[#00ff88]/50 rounded px-2 py-0.5 text-sm font-mono text-[#f0f0f0] focus:outline-none"
            />
          ) : (
            <h3
              className="text-[#f0f0f0] font-mono text-sm leading-tight cursor-pointer hover:text-[#00ff88] transition-colors group"
              onClick={() => setEditingTitle(true)}
              title="click to edit title"
            >
              {note.ai_title || (note.type === 'reference' ? 'untitled reference' : 'untitled')}
              <span className="text-[#444] ml-1 opacity-0 group-hover:opacity-100 text-[10px]">✎</span>
            </h3>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusDot status={note.status} />
          <TypeBadge type={note.type} />
        </div>
      </div>

      {/* BPM + Track ID for reference tracks */}
      {note.type === 'reference' && (
        <div className="mb-2 space-y-1">
          {note.bpm && (
            <div>
              <span className="text-[#00ff88] font-mono text-lg font-semibold">{note.bpm}</span>
              <span className="text-[#555] text-xs ml-1">bpm</span>
            </div>
          )}
          {editingTrackId ? (
            <input
              autoFocus
              value={trackIdVal}
              onChange={e => setTrackIdVal(e.target.value)}
              onBlur={saveTrackId}
              onKeyDown={e => { if (e.key === 'Enter') saveTrackId(); if (e.key === 'Escape') setEditingTrackId(false); }}
              placeholder="artist — track name"
              className="w-full bg-[#222] border border-[#00ff88]/50 rounded px-2 py-0.5 text-xs font-mono text-[#f0f0f0] focus:outline-none"
            />
          ) : (
            <div
              className="cursor-pointer group text-xs font-mono"
              onClick={() => setEditingTrackId(true)}
              title="click to add track ID"
            >
              {trackIdVal
                ? <span className="text-yellow-300">{trackIdVal} <span className="text-[#444] opacity-0 group-hover:opacity-100">✎</span></span>
                : <span className="text-[#333] hover:text-[#555] transition-colors">+ track id / shazam</span>
              }
            </div>
          )}
        </div>
      )}

      {/* Transcript — editable */}
      {(note.type === 'spoken' || note.transcript) && (
        <div className="mb-2">
          {editingTranscript ? (
            <textarea
              autoFocus
              value={transcriptVal}
              onChange={e => setTranscriptVal(e.target.value)}
              onBlur={saveTranscript}
              onKeyDown={e => { if (e.key === 'Escape') setEditingTranscript(false); }}
              rows={4}
              className="w-full bg-[#222] border border-[#00ff88]/50 rounded px-2 py-1 text-xs font-mono text-[#f0f0f0] focus:outline-none resize-none"
            />
          ) : note.transcript ? (
            <p
              className="text-[#777] text-xs font-mono leading-relaxed line-clamp-2 cursor-pointer hover:text-[#999] transition-colors group"
              onClick={() => setEditingTranscript(true)}
              title="click to edit transcript"
            >
              "{note.transcript}"
              <span className="text-[#444] ml-1 opacity-0 group-hover:opacity-100">✎</span>
            </p>
          ) : null}
        </div>
      )}

      {/* Bars */}
      {(note.type === 'spoken' || note.transcript) && (
        <div className="mb-2">
          {barsVal ? (
            <div>
              <button
                onClick={() => setShowBars(v => !v)}
                className="text-[10px] font-mono text-purple-400 hover:text-purple-200 transition-colors mb-1"
              >
                ✦ bars {showBars ? '▲' : '▼'}
              </button>
              {showBars && (
                <textarea
                  value={barsVal}
                  onChange={e => setBarsVal(e.target.value)}
                  onBlur={saveBars}
                  rows={Math.min(12, barsVal.split('\n').length + 1)}
                  className="w-full bg-[#0d0d1a] border border-purple-900 rounded px-2 py-1.5 text-xs font-mono text-purple-100 focus:outline-none focus:border-purple-500 resize-none whitespace-pre-wrap leading-relaxed"
                />
              )}
            </div>
          ) : (
            <button
              onClick={handleGenerateBars}
              disabled={generatingBars || !note.transcript}
              className="text-[10px] font-mono text-purple-600 hover:text-purple-400 disabled:opacity-30 transition-colors"
            >
              {generatingBars ? '✦ writing bars...' : '✦ write bars'}
            </button>
          )}
        </div>
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

      {/* Key phrases — editable */}
      <div className="mb-2">
        {editingTags ? (
          <input
            autoFocus
            value={tagsVal}
            onChange={e => setTagsVal(e.target.value)}
            onBlur={saveTags}
            onKeyDown={e => { if (e.key === 'Enter') saveTags(); if (e.key === 'Escape') setEditingTags(false); }}
            placeholder="comma separated tags"
            className="w-full bg-[#222] border border-[#00ff88]/50 rounded px-2 py-0.5 text-xs font-mono text-[#f0f0f0] focus:outline-none"
          />
        ) : keyPhrases.length > 0 ? (
          <div className="flex flex-wrap gap-1 cursor-pointer group" onClick={() => setEditingTags(true)} title="click to edit tags">
            {keyPhrases.slice(0, 6).map((p, i) => (
              <span key={i} className="text-[10px] bg-[#1a2a1a] text-[#00ff88] border border-[#1a4a1a] px-1.5 py-0.5 rounded font-mono group-hover:border-[#00ff88]/40 transition-colors">
                {p}
              </span>
            ))}
            <span className="text-[10px] text-[#333] opacity-0 group-hover:opacity-100 font-mono">✎</span>
          </div>
        ) : (
          <button onClick={() => setEditingTags(true)} className="text-[10px] text-[#444] font-mono hover:text-[#666] transition-colors">
            + add tags
          </button>
        )}
      </div>

      {/* Location + venue tags */}
      {(cities.length > 0 || venues.length > 0) && (
        <div className="flex flex-wrap gap-1 mb-2">
          {cities.map((city, i) => (
            <span key={`c${i}`} className="text-[10px] bg-[#1a1a2a] text-blue-300 border border-blue-900 px-1.5 py-0.5 rounded font-mono">
              📍 {city}
            </span>
          ))}
          {venues.map((venue, i) => (
            <span key={`v${i}`} className="text-[10px] bg-[#1a1a2a] text-indigo-300 border border-indigo-900 px-1.5 py-0.5 rounded font-mono">
              ♪ {venue}
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

// Deterministic color per city name
function cityColor(city: string | null): string {
  if (!city) return '#555';
  const colors = ['#7c3aed','#0ea5e9','#f59e0b','#10b981','#ef4444','#ec4899','#8b5cf6','#06b6d4'];
  let hash = 0;
  for (let i = 0; i < city.length; i++) hash = city.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

interface CalendarViewProps {
  contexts: WeekendContext[];
  onUpdate: () => void;
  onAdd: () => void;
}

function CalendarView({ contexts, onUpdate, onAdd }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [editing, setEditing] = useState<WeekendContext | null>(null);
  const [form, setForm] = useState({ city: '', venue: '', people: '', vibe: '', date_from: '', date_to: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toLocal = (iso: string | null) => {
    if (!iso) return '';
    try { return new Date(iso).toISOString().slice(0, 16); } catch { return ''; }
  };

  const openEdit = (ctx: WeekendContext) => {
    setEditing(ctx);
    setForm({
      city: ctx.city || '', venue: ctx.venue || '',
      people: ctx.people || '', vibe: ctx.vibe || '',
      date_from: toLocal(ctx.date_from), date_to: toLocal(ctx.date_to),
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    await fetch(`/api/weekend-context/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        date_from: form.date_from ? new Date(form.date_from).toISOString() : null,
        date_to: form.date_to ? new Date(form.date_to).toISOString() : null,
      }),
    });
    setSaving(false);
    setEditing(null);
    onUpdate();
  };

  const handleDelete = async () => {
    if (!editing) return;
    setDeleting(true);
    await fetch(`/api/weekend-context/${editing.id}`, { method: 'DELETE' });
    setDeleting(false);
    setEditing(null);
    onUpdate();
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)]);

  // Map contexts to days they cover
  const contextsByDay = useMemo(() => {
    const map = new Map<string, WeekendContext[]>();
    for (const ctx of contexts) {
      if (!ctx.date_from) continue;
      const from = new Date(ctx.date_from);
      const to = ctx.date_to ? new Date(ctx.date_to) : from;
      const cur = new Date(from);
      while (cur <= to) {
        const key = cur.toISOString().slice(0, 10);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(ctx);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [contexts]);

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const ic = "w-full bg-[#222] border border-[#333] rounded px-2 py-1.5 text-xs font-mono text-[#f0f0f0] placeholder-[#555] focus:outline-none focus:border-[#00ff88]";

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Month nav */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }}
          className="text-[#555] hover:text-[#aaa] font-mono text-sm px-2 py-1 rounded border border-[#222] hover:border-[#333] transition-colors">←</button>
        <span className="text-[#f0f0f0] font-mono text-sm w-24 text-center">{monthNames[month]} {year}</span>
        <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }}
          className="text-[#555] hover:text-[#aaa] font-mono text-sm px-2 py-1 rounded border border-[#222] hover:border-[#333] transition-colors">→</button>
        <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}
          className="text-[10px] font-mono text-[#555] hover:text-[#aaa] transition-colors ml-2">today</button>
        <button onClick={onAdd}
          className="ml-auto text-xs font-mono px-3 py-1.5 bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] rounded hover:bg-[#00ff88]/20 transition-colors">
          + add context
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-[10px] font-mono text-[#444] text-center py-1">{d}</div>
        ))}
      </div>

      {/* Weeks */}
      <div className="space-y-px">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-px">
            {week.map((day, di) => {
              if (!day) return <div key={di} className="bg-[#0d0d0d] min-h-[80px] rounded" />;
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const dayContexts = contextsByDay.get(dateStr) || [];
              return (
                <div key={di}
                  className={`bg-[#1a1a1a] min-h-[80px] rounded p-1.5 border transition-colors ${isToday ? 'border-[#00ff88]/40' : 'border-[#222] hover:border-[#333]'}`}
                >
                  <span className={`text-[11px] font-mono block mb-1 ${isToday ? 'text-[#00ff88]' : 'text-[#444]'}`}>{day}</span>
                  <div className="space-y-0.5">
                    {dayContexts.map((ctx, i) => (
                      <button key={i} onClick={() => openEdit(ctx)}
                        className="w-full text-left text-[9px] font-mono px-1.5 py-0.5 rounded truncate hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: cityColor(ctx.city) + '33', color: cityColor(ctx.city), border: `1px solid ${cityColor(ctx.city)}44` }}
                      >
                        {ctx.venue || ctx.city || 'context'}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-[#333]">
              <h2 className="text-[#00ff88] font-mono text-sm uppercase tracking-widest">edit context</h2>
              <button onClick={() => setEditing(null)} className="text-[#888] hover:text-white text-lg">×</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">city</label>
                  <input className={ic} value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">venue</label>
                  <input className={ic} value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">with</label>
                <input className={ic} value={form.people} onChange={e => setForm({...form, people: e.target.value})} placeholder="comma separated" />
              </div>
              <div>
                <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">vibe</label>
                <input className={ic} value={form.vibe} onChange={e => setForm({...form, vibe: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">from</label>
                  <input type="datetime-local" className={ic} value={form.date_from} onChange={e => setForm({...form, date_from: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">to</label>
                  <input type="datetime-local" className={ic} value={form.date_to} onChange={e => setForm({...form, date_to: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-[#00ff88] text-black font-mono text-sm py-2 rounded hover:bg-[#00dd77] disabled:opacity-50 transition-colors">
                  {saving ? 'saving...' : 'save'}
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="px-4 bg-[#2a1a1a] text-red-400 font-mono text-xs py-2 rounded border border-red-900 hover:bg-[#3a1a1a] disabled:opacity-50 transition-colors">
                  {deleting ? '...' : 'delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState<'notes' | 'calendar'>('notes');
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
  const [processingAll, setProcessingAll] = useState(false);
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

  const handleUpdate = (id: number, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

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

  const handleProcessAll = async () => {
    const unprocessed = notes.filter(n => n.status === 'unprocessed' || n.status === 'error');
    if (unprocessed.length === 0) return;
    setProcessingAll(true);
    for (const note of unprocessed) {
      setProcessingIds(prev => new Set(prev).add(note.id));
      await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: note.file_path, noteId: note.id }),
      });
      setProcessingIds(prev => { const s = new Set(prev); s.delete(note.id); return s; });
      await fetchNotes();
    }
    setProcessingAll(false);
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
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-[#00ff88] font-mono text-xl tracking-tight">voice notes</h1>
              <p className="text-[#555] text-[11px] font-mono mt-0.5">
                {notes.length} notes · {spokenCount} spoken · {referenceCount} reference
                {unprocessedCount > 0 && ` · ${unprocessedCount} pending`}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-[#111] border border-[#222] rounded p-0.5">
              {(['notes', 'calendar'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`text-[11px] font-mono px-3 py-1 rounded transition-colors ${tab === t ? 'bg-[#00ff88] text-black' : 'text-[#555] hover:text-[#aaa]'}`}>
                  {t}
                </button>
              ))}
            </div>
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
            {notes.some(n => n.status === 'unprocessed' || n.status === 'error') && (
              <button
                onClick={handleProcessAll}
                disabled={processingAll}
                className="text-xs font-mono px-3 py-1.5 bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] rounded hover:bg-[#00ff88]/20 disabled:opacity-50 transition-colors"
              >
                {processingAll ? `processing ${processingIds.size > 0 ? `(${notes.filter(n => n.status === 'processed').length}/${notes.length})` : '...'}` : `▶▶ process all (${notes.filter(n => n.status === 'unprocessed' || n.status === 'error').length})`}
              </button>
            )}
            <button
              onClick={() => setShowWeekendModal(true)}
              className="text-xs font-mono px-3 py-1.5 bg-[#1a1a1a] border border-[#333] text-[#aaa] rounded hover:border-[#00ff88] hover:text-[#00ff88] transition-colors"
            >
              + add context
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

      {tab === 'calendar' && <CalendarView contexts={contexts} onUpdate={fetchContexts} onAdd={() => setShowWeekendModal(true)} />}

      {/* Filter bar — notes tab only */}
      {tab === 'notes' && <div className="border-b border-[#222] px-6 py-3" style={{}}>

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
      </div>}

      {/* Main content — notes tab */}
      {tab === 'notes' && <main
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
                onUpdate={handleUpdate}
                isPlaying={isPlaying}
                activeNoteId={activeNoteId}
                processing={processingIds.has(note.id)}
              />
            ))}
          </div>
        )}
      </main>}

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
