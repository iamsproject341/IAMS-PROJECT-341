import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Subscribes to realtime changes on a set of tables and calls `onChange`
 * whenever any row in any of them is inserted, updated, or deleted.
 *
 * Includes a polling fallback (default 30s) for environments where
 * Supabase realtime is disabled or the connection drops.
 *
 * Usage:
 *   useRealtimeSync(['matches', 'logbooks'], () => loadAnalytics());
 *
 * Notes:
 *   - `onChange` is stored in a ref so callers don't have to memoize it.
 *     The subscription itself is only rebuilt when `tables` changes.
 *   - Pass a stable array (or a useMemo'd one). A new array identity on every
 *     render will cause re-subscriptions.
 */
export function useRealtimeSync(tables, onChange, options = {}) {
  const { pollIntervalMs = 30000, enabled = true } = options;
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  // Stable key for the tables array so we don't resubscribe on every render
  // if the caller passes a new array with the same contents.
  const key = Array.isArray(tables) ? tables.slice().sort().join(',') : '';

  useEffect(() => {
    if (!enabled || !key) return;
    const tableList = key.split(',').filter(Boolean);

    // One channel, many table subscriptions.
    const channelName = 'rt-sync-' + tableList.join('-') + '-' + Math.random().toString(36).slice(2, 8);
    let channel = supabase.channel(channelName);

    for (const t of tableList) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: t },
        (payload) => {
          try { cbRef.current && cbRef.current(payload); } catch (e) { console.error('realtime cb error:', e); }
        }
      );
    }

    channel.subscribe();

    // Polling fallback — fires periodically in case realtime isn't flowing.
    const intv = setInterval(() => {
      try { cbRef.current && cbRef.current({ _source: 'poll' }); } catch (e) { console.error(e); }
    }, pollIntervalMs);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intv);
    };
  }, [key, enabled, pollIntervalMs]);
}
