// Update global statistics display
function updateStatsDisplay(tracks) {
  const totalDist = tracks.reduce((sum, t) => sum + t.distance, 0);
  const totalEle = tracks.reduce((sum, t) => sum + t.elevation, 0);
  
  document.getElementById('totalDistance').textContent = totalDist.toFixed(2) + ' km';
  document.getElementById('totalElevation').textContent = Math.round(totalEle) + ' m';
}

// Update track list display
function updateTrackList(tracks) {
  const list = document.getElementById('trackList');
  
  if (tracks.length === 0) {
    list.innerHTML = '<li class="text-muted">No tracks loaded yet</li>';
    return;
  }
  
  list.innerHTML = tracks.map((t, idx) => `
    <li class="track-item" data-idx="${idx}">
      <span class="name">${t.name}</span>
      <span class="meta">${t.distance.toFixed(2)} km • ${Math.round(t.elevation)} m D+</span>
    </li>
  `).join('');

  const items = Array.from(list.querySelectorAll('.track-item'));
  items.forEach((el) => {
    const i = parseInt(el.getAttribute('data-idx'), 10);
    const t = tracks[i];
    el.addEventListener('mouseenter', () => {
      if (t.polyline && t.polyline.setStyle) t.polyline.setStyle({ weight: 6, opacity: 1 });
    });
    el.addEventListener('mouseleave', () => {
      if (t.polyline && t.polyline.setStyle) t.polyline.setStyle({ weight: 3, opacity: 0.8 });
    });
    el.addEventListener('click', () => {
      if (typeof fitMapToTracks === 'function') fitMapToTracks([t.polyline]);
    });
  });
}
