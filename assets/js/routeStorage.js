// Route data storage and history management
let routePoints = [];
let routeHistory = []; // For undo functionality

// Add point to route storage
function addPointToStorage(lat, lng, ele = 0) {
  const point = {
    lat: lat,
    lng: lng,
    ele: ele
  };
  routePoints.push(point);
}

// Save current state to history
function saveToHistory() {
  routeHistory.push(JSON.parse(JSON.stringify(routePoints)));
}

// Restore from history state
function restoreFromHistory(state) {
  routePoints = JSON.parse(JSON.stringify(state));
}

// Clear all route data
function clearRouteData() {
  routePoints = [];
  routeHistory = [];
}

// Get route data
function getRouteData() {
  return routePoints;
}

// Get route length
function getRouteLength() {
  return routePoints.length;
}

// Remove last point from storage
function removeLastPointFromStorage() {
  if (routePoints.length > 0) {
    routePoints.pop();
  }
}
