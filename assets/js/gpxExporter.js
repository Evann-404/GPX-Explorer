// GPX export functionality
function exportRouteToGPX(routeName, points, color) {
  if (points.length === 0) {
    alert('No points to export.');
    return;
  }

  const now = new Date().toISOString();
  const bounds = calculateBounds(points);
  
  // Start GPX document
  let gpxContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  gpxContent += '<gpx version="1.1" creator="GPX Explorer" xmlns="http://www.topografix.com/GPX/1/1">\n';
  
  // Metadata
  gpxContent += '  <metadata>\n';
  gpxContent += `    <time>${now}</time>\n`;
  gpxContent += '  </metadata>\n';
  
  // Bounds
  gpxContent += `  <bounds minlat="${bounds.minLat}" minlon="${bounds.minLng}" maxlat="${bounds.maxLat}" maxlon="${bounds.maxLng}"/>\n`;
  
  // Track
  gpxContent += '  <trk>\n';
  gpxContent += `    <name>${escapeXml(routeName)}</name>\n`;
  gpxContent += `    <desc>Created with GPX Explorer</desc>\n`;
  gpxContent += '    <trkseg>\n';
  
  // Track points
  points.forEach((point, index) => {
    const ele = point.ele || 0;
    gpxContent += `      <trkpt lat="${point.lat}" lon="${point.lng}">\n`;
    gpxContent += `        <ele>${ele}</ele>\n`;
    gpxContent += `        <time>${new Date(now.getTime() + index * 1000).toISOString()}</time>\n`;
    gpxContent += '      </trkpt>\n';
  });
  
  gpxContent += '    </trkseg>\n';
  gpxContent += '  </trk>\n';
  gpxContent += '</gpx>';
  
  // Download file
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = sanitizeFilename(routeName) + '.gpx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Calculate bounding box
function calculateBounds(points) {
  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs)
  };
}

// Escape XML special characters
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Sanitize filename
function sanitizeFilename(name) {
  return name
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .substring(0, 50);
}
