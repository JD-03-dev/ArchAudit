const AdmZip = require('adm-zip');

function parseZipStructure(buffer) {
  const zip = new AdmZip(buffer);
  const zipEntries = zip.getEntries();
  const structure = {};

  zipEntries.forEach(entry => {
    // entry.entryName is the relative path, e.g. "src/components/Navbar.tsx"
    // We want to skip macOS metadata or hidden system files if needed, but for now we'll include everything or filter out __MACOSX
    if (entry.entryName.startsWith('__MACOSX/') || entry.entryName.includes('.DS_Store')) {
      return;
    }

    const parts = entry.entryName.split('/').filter(p => p.length > 0);
    
    let current = structure;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = (i === parts.length - 1) && !entry.isDirectory;
      
      if (isFile) {
        current[part] = true;
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  });

  return structure;
}

module.exports = { parseZipStructure };
