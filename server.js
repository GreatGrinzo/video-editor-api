// server.js - COPY ALL OF THIS INTO YOUR server.js FILE

const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Setup file upload
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB max
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/output', express.static('output'));

// Test endpoint - Check if API is running
app.get('/', (req, res) => {
  res.json({ 
    message: 'Video Editor API is running!',
    status: 'online',
    endpoints: [
      'POST /api/video/trim',
      'POST /api/video/speed',
      'POST /api/video/filter',
      'POST /api/video/volume',
      'POST /api/video/crop',
      'POST /api/video/rotate',
      'POST /api/video/thumbnail',
      'POST /api/video/metadata',
      'POST /api/video/export'
    ]
  });
});

// ENDPOINT 1: Trim Video
app.post('/api/video/trim', upload.single('video'), (req, res) => {
  console.log('📹 Trimming video...');
  const { startTime, endTime } = req.body;
  const inputPath = req.file.path;
  const outputPath = `output/trimmed-${Date.now()}.mp4`;

  ffmpeg(inputPath)
    .setStartTime(startTime)
    .setDuration(parseFloat(endTime) - parseFloat(startTime))
    .output(outputPath)
    .on('end', () => {
      fs.unlinkSync(inputPath);
      console.log('✅ Video trimmed successfully!');
      res.json({ 
        success: true, 
        videoUrl: `http://localhost:${PORT}/${outputPath}`,
        message: 'Video trimmed successfully!'
      });
    })
    .on('error', (err) => {
      console.error('❌ Error:', err.message);
      res.status(500).json({ error: err.message });
    })
    .run();
});

// ENDPOINT 2: Change Video Speed
app.post('/api/video/speed', upload.single('video'), (req, res) => {
  console.log('⚡ Changing video speed...');
  const { speed } = req.body;
  const inputPath = req.file.path;
  const outputPath = `output/speed-${Date.now()}.mp4`;

  const speedValue = parseFloat(speed);
  const videoSpeed = 1 / speedValue;
  
  ffmpeg(inputPath)
    .videoFilters(`setpts=${videoSpeed}*PTS`)
    .audioFilters(`atempo=${speedValue}`)
    .output(outputPath)
    .on('end', () => {
      fs.unlinkSync(inputPath);
      console.log('✅ Speed changed successfully!');
      res.json({ 
        success: true, 
        videoUrl: `http://localhost:${PORT}/${outputPath}`,
        message: `Speed changed to ${speed}x!`
      });
    })
    .on('error', (err) => {
      console.error('❌ Error:', err.message);
      res.status(500).json({ error: err.message });
    })
    .run();
});

// ENDPOINT 3: Apply Filter
app.post('/api/video/filter', upload.single('video'), (req, res) => {
  console.log('🎨 Applying filter...');
  const { filterType } = req.body;
  const inputPath = req.file.path;
  const outputPath = `output/filtered-${Date.now()}.mp4`;

  let filterString = '';
  
  switch(filterType) {
    case 'grayscale':
      filterString = 'hue=s=0';
      break;
    case 'sepia':
      filterString = 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131';
      break;
    case 'brightness':
      filterString = 'eq=brightness=0.3';
      break;
    case 'blur':
      filterString = 'boxblur=5:1';
      break;
    default:
      filterString = '';
  }

  ffmpeg(inputPath)
    .videoFilters(filterString)
    .output(outputPath)
    .on('end', () => {
      fs.unlinkSync(inputPath);
      console.log('✅ Filter applied successfully!');
      res.json({ 
        success: true, 
        videoUrl: `http://localhost:${PORT}/${outputPath}`,
        message: `${filterType} filter applied!`
      });
    })
    .on('error', (err) => {
      console.error('❌ Error:', err.message);
      res.status(500).json({ error: err.message });
    })
    .run();
});

// ENDPOINT 4: Adjust Volume
app.post('/api/video/volume', upload.single('video'), (req, res) => {
  console.log('🔊 Adjusting volume...');
  const { volume } = req.body;
  const inputPath = req.file.path;
  const outputPath = `output/volume-${Date.now()}.mp4`;

  ffmpeg(inputPath)
    .audioFilters(`volume=${volume}`)
    .output(outputPath)
    .on('end', () => {
      fs.unlinkSync(inputPath);
      console.log('✅ Volume adjusted successfully!');
      res.json({ 
        success: true, 
        videoUrl: `http://localhost:${PORT}/${outputPath}`,
        message: `Volume set to ${parseFloat(volume) * 100}%`
      });
    })
    .on('error', (err) => {
      console.error('❌ Error:', err.message);
      res.status(500).json({ error: err.message });
    })
    .run();
});

