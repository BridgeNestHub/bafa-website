try {
    const ejs = require('ejs');
    console.log('EJS loaded successfully:', ejs.VERSION);
  } catch (err) {
    console.error('Failed to load EJS:', err);
  }
  