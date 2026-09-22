// Apply the saved theme before the page paints; storage is optional.
try {
  const saved = localStorage.getItem('theme');
  const dark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
} catch { /* The light theme works when storage is unavailable. */ }
