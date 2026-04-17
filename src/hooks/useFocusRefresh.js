import { useEffect, useRef } from 'react';

/**
 * Calls `onFocus` whenever the tab becomes visible again or the window
 * regains focus. Useful for pages that should re-fetch their data when
 * the user navigates back to them (e.g., via back button or tab switch).
 *
 * Lightweight alternative to full realtime — no subscriptions, no polling,
 * just a fetch when the user's attention returns.
 *
 * Usage:
 *   useFocusRefresh(() => loadData());
 */
export function useFocusRefresh(onFocus, options = {}) {
  const { enabled = true, debounceMs = 500 } = options;
  const cbRef = useRef(onFocus);
  cbRef.current = onFocus;
  const lastFireRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const fire = () => {
      const now = Date.now();
      if (now - lastFireRef.current < debounceMs) return;
      lastFireRef.current = now;
      try { cbRef.current && cbRef.current(); } catch (e) { console.error('focus-refresh cb error:', e); }
    };

    const onVis = () => { if (document.visibilityState === 'visible') fire(); };
    const onFocusEvt = () => fire();

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onFocusEvt);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onFocusEvt);
    };
  }, [enabled, debounceMs]);
}
