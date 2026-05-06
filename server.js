const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const FormData = require('form-data');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Production Security & Logging
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for easier integration, or configure properly
}));
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());

// Rate Limiting: 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/receive-pdf';

app.post('/api/analyze', upload.single('file'), async (req, res) => {
  try {
    const formData = new FormData();
    
    if (req.file) {
      // If a file was uploaded
      formData.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });
    } else if (req.body.text) {
      // If text was provided (convert to virtual file for N8n if needed, or handle separately)
      // The N8n workflow expects a 'file' property. We'll send the text as a .txt file.
      formData.append('file', Buffer.from(req.body.text), {
        filename: 'input.txt',
        contentType: 'text/plain',
      });
    } else {
      return res.status(400).json({ error: 'No file or text provided' });
    }

    console.log('Forwarding request to N8n...');
    const response = await axios.post(N8N_WEBHOOK_URL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error calling N8n:', error.message);
    res.status(500).json({ 
      error: 'Failed to analyze the document', 
      details: error.response?.data || error.message 
    });
  }
});

// Mock FastAPI BERT endpoint for N8n workflow
app.post('/predict', (req, res) => {
  const text = req.body.text || "";
  console.log('Mock ML model received text for prediction');
  
  // Simple heuristic mock: if text is very short or contains 'payment', give a higher probability
  let probability = 0.1;
  if (text.toLowerCase().includes('payment') || text.toLowerCase().includes('fee')) {
    probability = 0.85;
  } else if (text.length < 50) {
    probability = 0.45;
  }

  res.json({
    probability: probability,
    verdict: probability > 0.6 ? "Fake" : probability > 0.4 ? "Suspicious" : "Genuine"
  });
});

// For any other request, send back the index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
