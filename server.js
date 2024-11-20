const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const app = express();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    crypto.randomBytes(16, (err, buf) => {
      const uniqueName = buf.toString('hex') + path.extname(file.originalname);
      cb(null, uniqueName);
    });
  }
});

const upload = multer({ storage });

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ 
    message: 'File uploaded successfully',
    fileUrl 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});