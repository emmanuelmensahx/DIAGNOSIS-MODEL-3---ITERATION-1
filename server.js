const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 8080;

// Serve static files from the current directory
app.use(express.static('.'));

// Proxy API requests to backend with improved timeout and WebSocket support
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8001',
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  timeout: 30000, // 30 second timeout
  proxyTimeout: 30000, // 30 second proxy timeout
  // No pathRewrite needed - backend expects /api/v1 prefix
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Backend service temporarily unavailable',
        message: 'Please try again in a moment'
      });
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add timeout headers
    proxyReq.setTimeout(30000);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers for better compatibility
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  }
}));

// Handle root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on http://localhost:${PORT}`);
  console.log(`API requests will be proxied to http://localhost:8001`);
});