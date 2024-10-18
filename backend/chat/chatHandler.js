// backend/chat/chatHandler.js

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import {
  createAssistantMessage,
  // analyzeImagesWithAssistant, // Comment out or remove if not used
  analyzeImagesWithVision,
  summarizeAnalyses,
} from './chatAssistant.js';
import {
  generateAnalysisPrompt,
  generateCombineAndSummarizeAnalysisPrompt,
} from './analysisAssistant.js';
import { processImages } from '../utils/imageProcessor.js';
import { combineAnalyses } from './chatCombineAnalysis.js';
import { DraftItem } from '../models/draftItem.js';
import {
  calculateMessageTokens,
  // calculateImageTokens,
} from '../utils/tokenCalculator.js';
//import { uploadLocalImage } from './chatAssistant.js';
//import { uploadBase64Image } from './chatAssistant.js';

// ... rest of the file

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
  console.log('Received /analyze-images request');
  try {
    const { imageUrls, description, itemId, sellerNotes, context } = req.body;

    // Add more detailed logging
    console.log('Received request body:', {
      imageUrlsCount: imageUrls ? imageUrls.length : 0,
      description,
      itemId,
      sellerNotes,
      context,
    });

    // Validate image input
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.log('Error: No valid image URLs provided');
      return res.status(400).json({ error: 'No valid image URLs provided' });
    }

    const analysisPrompt = generateAnalysisPrompt(
      description,
      itemId,
      sellerNotes,
      context
    );
    const combineAndSummarizeAnalysisPrompt =
      generateCombineAndSummarizeAnalysisPrompt();

    // Process images to get base64 representations
    const processedImages = await processImages(imageUrls);

    const analyses = [];
    for (const { base64Image, filename } of processedImages) {
      try {
        console.log(`Analyzing image: ${filename}`);
        const analysis = await analyzeImagesWithVision(
          analysisPrompt,
          base64Image
        );
        console.log(
          `Analysis result for ${filename}:`,
          JSON.stringify(analysis, null, 2)
        );
        analyses.push(analysis);
      } catch (error) {
        console.error(`Failed to analyze image: ${filename}`, error);
      }
    }

    console.log('All analyses:', JSON.stringify(analyses, null, 2));

    // Combine all analyses
    const combinedAnalysis = combineAnalyses(analyses);
    console.log(
      'Combined analysis:',
      JSON.stringify(combinedAnalysis, null, 2)
    );

    // Summarize the combined analysis
    const summary = await summarizeAnalyses(
      combinedAnalysis,
      combineAndSummarizeAnalysisPrompt
    );

    res.json({ analyses, combinedAnalysis, summary });
  } catch (error) {
    console.error('Error in /analyze-images:', error);
    res
      .status(500)
      .json({ error: 'An unexpected error occurred', details: error.message });
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

    // Calculate and log input message tokens
    const inputTokens = calculateMessageTokens([{ content: message }]);
    console.log('Input message tokens:', inputTokens);

    // Retrieve the draft item from the database
    const draftItem = await DraftItem.findOne({ itemId: itemId });
    if (!draftItem) {
      return res.status(404).json({ error: 'Draft item not found' });
    }

    // Combine previous context with the new message
    const fullContext = [
      ...(draftItem.chatContext || []),
      { role: 'user', content: message },
    ];

    // Calculate and log full context tokens
    const contextTokens = calculateMessageTokens(fullContext);
    console.log('Full context tokens:', contextTokens);

    // Get assistant's response
    const assistantResponse = await createAssistantMessage(fullContext);
    console.log('Assistant response:', assistantResponse);

    // Calculate and log assistant response tokens
    const responseTokens = calculateMessageTokens([
      { content: assistantResponse },
    ]);
    console.log('Assistant response tokens:', responseTokens);

    // Update the draft item's chat context in the database
    draftItem.chatContext = [
      ...fullContext,
      { role: 'assistant', content: assistantResponse },
    ];
    await draftItem.save();

    res.json({
      message: assistantResponse,
      context: draftItem.chatContext,
      itemId: draftItem._id,
    });
  } catch (error) {
    console.error('Error in chat handler:', error);
    if (error.name === 'ValidationError') {
      res
        .status(400)
        .json({ error: 'Invalid input data', details: error.message });
    } else if (error.name === 'DatabaseError') {
      res
        .status(500)
        .json({ error: 'Database operation failed', details: error.message });
    } else {
      res.status(500).json({
        error: 'An error occurred while processing your request',
        details: error.message,
      });
    }
  }
});

export { router as chatHandler };
export default router;
