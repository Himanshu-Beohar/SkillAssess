const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessments');
const paymentRoutes = require('./routes/payments');
const resultRoutes = require('./routes/results');

// Initialize Express app
const app = express();

// Trust Railway proxy
app.set("trust proxy", 1);

// Security middleware (CSP example)
const { contentSecurityPolicy } = helmet;
app.use(
  contentSecurityPolicy({
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'", "https:"],
      scriptSrc: ["'self'", "https://checkout.razorpay.com", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://lumberjack.razorpay.com"],
      frameSrc: ["'self'", "https://checkout.razorpay.com", "https://api.razorpay.com"],
      childSrc: ["'self'", "https://checkout.razorpay.com", "https://api.razorpay.com"],
      imgSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
    },
  })
);

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
// });
// app.use(limiter);

//-------------------------------------------------------------

// More lenient rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 1000 : 5000, // higher for prod & very high for dev
  standardHeaders: true,    // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,     // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    console.warn(
      `⚠️ Rate limit exceeded: IP=${req.ip}, URL=${req.originalUrl}`
    );
    res.status(429).json({
      error: "Too many requests. Please slow down.",
    });
  },
});

app.use(limiter);
//-------------------------------------------------------------------------------

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files from public
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/results', resultRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// ✅ Frontend fallback (for non-API routes)
app.get('/*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// 404 handler (only for APIs, not frontend)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ✅ Start server ONCE
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;
