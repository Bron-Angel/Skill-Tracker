const https = require('https');
const fs = require('fs');
const path = require('path');

// URL of a free level-up sound effect from Pixabay
const soundUrl = 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_c738d2fb9d.mp3?filename=success-1-6297.mp3';
const outputPath = path.join(__dirname, 'public', 'level-up.mp3');

// Ensure the public directory exists
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'));
}

console.log('Downloading level-up sound effect...');

// Download the file
https.get(soundUrl, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download: ${response.statusCode}`);
    return;
  }

  const fileStream = fs.createWriteStream(outputPath);
  response.pipe(fileStream);

  fileStream.on('finish', () => {
    fileStream.close();
    console.log(`Sound effect downloaded to ${outputPath}`);
  });
}).on('error', (err) => {
  console.error(`Error downloading file: ${err.message}`);
}); 