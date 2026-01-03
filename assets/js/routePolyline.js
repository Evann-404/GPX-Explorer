// Polyline management for route builder
let routePolyline;
let currentRoutedPath = [];

// Initialize empty polyline
function initPolyline() {
  routePolyline = L.polyline([], {
    color: '#3498db',
    weight: 3,
    opacity: 0.8
  }).addTo(map);
}

// Update polyline on map with routing
async function updatePolyline() {
  const points = getRouteData();
  
  if (points.length === 0) {
    routePolyline.setLatLngs([]);
    return;
  }

  // Get routed path if we have multiple points
  let latlngs;
  if (points.length > 1) {
    latlngs = await getFullRoutedPath(points);
  } else {
    latlngs = [[points[0].lat, points[0].lng]];
  }

  routePolyline.setLatLngs(latlngs);
  currentRoutedPath = latlngs;

  // Update polyline color from input
  const color = document.getElementById('routeColor').value;
  routePolyline.setStyle({ color: color });
}

// Expose current routed path for stats calculation
function getCurrentRoutedPath() {
  return currentRoutedPath;
}
