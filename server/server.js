// ---------------------------------------
// ✅ Imports and Setup
// ---------------------------------------
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// ---------------------------------------
// ✅ Import Routes
// ---------------------------------------
const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessments');
const paymentRoutes = require('./routes/payments');
const resultRoutes = require('./routes/results');

// ---------------------------------------
// ✅ Initialize App
// ---------------------------------------
const app = express();
app.set("trust proxy", 1);

// ---------------------------------------
// 🔒 Security Middleware
// ---------------------------------------
app.use(helmet({
  contentSecurityPolicy: false // Disable for now to avoid conflicts
}));

// ---------------------------------------
// ⚙️ Rate Limiting
// ---------------------------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 1000 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ---------------------------------------
// 🌐 CORS
// ---------------------------------------
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// ---------------------------------------
// 🧱 Body Parsing
// ---------------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------
// 📂 Serve Certificates Statically - FIRST
// ---------------------------------------
const CERT_DIR = path.resolve(__dirname, '../certificates');

// Ensure certificates directory exists
if (!fs.existsSync(CERT_DIR)) {
  fs.mkdirSync(CERT_DIR, { recursive: true });
  console.log(`📂 Created certificates directory at: ${CERT_DIR}`);
}

// ✅ Serve certificates with explicit configuration
app.use('/certificates', express.static(CERT_DIR, {
  index: false, // Disable directory indexing
  dotfiles: 'deny', // Deny dotfiles
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
  }
}));

console.log(`✅ Serving certificates from: ${CERT_DIR}`);

// ---------------------------------------
// 🧩 Serve Frontend Static Files
// ---------------------------------------
const publicPath = path.resolve(__dirname, '../public');
app.use(express.static(publicPath, {
  index: false // Disable automatic index.html serving
}));

// ---------------------------------------
// 🧭 API Routes - MUST COME BEFORE SPA FALLBACK
// ---------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/results', resultRoutes);

// ---------------------------------------
// 🩺 Health Check
// ---------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running smoothly ✅',
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------
// 🔍 Debug Route - Test Certificate Access
// ---------------------------------------
app.get('/debug-certificates', (req, res) => {
  try {
    const files = fs.readdirSync(CERT_DIR);
    const certificateFiles = files.filter(f => f.endsWith('.pdf'));
    
    res.json({
      certificate_dir: CERT_DIR,
      directory_exists: fs.existsSync(CERT_DIR),
      total_files: files.length,
      pdf_files: certificateFiles.length,
      sample_files: certificateFiles.slice(0, 5),
      full_path_example: certificateFiles.length > 0 ? 
        path.join(CERT_DIR, certificateFiles[0]) : 'No files found'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------
// 🎯 SPA Fallback - ONLY FOR NON-API, NON-FILE ROUTES
// ---------------------------------------
app.get('*', (req, res) => {
  // Skip API routes - these should have been handled above
  if (req.path.startsWith('/api/')) {
    console.log(`❌ SPA fallback caught API route: ${req.path}`);
    return res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.path 
    });
  }
  
  // Skip certificate routes - these should have been handled by static middleware
  if (req.path.startsWith('/certificates/')) {
    console.log(`❌ SPA fallback caught certificate route: ${req.path}`);
    return res.status(404).json({ 
      error: 'Certificate not found',
      path: req.path 
    });
  }
  
  // Skip static file routes
  if (req.path.includes('.')) {
    console.log(`❌ SPA fallback caught static file: ${req.path}`);
    return res.status(404).json({ 
      error: 'Static file not found',
      path: req.path 
    });
  }
  
  console.log(`✅ SPA fallback serving index.html for: ${req.path}`);
  // Serve SPA for all other routes (client-side routing)
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ---------------------------------------
// 🚨 Global Error Handler
// ---------------------------------------
app.use((err, req, res, next) => {
  console.error('💥 Global Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// ---------------------------------------
// 🚀 Start Server
// ---------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log(`📄 Certificate URL example: http://localhost:${PORT}/certificates/certificate_2_32_1760008566785.pdf`);
  console.log(`🔧 API Health check: http://localhost:${PORT}/api/health`);
  console.log(`🐛 Debug certificates: http://localhost:${PORT}/debug-certificates`);
});

module.exports = app;