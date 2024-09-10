import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { processChat, handleChatWithAssistant, analyzeImageWithGPT4Turbo } from './chatService.js';

dotenv.config();

// Define separate ports for frontend and backend
const BACKEND_PORT = process.env.BACKEND_PORT || 3001;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());  // Place this after cors and helmet
app.set('trust proxy', 1);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enable CORS for all routes
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : `http://localhost:${FRONTEND_PORT}`,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Add security headers
app.use(helmet());

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', apiLimiter);

// Simple route to test server
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Route for image upload and AI analysis
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  console.log('Received upload request');
  console.log('Request file:', req.file);

  if (!req.file) {
    console.error('No file uploaded');
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  console.log('File uploaded successfully');
  const fileUrl = `http://localhost:${BACKEND_PORT}/uploads/${req.file.filename}`;

  try {
    const promptText = 
      'Analyze the item in this image comprehensively:\n\n' +
      '1. Identifying what it is and its primary function\n' +
      '2. Noting any historical or cultural significance, including makers, brands, or artists\n' +
      '3. Describing its materials, dimensions, and distinguishing features like markings or signatures\n' +
      '4. Assessing its condition, including damage, wear, restoration, and signs of authenticity such as patina or provenance\n' +
      '5. Evaluating the craftsmanship quality and design features like patterns or styles\n' +
      '6. Estimating its market value based on current trends and its condition\n';

    const imageBase64 = fs.readFileSync(req.file.path, { encoding: 'base64' });
    const imageAnalysis = await analyzeImageWithGPT4Turbo(imageBase64, promptText);
    const assistantResponse = await handleChatWithAssistant([
      { role: 'user', content: `The image was analyzed and the result is: ${imageAnalysis}` }
    ]);

    res.json({
      file_id: req.file.filename,
      url: fileUrl,
      ai_analysis: assistantResponse
    });
  } catch (error) {
    console.error('Error processing image with AI:', error);
    res.status(500).json({ 
      error: 'An error occurred during AI image analysis.',
      details: error.message
    });
  }
});

// Image analysis function
async function analyzeImage(imageFile, contextText) {
  console.log('analyzeImage function called');
  console.log('Image file received:', imageFile);

  if (!imageFile || !(imageFile instanceof Buffer)) {
    console.error('Invalid image file provided. Expected a Buffer object:', imageFile);
    return 'Error: Invalid image file provided.';
  }

  let promptText = 'Analyze the item in this image comprehensively:\n\n';

  if (contextText && contextText !== '') {
    promptText += `${contextText}\n\n`;
  }

  promptText +=
    'Please provide a detailed analysis of the item in the image by:\n' +
    '1. Identifying what it is and its primary function\n' +
    '2. Noting any historical or cultural significance, including makers, brands, or artists\n' +
    '3. Describing its materials, dimensions, and distinguishing features like markings or signatures\n' +
    '4. Assessing its condition, including damage, wear, restoration, and signs of authenticity such as patina or provenance\n' +
    '5. Evaluating the craftsmanship quality and design features like patterns or styles\n' +
    '6. Estimating its market value based on current trends and its condition\n';

  try {
    const base64Image = imageFile.toString('base64');

    console.log('Sending request to OpenAI for image analysis...');
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'auto',
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Received response from OpenAI:', JSON.stringify(response.data, null, 2));

    if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      const imageAnalysis = response.data.choices[0].message.content;
      console.log('Image analysis successful');
      return `The following response is from the image analysis: "${imageAnalysis}". How would you like to proceed?`;
    } else {
      console.error('No content in image analysis response');
      return 'Error: Unable to analyze the image. No content in response.';
    }
  } catch (error) {
    console.error('Error in image analysis:', error);
    return `Error analyzing image: ${error.message}`;
  }
}

// Handle chat request with image analysis
async function handleChatRequest(messages, imageFile) {
  console.log('handleChatRequest function called');
  console.log('Image file received:', imageFile ? 'Yes' : 'No');
  console.log('Messages:', messages);

  if (!Array.isArray(messages)) {
    console.error('Invalid messages format:', messages);
    throw new Error('Invalid messages format');
  }

  let accumulatedContent = '';

  try {
    let imageAnalysisResult = '';
    if (imageFile) {
      console.log('Image detected, attempting analysis...');
      const contextText = messages.slice(0, -1).map(m => `${m.role}: ${m.content}`).join('\n');
      imageAnalysisResult = await analyzeImage(imageFile, contextText);
      console.log('Image analysis result:', imageAnalysisResult);
    }

    const allMessages = [
      ...messages,
      ...(imageAnalysisResult ? [{ role: 'assistant', content: imageAnalysisResult }] : []),
    ];

    const response = await processChat(allMessages);
    accumulatedContent += response;
    return accumulatedContent;
  } catch (error) {
    console.error('Error in handleChatRequest:', error);
    throw new Error('Error in chat request');
  }
}

// Update the /api/chat route
app.post('/api/chat', upload.single('image'), async (req, res) => {
  const { messages, isImageQuestion, imageContext } = req.body;
  const imageFile = req.file;

  console.log('Received chat request:', { messages, isImageQuestion, imageContext, hasImageFile: !!imageFile });

  try {
    let response;
    let imageAnalysis = null;

    if (isImageQuestion && !imageFile && !imageContext) {
      console.log('Error: Image context is required for follow-up questions.');
      return res.status(400).json({ error: 'Image context is required for follow-up questions.' });
    }

    if (imageFile) {
      console.log('Processing new image upload');
      const promptText = 
        'Analyze the item in this image comprehensively:\n\n' +
        '1. Identifying what it is and its primary function\n' +
        '2. Noting any historical or cultural significance, including makers, brands, or artists\n' +
        '3. Describing its materials, dimensions, and distinguishing features like markings or signatures\n' +
        '4. Assessing its condition, including damage, wear, restoration, and signs of authenticity such as patina or provenance\n' +
        '5. Evaluating the craftsmanship quality and design features like patterns or styles\n' +
        '6. Estimating its market value based on current trends and its condition\n';

      const imageBuffer = fs.readFileSync(imageFile.path);
      imageAnalysis = await analyzeImageWithGPT4Turbo(imageBuffer, promptText);
      console.log('Image analysis result:', imageAnalysis);
    }

    let messagesForAssistant;
    if (imageAnalysis) {
      console.log('Preparing messages with new image analysis');
      messagesForAssistant = [
        ...messages,
        { role: 'assistant', content: `Image analysis: ${imageAnalysis}` }
      ];
    } else if (isImageQuestion && imageContext) {
      console.log('Preparing messages with previous image context');
      messagesForAssistant = [
        ...messages,
        { role: 'assistant', content: `Previous image analysis: ${imageContext}` }
      ];
    } else {
      console.log('Preparing messages for text-only conversation');
      messagesForAssistant = messages;
    }

    console.log('Sending messages to assistant:', messagesForAssistant);
    response = await handleChatWithAssistant(messagesForAssistant);

    console.log('Chat response:', response);
    res.json({ 
      content: response, 
      imageContext: imageAnalysis || imageContext 
    });

  } catch (error) {
    console.error('Error handling chat request:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'An error occurred during the chat request.', details: error.message, stack: error.stack });
  }
});

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'An internal server error occurred' });
});

// Start the server
function startServer(port) {
  app.listen(port, (err) => {
    if (err) {
      console.error('Failed to start server:', err);
    } else {
      console.log(`Backend server is running on http://localhost:${port}`);
      console.log(`Frontend is expected to run on http://localhost:${FRONTEND_PORT}`);
    }
  });
}

startServer(BACKEND_PORT);
