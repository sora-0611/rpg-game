const MIN_DISPLAY_MS = 400;

export function initLoadingScreen({ onFinished }) {
  const start = performance.now();

  const finish = () => {
    const elapsed = performance.now() - start;
    setTimeout(onFinished, Math.max(0, MIN_DISPLAY_MS - elapsed));
  };

  if (document.readyState === 'complete') {
    finish();
  } else {
    window.addEventListener('load', finish, { once: true });
  }
}
