// Parse GPX file and extract track points
function parseGPXFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const parser = new DOMParser();
        const xml = parser.parseFromString(e.target.result, 'text/xml');
        
        // Extract track points
        const trkpts = xml.querySelectorAll('trkpt');
        if (trkpts.length === 0) {
          reject(new Error('No track points found'));
          return;
        }
        
        const points = [];
        trkpts.forEach(pt => {
          points.push({
            lat: parseFloat(pt.getAttribute('lat')),
            lng: parseFloat(pt.getAttribute('lon')),
            ele: parseFloat(pt.querySelector('ele')?.textContent || 0)
          });
        });
        
        resolve(points);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
