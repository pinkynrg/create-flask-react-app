// postbuild.js
const fs = require('fs');
const path = require('path');

// Path to the compiled JavaScript file
const filePath = path.join('dist', 'generate.js');

// Shebang line to add at the top of the file
const shebang = '#!/usr/bin/env node\n';

// Read the file content
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) throw err;

  // Check if the shebang already exists
  if (!data.startsWith(shebang)) {
    // Prepend the shebang to the file content
    const updatedData = shebang + data;

    // Write the updated content back to the file
    fs.writeFile(filePath, updatedData, 'utf8', (err) => {
      if (err) throw err;

      // Make the file executable
      fs.chmod(filePath, '755', (err) => {
        if (err) throw err;
        console.log('Shebang added and file made executable');
      });
    });
  } else {
    console.log('Shebang already present, skipping modification');
  }
});