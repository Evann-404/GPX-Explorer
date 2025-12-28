// Read colors from CSS variables (can be customized via UI color pickers)
let DEFAULT_TRACK_COLOR = getComputedStyle(document.documentElement)
  .getPropertyValue('--track-default-color').trim() || '#3498db';
let SELECTED_TRACK_COLOR = getComputedStyle(document.documentElement)
  .getPropertyValue('--track-selected-color').trim() || '#e74c3c';
let selectedTrackIndex = null;

// Setup color picker listeners
document.addEventListener('DOMContentLoaded', () => {
  const defaultPicker = document.getElementById('defaultColorPicker');
  const selectedPicker = document.getElementById('selectedColorPicker');
  
  if (defaultPicker) {
    defaultPicker.value = DEFAULT_TRACK_COLOR;
    defaultPicker.addEventListener('input', (e) => {
      DEFAULT_TRACK_COLOR = e.target.value;
      document.documentElement.style.setProperty('--track-default-color', e.target.value);
      updateAllTrackColors();
    });
  }
  
  if (selectedPicker) {
    selectedPicker.value = SELECTED_TRACK_COLOR;
    selectedPicker.addEventListener('input', (e) => {
      SELECTED_TRACK_COLOR = e.target.value;
      document.documentElement.style.setProperty('--track-selected-color', e.target.value);
      updateAllTrackColors();
    });
  }
});

