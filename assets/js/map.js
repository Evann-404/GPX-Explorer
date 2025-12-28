// Map initialization and management
let map;
const TRACK_COLOR = '#3498db'; // single color for all tracks

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
function initMap() {
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

