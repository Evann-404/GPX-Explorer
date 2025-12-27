// Main application logic
const tracks = [];
const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

// Initialize map when DOM is ready
initMap();

// File input handler
document.getElementById('gpxInput').addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  
  for (let i = 0; i < files.length; i++) {
    try {
      await loadGPXFile(files[i], i);
    } catch (error) {
      console.error(`Error loading ${files[i].name}:`, error);
    }
  }
});

// Load and process a single GPX file
async function loadGPXFile(file, index) {
  // Parse GPX
  const points = await parseGPXFile(file);
  
  // Calculate stats
  const distance = calculateDistance(points);
  const elevation = calculateElevation(points);
  const color = colors[index % colors.length];
  
  // Draw on map
  const polyline = drawTrackOnMap(points, color);
  
  
  // Store track data
  tracks.push({
    name: file.name,
    distance: distance,
    elevation: elevation,
    color: color,
    polyline: polyline
  });
  
  // Update UI
  updateStatsDisplay(tracks);
  updateTrackList(tracks);
  fitMapToTracks(tracks.map(t => t.polyline));
}

