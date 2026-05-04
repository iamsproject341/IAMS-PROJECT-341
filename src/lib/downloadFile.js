/**
 * Triggers a real file save when possible: fetches the URL as a blob so the
 * browser attaches Content-Disposition-style behavior with a filename.
 * Falls back to opening the URL in a new tab if fetch/CORS fails (e.g. some storage configs).
 *
 * @param {string} url
 * @param {string} [filename] suggested file name including extension
 * @returns {Promise<{ mode: 'blob' | 'tab' }>}
 */
export async function downloadFileFromUrl(url, filename) {
  if (!url || typeof url !== 'string') {
    throw new Error('No file URL');
  }
  const safeName = (filename && filename.trim()) || 'download';

  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) {
      throw new Error(`Download failed (${res.status})`);
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = safeName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    return { mode: 'blob' };
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
    return { mode: 'tab' };
  }
}

/**
 * Save text (plain or HTML) as a file using a Blob — works offline, no server.
 *
 * @param {string} content
 * @param {string} filename — should include extension, e.g. `report.txt`
 * @param {string} [mime='text/plain;charset=utf-8']
 */
export function downloadTextAsFile(content, filename, mime = 'text/plain;charset=utf-8') {
  if (typeof content !== 'string') {
    throw new Error('Invalid content');
  }
  const safeName = (filename && filename.trim()) || 'download.txt';
  const blob = new Blob([content], { type: mime });
  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = safeName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
