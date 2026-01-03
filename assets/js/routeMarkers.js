// Route markers management
let routeMarkers = [];

// Add marker to map
function addMarkerToMap(lat, lng, markerNumber) {
  const marker = L.circleMarker([lat, lng], {
    radius: 4,
    fillColor: '#fff',
    color: '#666',
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.9
  }).addTo(map);

  routeMarkers.push(marker);
  return marker;
}

// Update marker styles (first green, last red)
function updateMarkerStyles() {
  routeMarkers.forEach((marker, index) => {
    if (index === 0) {
      // Start point - green
      marker.setStyle({
        fillColor: '#10b981',
        color: '#059669',
        weight: 2
      });
    } else if (index === routeMarkers.length - 1) {
      // End point - red
      marker.setStyle({
        fillColor: '#ef4444',
        color: '#dc2626',
        weight: 2
      });
    } else {
      // Intermediate points - white
      marker.setStyle({
        fillColor: '#fff',
        color: '#666',
        weight: 1
      });
    }
  });
}

// Remove last marker from map
function removeLastMarker() {
  if (routeMarkers.length > 0) {
    const marker = routeMarkers.pop();
    map.removeLayer(marker);
  }
}

// Clear all markers from map
function clearAllMarkers() {
  routeMarkers.forEach(marker => {
    map.removeLayer(marker);
  });
  routeMarkers = [];
}