// ENDPOINT 5: Crop Video
app.post('/api/video/crop', upload.single('video'), (req, res) => {
  console.log('✂️ Cropping video...');
  const { width, height, x, y } = req.body;
  const inputPath = req.file.path;
  const outputPath = `output/cropped-${Date.now()}.mp4`;

  ffmpeg(inputPath)
    .videoFilters(`crop=${width}:${height}:${x}:${y}`)
    .output(outputPath)
    .on('end', () => {
      fs.unlinkSync(inputPath);
      console.log('✅ Video cropped successfully!');
      res.json({ 
        success: true, 
        videoUrl: `http://localhost:${PORT}/${outputPath}`,
        message: 'Video cropped!'
      });
    })
    .on('error', (err) => {
      console.error('❌ Error:', err.message);
      res.status(500).json({ error: err.message });
    })
    .run();
});

// ENDPOINT 6: Rotate Video
app.post('/api/video/rotate', upload.single('video'), (req, res) => {
  console.log('🔄 Rotating video...');
  const { direction } = req.body;
  const inputPath = req.file.path;
  const outputPath = `output/rotated-${Date.now()}.mp4`;

  let filter = '';
  switch(direction) {
    case 'cw': filter = 'transpose=1'; break;
    case 'ccw': filter = 'transpose=2'; break;
    case 'flip-h': filter = 'hflip'; break;
    case 'flip-v': filter = 'vflip'; break;
  }

  ffmpeg(inputPath)
    .videoFilters(filter)
    .output(outputPath)
    .on('end', () => {
      fs.unlinkSync(inputPath);
      console.log('✅ Video rotated successfully!');
      res.json({ 
        success: true, 
        videoUrl: `http://localhost:${PORT}/${outputPath}`,
        message: 'Video rotated!'
      });
    })
    .on('error', (err) => {
      console.error('❌ Error:', err.message);
      res.status(500).json({ error: err.message });
    })
    .run();
});

// ENDPOINT 7: Generate Thumbnail
app.post('/api/video/thumbnail', upload.single('video'), (req, res) => {
  console.log('📸 Generating thumbnail...');
  const { timestamp } = req.body;
  const inputPath = req.file.path;
  const outputFileName = `thumb-${Date.now()}.jpg`;
  const outputPath = `output/${outputFileName}`;

  ffmpeg(inputPath)
    .screenshots({
      timestamps: [timestamp || '00:00:03'],
      filename: outputFileName,
      folder: 'output',
      size: '640x360'
    })
    .on('end', () => {
      fs.unlinkSync(inputPath);
      console.log('✅ Thumbnail generated!');
      res.json({ 
        success: true, 
        thumbnailUrl: `http://localhost:${PORT}/output/${outputFileName}`,
        message: 'Thumbnail created!'
      });
    })
    .on('error', (err) => {
      console.error('❌ Error:', err.message);
      res.status(500).json({ error: err.message });
    });
});

// ENDPOINT 8: Get Video Metadata
app.post('/api/video/metadata', upload.single('video'), (req, res) => {
  console.log('📊 Getting video info...');
  const inputPath = req.file.path;

  ffmpeg.ffprobe(inputPath, (err, metadata) => {
    fs.unlinkSync(inputPath);
    
    if (err) {
      console.error('❌ Error:', err.message);
      return res.status(500).json({ error: err.message });
    }

    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
    const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

    console.log('✅ Metadata retrieved!');
    res.json({
      success: true,
      duration: metadata.format.duration,
      size: metadata.format.size,
      bitrate: metadata.format.bit_rate,
      video: {
        codec: videoStream?.codec_name,
        width: videoStream?.width,
        height: videoStream?.height,
        fps: videoStream?.r_frame_rate
      },
      audio: {
        codec: audioStream?.codec_name,
        sampleRate: audioStream?.sample_rate,
        channels: audioStream?.channels
      }
    });
  });
});

// ENDPOINT 9: Export with Custom Settings
app.post('/api/video/export', upload.single('video'), (req, res) => {
  console.log('💾 Exporting video...');
  const { resolution, fps, format } = req.body;
  const inputPath = req.file.path;
  const outputPath = `output/export-${Date.now()}.${format || 'mp4'}`;

  let command = ffmpeg(inputPath);

  if (resolution) {
    command.size(resolution);
  }
  if (fps) {
    command.fps(parseInt(fps));
  }

  command
    .output(outputPath)
    .on('progress', (progress) => {
      console.log(`Processing: ${progress.percent}% done`);
    })
    .on('end', () => {
      fs.unlinkSync(inputPath);
      console.log('✅ Export complete!');
      res.json({ 
        success: true, 
        videoUrl: `http://localhost:${PORT}/${outputPath}`,
        message: 'Video exported successfully!'
      });
    })
    .on('error', (err) => {
      console.error('❌ Error:', err.message);
      res.status(500).json({ error: err.message });
    })
    .run();
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`✅ Video Editor API is running!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log('========================================\n');
  console.log('Available endpoints:');
  console.log('  POST /api/video/trim');
  console.log('  POST /api/video/speed');
  console.log('  POST /api/video/filter');
  console.log('  POST /api/video/volume');
  console.log('  POST /api/video/crop');
  console.log('  POST /api/video/rotate');
  console.log('  POST /api/video/thumbnail');
  console.log('  POST /api/video/metadata');
  console.log('  POST /api/video/export');
  console.log('\n💡 Tip: Open http://localhost:3000 in your browser!\n');
});