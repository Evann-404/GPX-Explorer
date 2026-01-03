// Route builder - Main orchestrator
let map;

// Base layers definitions
const BASE_LAYERS = {
  osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }),
  topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors, SRTM | © OpenTopoMap (CC-BY-SA)',
    maxZoom: 17
  }),
  satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19
  })
};

// Initialize map when DOM is ready
function initRouteMap() {
  map = L.map('map', {
    center: [48.8566, 2.3522],
    zoom: 6,
    layers: [BASE_LAYERS.osm]
  });

  // Layer control for base maps
  L.control.layers(
    {
      'OSM': BASE_LAYERS.osm,
      'Topo': BASE_LAYERS.topo,
      'Satellite': BASE_LAYERS.satellite
    },
    {},
    { position: 'topright' }
  ).addTo(map);

  // Map click handler to add points
  map.on('click', handleMapClick);

  // Initialize polyline
  initPolyline();
}

// Handle map clicks to add points
function handleMapClick(e) {
  const lat = e.latlng.lat;
  const lng = e.latlng.lng;
  
  addPoint(lat, lng);
}

// Add point to route
async function addPoint(lat, lng, ele = null) {
  // Save current state for undo
  saveToHistory();

  // Show loading indicator
  const statusEl = document.getElementById('loadingStatus');
  if (statusEl) {
    statusEl.setAttribute('data-loading', 'true');
    statusEl.textContent = 'Processing...';
  }

  // Auto-fetch elevation if not provided
  if (ele === null) {
    ele = await getElevation(lat, lng);
  }

  // Add to storage
  addPointToStorage(lat, lng, ele);

  // Add marker to map
  const markerNumber = getRouteLength();
  addMarkerToMap(lat, lng, markerNumber);

  // Update visuals
  await updatePolyline();
  updateMarkerStyles();
  await updateStats();
  updateExportButton();

  // Hide loading indicator
  if (statusEl) {
    statusEl.setAttribute('data-loading', 'false');
    statusEl.textContent = 'Ready';
  }
}

// Remove last point
function undoLastPoint() {
  if (getRouteLength() === 0) return;

  saveToHistory();
  removeLastPointFromStorage();
  removeLastMarker();

  updatePolyline();
  updateMarkerStyles();
  updateStats();
  updateExportButton();
}

// Undo to previous state
async function undo() {
  if (routeHistory.length === 0) return;

  const previousState = routeHistory.pop();
  restoreFromHistory(previousState);

  // Redraw all markers
  clearAllMarkers();
  getRouteData().forEach((point, index) => {
    addMarkerToMap(point.lat, point.lng, index + 1);
  });

  await updatePolyline();
  updateMarkerStyles();
  await updateStats();
  updateExportButton();
}

// Clear all points
async function clearRoute() {
  if (getRouteLength() === 0) return;
  
  if (confirm('Are you sure you want to clear the entire route?')) {
    clearRouteData();
    clearAllMarkers();
    clearRoutingCache();
    await updatePolyline();
    await updateStats();
    updateExportButton();
  }
}

// Update statistics display
async function updateStats() {
  const routedPath = getCurrentRoutedPath();
  const fallbackPoints = getRouteData().map(p => [p.lat, p.lng]);
  const pathForStats = routedPath.length > 1 ? routedPath : fallbackPoints;

  const normalized = normalizeToPointObjects(pathForStats);
  const distance = calculateDistance(normalized);
  const pointCount = getRouteLength();
  const elevation = await calculateElevationFromPath(normalized);

  document.getElementById('routeDistance').textContent = distance.toFixed(2) + ' km';
  document.getElementById('routePoints').textContent = pointCount;
  document.getElementById('routeElevation').textContent = Math.round(elevation) + ' m';
}

// Update export button state
function updateExportButton() {
  const exportBtn = document.getElementById('exportBtn');
  exportBtn.disabled = getRouteLength() < 2;
}

// Export route as GPX
function exportRoute() {
  const routeName = document.getElementById('routeName').value || 'My Route';
  const color = document.getElementById('routeColor').value;
  
  if (getRouteLength() < 2) {
    alert('Please add at least 2 points to create a route.');
    return;
  }

  exportRouteToGPX(routeName, getRouteData(), color);
  alert(`Route "${routeName}" exported successfully!`);
}

// Helpers for stats based on routed path
function normalizeToPointObjects(path) {
  return path.map(p => ({ lat: p.lat ?? p[0], lng: p.lng ?? p[1] }));
}

function samplePoints(path, maxPoints = 120) {
  if (path.length <= maxPoints) return path;
  const step = Math.max(1, Math.ceil(path.length / maxPoints));
  const sampled = [];
  for (let i = 0; i < path.length; i += step) {
    sampled.push(path[i]);
  }
  if (sampled[sampled.length - 1] !== path[path.length - 1]) {
    sampled.push(path[path.length - 1]);
  }
  return sampled;
}

async function calculateElevationFromPath(path) {
  if (path.length < 2) return 0;
  const sampled = samplePoints(path);
  const elevations = await getElevations(sampled);
  let gain = 0;
  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i] - elevations[i - 1];
    if (diff > 0) gain += diff;
  }
  return gain;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  initRouteMap();

  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('clearBtn').addEventListener('click', clearRoute);
  document.getElementById('exportBtn').addEventListener('click', exportRoute);

  // Keyboard shortcut for undo (Ctrl+Z / Cmd+Z)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }
  });

  // Update polyline color when color picker changes
  document.getElementById('routeColor').addEventListener('change', () => {
    updatePolyline();
  });

  // Update stats when name changes (just for input validation)
  document.getElementById('routeName').addEventListener('input', (e) => {
    const exportBtn = document.getElementById('exportBtn');
    if (e.target.value.trim().length > 50) {
      e.target.value = e.target.value.substring(0, 50);
    }
  });

  const routeProfileSelect = document.getElementById('routeProfile');
  if (routeProfileSelect) {
    setRouteProfile(routeProfileSelect.value);
    routeProfileSelect.addEventListener('change', async (e) => {
      setRouteProfile(e.target.value);
      await updatePolyline();
      await updateStats();
    });
  }

  const routingToggle = document.getElementById('enableRouting');
  if (routingToggle) {
    setRoutingEnabled(routingToggle.checked);
    routingToggle.addEventListener('change', async (e) => {
      setRoutingEnabled(e.target.checked);
      await updatePolyline();
      await updateStats();
    });
  }

  // Connectivity awareness: show persistent warning and status when offline
  const handleOffline = () => {
    showApiWarning('Connectivity', 'Offline: routing and elevation unavailable');
    setLoadingStatus('Offline');
  };

  const handleOnline = () => {
    setLoadingStatus('Ready');
  };

  window.addEventListener('offline', handleOffline);
  window.addEventListener('online', handleOnline);

  if (!navigator.onLine) {
    handleOffline();
  }
});
