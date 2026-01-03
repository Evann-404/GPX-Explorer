// Elevation fetching - gets altitude automatically from coordinates
const ELEVATION_API = 'https://api.open-elevation.com/api/v1/lookup';
let elevationApiDown = false;

// Show loading status
function setLoadingStatus(message) {
  const statusEl = document.getElementById('loadingStatus');
  const indicator = document.querySelector('.status-indicator');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.classList.remove('text-danger');
    statusEl.classList.remove('text-muted');
    if (message && message.toLowerCase().includes('offline')) {
      statusEl.classList.add('text-danger');
      statusEl.classList.add('fw-semibold');
      if (indicator) {
        indicator.classList.remove('bg-success');
        indicator.classList.add('bg-danger');
      }
    } else {
      if (indicator) {
        indicator.classList.remove('bg-danger');
        indicator.classList.add('bg-success');
      }
      statusEl.classList.add('text-muted');
      statusEl.classList.remove('fw-semibold');
    }
  }
}

// Show API warning
function showApiWarning(service, message) {
  const warningEl = document.getElementById('apiWarning');
  const warningText = document.getElementById('apiWarningText');
  if (warningEl && warningText) {
    warningText.textContent = `${service} service unavailable: ${message}`;
    warningEl.classList.remove('d-none');
  }
}

// Get elevation for a single point
async function getElevation(lat, lng) {
  if (elevationApiDown) {
    return 0; // Skip API call if we know it's down
  }

  try {
    setLoadingStatus('Fetching elevation...');
    const url = `${ELEVATION_API}?locations=${lat},${lng}`;
    const response = await fetch(url, { timeout: 5000 });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      setLoadingStatus('Ready');
      return Math.round(data.results[0].elevation);
    }
  } catch (error) {
    console.warn('Elevation service error:', error);
    elevationApiDown = true;
    showApiWarning('Elevation', 'Using default elevation (0m)');
    setLoadingStatus('Elevation API down');
  }
  
  setLoadingStatus('Ready');
  return 0;
}

// Get elevation for multiple points at once
async function getElevations(points) {
  if (elevationApiDown) {
    return points.map(() => 0);
  }

  try {
    setLoadingStatus('Fetching elevations...');
    const locations = points.map(p => `${p.lat},${p.lng}`).join('|');
    const url = `${ELEVATION_API}?locations=${locations}`;
    const response = await fetch(url, { timeout: 10000 });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      setLoadingStatus('Ready');
      return data.results.map(r => Math.round(r.elevation));
    }
  } catch (error) {
    console.warn('Elevation service error:', error);
    elevationApiDown = true;
    showApiWarning('Elevation', 'Using default elevations (0m)');
    setLoadingStatus('Elevation API down');
  }
  
  setLoadingStatus('Ready');
  return points.map(() => 0);
}
