const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 5000;

const uploadDir = 'uploads/';

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// Simple route to test server
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// New route for image upload
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  res.json({ file_id: req.file.filename, url: `http://localhost:5000/uploads/${req.file.filename}` });
});

// API route to analyze an image
app.post('/analyze-image', async (req, res) => {
  const { image } = req.body;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/images/analyze',
      { image },
      {
        headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
