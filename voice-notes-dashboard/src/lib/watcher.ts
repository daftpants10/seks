import chokidar from 'chokidar';
import path from 'path';
import os from 'os';
import { insertNote } from './db';

let watcherStarted = false;

export function startWatcher() {
  if (watcherStarted) return;
  if (process.env.NODE_ENV === 'production') return;

  const rawPath = process.env.VOICE_MEMOS_PATH || 
    '~/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings';
  
  const watchPath = rawPath.replace(/^~/, os.homedir());

  console.log('[watcher] Watching:', watchPath);

  const watcher = chokidar.watch(watchPath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 500,
    },
  });

  watcher.on('add', async (filePath: string) => {
    if (!filePath.endsWith('.m4a')) return;
    console.log('[watcher] New file detected:', filePath);

    try {
      // Insert into DB first
      const id = insertNote(filePath);
      console.log('[watcher] Inserted note id:', id);

      // Trigger processing via internal API
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, noteId: id }),
      });

      if (!res.ok) {
        console.error('[watcher] Failed to process note:', await res.text());
      }
    } catch (err) {
      console.error('[watcher] Error handling new file:', err);
    }
  });

  watcher.on('error', (err: Error) => {
    console.error('[watcher] Error:', err);
  });

  watcherStarted = true;
  console.log('[watcher] Started successfully');
}
