// backend/chat/chatHandler.js

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import {
  createAssistantMessage,
  analyzeImagesWithAssistant,
  summarizeAnalyses,
} from './chatAssistant.js';
import {
  generateAnalysisPrompt,
  generateCombineAndSummarizeAnalysisPrompt,
} from './analysisAssistant.js';
import { processImages } from '../utils/imageProcessor.js';
import { combineAnalyses } from './chatCombineAnalysis.js';
import { Item } from '../models/Item.js'; // Import the Item model

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

// Check for required environment variables
[
  { key: 'OPENAI_API_KEY', value: OPENAI_API_KEY },
  { key: 'BACKEND_PORT', value: BACKEND_PORT },
  { key: 'SESSION_SECRET', value: SESSION_SECRET },
  { key: 'MONGODB_URI', value: MONGODB_URI },
  { key: 'MOOLA_MATIC_ASSISTANT_ID', value: MOOLA_MATIC_ASSISTANT_ID },
].forEach(({ key, value }) => {
  if (!value) {
    console.error(`Error: ${key} is not defined in the .env file.`);
    process.exit(1);
  }
});

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

// Parse JSON bodies with increased limit for large images
router.use(express.json({ limit: '20mb' }));

/**
 * Route to handle multiple image-based chat interactions
 * POST /api/analyze-images
 */
router.post('/analyze-images', async (req, res) => {
  try {
    const { images, description, itemId, sellerNotes } = req.body;

    // Validate image input
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No valid images provided' });
    }

    // Extract valid image URLs
    const imageUrls = images.filter(
      (img) =>
        typeof img === 'string' &&
        (img.startsWith('http') || img.startsWith('https'))
    );
    console.log('Extracted image URLs:', imageUrls);

    if (imageUrls.length === 0) {
      return res.status(400).json({ error: 'No valid image URLs found' });
    }

    // Process images, analyze, combine, and summarize
    const processedImages = await processImages(imageUrls);
    const analysisPrompt = generateAnalysisPrompt(
      description,
      itemId,
      sellerNotes
    );
    const analysisResults = await analyzeImagesWithAssistant(
      processedImages,
      analysisPrompt
    );
    const combinedAnalyses = combineAnalyses([analysisResults]);
    const combineAndSummarizeAnalysisPrompt =
      generateCombineAndSummarizeAnalysisPrompt();
    const finalAnalysis = await summarizeAnalyses(
      combinedAnalyses,
      combineAndSummarizeAnalysisPrompt
    );

    res.json(JSON.parse(finalAnalysis));
  } catch (error) {
    console.error('Error in /analyze-images:', error);
    res
      .status(500)
      .json({ error: 'Failed to analyze images', details: error.message });
  }
});

/**
 * Route to handle text-only chat
 * POST /chat
 */
router.post('/chat', async (req, res) => {
  console.log('Received chat request:', req.body);
  const { message, itemId } = req.body;

  // Validate input
  if (!message) {
    console.log('Error: Message is required');
    return res.status(400).json({ error: 'Message is required' });
  }
  if (!itemId) {
    console.log('Error: Item ID is required');
    return res.status(400).json({ error: 'Item ID is required' });
  }

  try {
    console.log('Processing message:', message);

    // Retrieve the item from the database
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Combine previous context with the new message
    const fullContext = [
      ...(item.chatContext || []),
      { role: 'user', content: message },
    ];

    // Get assistant's response
    const assistantResponse = await createAssistantMessage(fullContext);
    console.log('Assistant response:', assistantResponse);

    // Update the item's chat context in the database
    item.chatContext = [
      ...fullContext,
      { role: 'assistant', content: assistantResponse },
    ];
    await item.save();

    res.json({
      message: assistantResponse,
      context: item.chatContext,
      itemId: item._id,
    });
  } catch (error) {
    console.error('Error in chat handler:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while processing your request' });
  }
});

export { router as chatHandler };
export default router;
