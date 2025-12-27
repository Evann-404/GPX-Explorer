// Map initialization and management
let map;
const TRACK_COLOR = '#3498db'; // single color for all tracks

// Initialize map when DOM is ready
function initMap() {
  map = L.map('map').setView([48.8566, 2.3522], 6);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
}

// Draw track on map
function drawTrackOnMap(points, color) {
  const polyline = L.polyline(points.map(p => [p.lat, p.lng]), {
    color: TRACK_COLOR,
    weight: 3,
    opacity: 0.8
  }).addTo(map);
  
  return polyline;
}

// Fit map to show all tracks
function fitMapToTracks(polylines) {
  if (polylines.length === 0) return;
  const group = L.featureGroup(polylines);
  map.fitBounds(group.getBounds(), { padding: [50, 50] });
}

