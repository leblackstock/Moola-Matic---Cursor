// backend/chat/chatHandler.js

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
// import { DraftItem } from '../models/DraftItem.js'; // Import the DraftItem model
import {
  interactWithMoolaMaticAssistant,
  createUserMessage,
  createAssistantMessage,
} from './chatAssistant.js';
import { sendAnalysisRequest } from './analysisAssistant.js';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Validate essential environment variables
const {
  OPENAI_API_KEY,
  BACKEND_PORT,
  SESSION_SECRET,
  MONGODB_URI, // MongoDB connection string
  MOOLA_MATIC_ASSISTANT_ID,
} = process.env;

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not defined in the .env file.');
  process.exit(1);
}

if (!BACKEND_PORT) {
  console.error('Error: BACKEND_PORT is not defined in the .env file.');
  process.exit(1);
}

if (!SESSION_SECRET) {
  console.error('Error: SESSION_SECRET is not defined in the .env file.');
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

if (!MOOLA_MATIC_ASSISTANT_ID) {
  console.error(
    'Error: MOOLA_MATIC_ASSISTANT_ID is not defined in the .env file.'
  );
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Initialize Express Router
const router = express.Router();

// Parse JSON bodies
router.use(express.json({ limit: '20mb' })); // Increased limit for large images

/**
 * Route to handle multiple image-based chat interactions using uploaded image files
 * POST /api/analyze-images
 * Expects multipart/form-data with 'images' (array of files), 'description', and 'itemId' fields
 */
router.post('/analyze-images', async (req, res) => {
  try {
    console.log(
      'Data received for image analysis:',
      JSON.stringify(req.body, null, 2)
    );
    const analysisResponse = await sendAnalysisRequest(req.body);
    res.json(analysisResponse);
  } catch (error) {
    console.error('Error processing image analysis:', error);
    res
      .status(500)
      .json({ error: 'Error processing image analysis: ' + error.message });
  }
});

// Add this new route for text-only chat
router.post('/chat', async (req, res) => {
  console.log('Received chat request:', req.body);
  const { message, contextData } = req.body;

  if (!message) {
    console.log('Error: Message is required');
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    console.log('Processing message:', message);
    const userMessage = createUserMessage(message);
    const response = await interactWithMoolaMaticAssistant(
      [userMessage],
      contextData
    );
    console.log('Assistant response:', response);

    const assistantMessage = createAssistantMessage(response);

    res.json({
      message: assistantMessage,
      contextData: contextData, // Return updated context data
    });
  } catch (error) {
    console.error('Error in chat handler:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while processing your request' });
  }
});

// Export the router
export { router as chatHandler };
export default router;
