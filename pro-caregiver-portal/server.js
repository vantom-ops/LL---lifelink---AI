const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LL ProCare - Professional Caregiver Network Portal',
    port: PORT,
    connectedBackend: 'http://localhost:5000/api',
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  LL ProCare Portal listening at http://localhost:${PORT}`);
  console.log(`  Connected to LL LifeLink Backend at port 5000`);
  console.log(`====================================================`);
});
