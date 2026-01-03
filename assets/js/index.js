// Handles offline banner visibility on the landing page
(() => {
  const banner = document.getElementById('offlineBanner');
  if (!banner) return;

  const update = () => {
    const online = navigator.onLine;
    if (online) {
      banner.classList.add('d-none');
    } else {
      banner.classList.remove('d-none');
    }
  };

  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
})();
