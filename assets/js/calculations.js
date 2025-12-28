// Calculate distance between points using Haversine formula
function calculateDistance(points) {
  let total = 0;
  
  for (let i = 1; i < points.length; i++) {
    const R = 6371; // Earth radius in km
    const lat1 = points[i - 1].lat * Math.PI / 180;
    const lat2 = points[i].lat * Math.PI / 180;
    const dlat = (points[i].lat - points[i - 1].lat) * Math.PI / 180;
    const dlng = (points[i].lng - points[i - 1].lng) * Math.PI / 180;
    
    const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dlng / 2) * Math.sin(dlng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    total += R * c;
  }
  
  return total;
}

// Calculate elevation gain (positive changes only)
function calculateElevation(points) {
  let gain = 0;
  
  for (let i = 1; i < points.length; i++) {
    const diff = points[i].ele - points[i - 1].ele;
    if (diff > 0) gain += diff;
  }
  
  return gain;
}

// Calculate total duration in seconds using first and last timestamps (if present)
function calculateDuration(points) {
  const times = points.map(p => p.time).filter(Boolean);
  if (times.length < 2) return null;

  const start = new Date(times[0]).getTime();
  const end = new Date(times[times.length - 1]).getTime();
  const diffSeconds = Math.max(0, Math.round((end - start) / 1000));

  return Number.isFinite(diffSeconds) ? diffSeconds : null;
}
