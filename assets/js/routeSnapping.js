// Route snapping - follows real roads using OSRM routing
let control;
const OSRM_API = 'https://router.project-osrm.org/route/v1';
let routeProfile = 'foot';
let segmentCache = {}; // Cache for routed segments
let routingApiDown = false;
let routingEnabled = true; // When false, force straight lines

// Generate cache key for a segment
function getSegmentKey(fromLat, fromLng, toLat, toLng, profile = routeProfile) {
  return `${profile}:${fromLat.toFixed(5)},${fromLng.toFixed(5)}-${toLat.toFixed(5)},${toLng.toFixed(5)}`;
}

// Initialize routing control
function initRouting() {
  // Control will be created when we have points
}

// Clear segment cache
function clearRoutingCache() {
  segmentCache = {};
}

// Set routing profile and clear cache
function setRouteProfile(profile) {
  if (!profile) return;
  routeProfile = profile;
  clearRoutingCache();
}

// Enable/disable routing; when disabled we draw straight lines
function setRoutingEnabled(enabled) {
  routingEnabled = Boolean(enabled);
  clearRoutingCache();
}

// Get routed path between two points
async function getRoutedPath(fromLat, fromLng, toLat, toLng) {
  if (!routingEnabled) {
    const direct = [[fromLat, fromLng], [toLat, toLng]];
    return direct;
  }

  // Check cache first
  const cacheKey = getSegmentKey(fromLat, fromLng, toLat, toLng);
  if (segmentCache[cacheKey]) {
    return segmentCache[cacheKey];
  }

  // If we know API is down, skip to fallback
  if (routingApiDown) {
    const fallback = [[fromLat, fromLng], [toLat, toLng]];
    segmentCache[cacheKey] = fallback;
    return fallback;
  }

  try {
    setLoadingStatus('Calculating route...');
    const url = `${OSRM_API}/${routeProfile}/${fromLng},${fromLat};${toLng},${toLat}?steps=true&geometries=geojson&overview=full`;
    const response = await fetch(url, { timeout: 8000 });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const coordinates = data.routes[0].geometry.coordinates;
      const result = coordinates.map(coord => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]
      
      // Store in cache
      segmentCache[cacheKey] = result;
      setLoadingStatus('Ready');
      return result;
    }
  } catch (error) {
    console.warn('Routing service error, using straight line:', error);
    if (!routingApiDown) {
      routingApiDown = true;
      showApiWarning('Routing', 'Using straight lines instead of roads');
      setLoadingStatus('Routing API down');
    }
  }
  
  // Fallback to straight line if routing fails
  const fallback = [[fromLat, fromLng], [toLat, toLng]];
  segmentCache[cacheKey] = fallback;
  setLoadingStatus('Ready');
  return fallback;
}

// Get full routed path for all points (optimized with cache)
async function getFullRoutedPath(points) {
  if (points.length < 2) {
    return points.map(p => [p.lat, p.lng]);
  }

  const allCoordinates = [];
  allCoordinates.push([points[0].lat, points[0].lng]);

  for (let i = 1; i < points.length; i++) {
    const routedSegment = await getRoutedPath(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng
    );
    
    // Add all points except the first one (which is already in allCoordinates)
    allCoordinates.push(...routedSegment.slice(1));
  }

  return allCoordinates;
}