function updateAllTrackColors() {
  if (typeof tracks === 'undefined') return;
  tracks.forEach((track, i) => {
    if (track?.polyline?.setStyle) {
      if (i === selectedTrackIndex) {
        track.polyline.setStyle({ color: SELECTED_TRACK_COLOR, weight: 5, opacity: 1 });
      } else {
        track.polyline.setStyle({ color: DEFAULT_TRACK_COLOR, weight: 3, opacity: 0.8 });
      }
    }
  });
  
  // Update chart color if a track is selected
  if (selectedTrackIndex !== null && elevationChart) {
    elevationChart.data.datasets[0].borderColor = SELECTED_TRACK_COLOR;
    elevationChart.data.datasets[0].backgroundColor = SELECTED_TRACK_COLOR + '2E';
    elevationChart.update('none');
  }
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return 'N/A';
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
}

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
    <li class="track-item ${selectedTrackIndex === idx ? 'selected' : ''}" data-idx="${idx}">
      <span class="name">${t.name}</span>
      <span class="meta">${t.distance.toFixed(2)} km • ${Math.round(t.elevation)} m D+</span>
    </li>
  `).join('');

  const items = Array.from(list.querySelectorAll('.track-item'));
  items.forEach((el) => {
    const i = parseInt(el.getAttribute('data-idx'), 10);
    const t = tracks[i];
    el.addEventListener('mouseenter', () => {
      if (selectedTrackIndex === i) return;
      if (t.polyline && t.polyline.setStyle) t.polyline.setStyle({ weight: 6, opacity: 1 });
    });
    el.addEventListener('mouseleave', () => {
      if (selectedTrackIndex === i) return;
      if (t.polyline && t.polyline.setStyle) t.polyline.setStyle({ weight: 3, opacity: 0.8, color: DEFAULT_TRACK_COLOR });
    });
    el.addEventListener('click', () => {
      handleTrackSelection(tracks, i);
    });
  });
}

// Elevation profile rendering with Chart.js
let elevationChart;

function renderTrackStats(track) {
  const distanceEl = document.getElementById('statDistance');
  const elevationEl = document.getElementById('statElevation');
  const durationEl = document.getElementById('statDuration');
  const nameEl = document.getElementById('selectedTrackName');
  const card = document.getElementById('trackDetailsCard');

  if (!distanceEl || !elevationEl || !durationEl || !card || !nameEl) return;

  if (!track) {
    card.style.display = 'none';
    return;
  }

  card.style.display = 'block';
  nameEl.textContent = track.name || 'Unknown track';
  distanceEl.textContent = `${track.distance?.toFixed ? track.distance.toFixed(2) : '0.00'} km`;
  elevationEl.textContent = `${Math.round(track.elevation || 0)} m`;
  durationEl.textContent = track.duration != null ? formatDuration(track.duration) : 'No time data';
}

function renderElevationProfile(track) {
  const canvas = document.getElementById('elevationChart');
  const placeholder = document.getElementById('elevationPlaceholder');
  const wrapper = document.querySelector('.chart-wrapper');
  if (!canvas) return;

  if (!track || !track.points || track.points.length < 2) {
    if (wrapper) wrapper.classList.add('empty');
    if (placeholder) placeholder.style.display = 'flex';
    if (elevationChart) {
      elevationChart.destroy();
      elevationChart = null;
    }
    return;
  }

  const series = buildElevationSeries(track.points);
  if (wrapper) wrapper.classList.remove('empty');
  if (placeholder) placeholder.style.display = 'none';
  if (elevationChart) elevationChart.destroy();

  elevationChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: series.distanceKm.map(d => d.toFixed(2)),
      datasets: [{
        label: `${track.name} elevation`,
        data: series.elevation,
        borderColor: SELECTED_TRACK_COLOR,
        backgroundColor: 'rgba(231, 76, 60, 0.18)',
        borderWidth: 2,
        tension: 0.25,
        pointRadius: 0,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Distance (km)' } },
        y: { title: { display: true, text: 'Elevation (m)' } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const d = series.distanceKm[ctx.dataIndex] || 0;
              const e = ctx.parsed.y || 0;
              return `${e.toFixed(0)} m @ ${d.toFixed(2)} km`;
            }
          }
        }
      }
    }
  });
}

function buildElevationSeries(points) {
  if (points.length === 0) return { distanceKm: [], elevation: [] };
  
  // First pass: calculate cumulative distance for all points
  const distances = [0];
  const toRad = (deg) => deg * Math.PI / 180;
  const R = 6371;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const dLat = toRad(cur.lat - prev.lat);
    const dLng = toRad(cur.lng - prev.lng);
    const lat1 = toRad(prev.lat);
    const lat2 = toRad(cur.lat);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distances.push(distances[i - 1] + R * c);
  }

  const maxPoints = 2500;
  
  // If we have fewer points than max, return all
  if (points.length <= maxPoints) {
    return {
      distanceKm: distances,
      elevation: points.map(p => p.ele || 0)
    };
  }

  // Smart decimation: keep important elevation changes
  const selected = [0]; // Always keep first point
  const stride = Math.ceil(points.length / maxPoints);
  const elevationThreshold = 5; // Keep points with significant elevation change (meters)

  for (let i = 1; i < points.length - 1; i++) {
    const prevEle = points[i - 1].ele || 0;
    const curEle = points[i].ele || 0;
    const nextEle = points[i + 1].ele || 0;
    
    // Keep if it's a regular stride point or elevation peak/valley
    const isStridePoint = (i % stride === 0);
    const isLocalMax = curEle > prevEle && curEle > nextEle && (curEle - Math.min(prevEle, nextEle) > elevationThreshold);
    const isLocalMin = curEle < prevEle && curEle < nextEle && (Math.max(prevEle, nextEle) - curEle > elevationThreshold);
    
    if (isStridePoint || isLocalMax || isLocalMin) {
      selected.push(i);
    }
  }
  
  selected.push(points.length - 1); // Always keep last point

  return {
    distanceKm: selected.map(i => distances[i]),
    elevation: selected.map(i => points[i].ele || 0)
  };
}

function renderTrackDetails(track) {
  renderTrackStats(track);
  renderElevationProfile(track);
}

function handleTrackSelection(tracks, idx) {
  // Toggle off if same track is clicked
  if (selectedTrackIndex === idx) {
    clearSelection(tracks);
    return;
  }

  selectedTrackIndex = idx;

  // Update map styles: ensure only the selected is red
  tracks.forEach((track, i) => {
    if (track?.polyline?.setStyle) {
      if (i === idx) {
        track.polyline.setStyle({ color: SELECTED_TRACK_COLOR, weight: 5, opacity: 1 });
        if (track.polyline.bringToFront) track.polyline.bringToFront();
      } else {
        track.polyline.setStyle({ color: DEFAULT_TRACK_COLOR, weight: 3, opacity: 0.8 });
      }
    }
  });

  // Update list selection state
  const list = document.getElementById('trackList');
  if (list) {
    list.querySelectorAll('.track-item').forEach((el, i) => {
      el.classList.toggle('selected', i === idx);
    });
  }

  const t = tracks[idx];
  // Focus map and render chart
  if (typeof fitMapToTracks === 'function') fitMapToTracks([t.polyline]);
  renderTrackDetails(t);
}

function clearSelection(tracks) {
  selectedTrackIndex = null;

  // Reset map styles
  tracks.forEach((track) => {
    if (track?.polyline?.setStyle) {
      track.polyline.setStyle({ color: DEFAULT_TRACK_COLOR, weight: 3, opacity: 0.8 });
    }
  });

  // Update list selection state
  const list = document.getElementById('trackList');
  if (list) {
    list.querySelectorAll('.track-item').forEach((el) => {
      el.classList.remove('selected');
    });
  }

  renderTrackDetails(null);
}
