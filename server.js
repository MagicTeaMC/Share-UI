const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const favicon = require('serve-favicon');

const app = express();

// Rate limiting middleware to prevent excessive scanning
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit 10 uploads per IP
  message: 'Upload limit exceeded, please try again later'
});

// Serve static files
app.use(express.static('public'));

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.set('trust proxy', 1 /* number of proxies between user and server */)

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Generate a folder name with 32 random characters
    const folderName = crypto.randomBytes(16).toString('hex');
    const uploadDir = path.join(__dirname, 'uploads', folderName);
    
    // Ensure the folder exists
    fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use the original file name, but prevent path traversal attacks
    const sanitizedFileName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, sanitizedFileName);
  }
});

// Set multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1000 * 1024 * 1024, // Limit file size to 1000MB
    files: 1 // Limit the number of files per upload
  },
});

// Prevent directory listing
app.use('/uploads', (req, res, next) => {
  if (req.method === 'GET') {
    const requestPath = path.normalize(req.path);
    if (requestPath === '/' || requestPath === '.') {
      return res.status(403).send('Directory browsing is forbidden');
    }
  }
  next();
}, express.static('uploads', {
  setHeaders: (res, filePath) => {
    // Disable caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    
    // Prevent MIME type sniffing
    res.set('X-Content-Type-Options', 'nosniff');
  },
  // Additional security settings
  dotfiles: 'ignore',
  redirect: false
}));

// Handle file upload with rate limiting
app.post('/upload', uploadLimiter, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'File upload failed' });
  }

  // Set the file to read-only
  fs.chmod(req.file.path, 0o444, (err) => {
    if (err) {
      console.error('Error setting file permissions:', err);
      return res.status(500).json({ error: 'Error setting file permissions' });
    }
    
    // Construct the file URL
    const relativePath = path.relative(__dirname, req.file.path);
    const fileUrl = `${req.protocol}://${req.get('host')}/${relativePath}`;
    
    res.json({
      message: 'File uploaded successfully',
      fileUrl: fileUrl
    });
  });
});

// Global error-handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 100MB limit' });
    }
  }
  
  res.status(500).json({ 
    error: 'Server encountered an error',
    details: error.message 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});