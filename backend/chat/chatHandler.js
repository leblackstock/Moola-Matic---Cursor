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
  calculateImageTokens,
} from '../utils/tokenCalculator.js';

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

<<<<<<< HEAD
    const analysisPrompt = generateAnalysisPrompt(
      description,
      itemId,
      sellerNotes,
      context
    );
=======
    // Log the first few image URLs (for debugging)
    console.log('First few image URLs:', imageUrls.slice(0, 3));

    // Process all images
    console.log('Processing images...');
    let processedImages;
    try {
      processedImages = await processImages(imageUrls);
      console.log('Images processed:', processedImages.length);

      // Calculate and log image tokens
      const imageTokens = calculateImageTokens(
        processedImages.map((img) => img.base64Image)
      );
      console.log('Total image tokens:', imageTokens);
    } catch (processingError) {
      console.error('Error processing images:', processingError);
      return res.status(500).json({
        error: 'Failed to process images',
        details: processingError.message,
      });
    }

    // Check if any images were successfully processed
    if (processedImages.length === 0) {
      console.log('Error: No images were successfully processed');
      return res
        .status(400)
        .json({ error: 'No images were successfully processed' });
    }

    const maxTokensPerBatch = 100000;
    let allAnalysisResults = [];
    let remainingImages = [...processedImages];

    console.log('Total images to process:', remainingImages.length);
    console.log('Max tokens per batch:', maxTokensPerBatch);

    while (remainingImages.length > 0) {
      let batchImages = [];
      let batchTokens = 0;

      console.log('\nStarting new batch:');
      while (remainingImages.length > 0 && batchTokens < maxTokensPerBatch) {
        const nextImage = remainingImages[0];
        const imageTokens = calculateImageTokens([nextImage.base64Image]);
        console.log(`  Image tokens: ${imageTokens}`);

        if (batchTokens + imageTokens <= maxTokensPerBatch) {
          batchImages.push(nextImage);
          batchTokens += imageTokens;
          remainingImages.shift();
          console.log(`  Added to batch. Current batch tokens: ${batchTokens}`);
        } else {
          console.log(`  Exceeds batch token limit. Moving to next batch.`);
          break;
        }
      }

      console.log(
        `Analyzing batch of ${batchImages.length} images, total tokens: ${batchTokens}`
      );

      // Generate analysis prompt
      console.log('Generating analysis prompt...');
      const analysisPrompt = generateAnalysisPrompt(
        description,
        itemId,
        sellerNotes,
        context
      );
      console.log('Analysis prompt generated');

      // Calculate and log prompt tokens
      const promptTokens = calculateMessageTokens([
        { content: analysisPrompt },
      ]);
      console.log('Analysis prompt tokens:', promptTokens);

      // Analyze images with assistant
      console.log('Analyzing images with assistant...');
      const batchAnalysisResults = await analyzeImagesWithAssistant(
        batchImages.map((img) => img.base64Image),
        analysisPrompt
      );
      console.log('Batch image analysis completed');

      // Calculate and log response tokens
      const responseTokens = calculateMessageTokens([
        { content: JSON.stringify(batchAnalysisResults) },
      ]);
      console.log('Batch analysis response tokens:', responseTokens);

      allAnalysisResults.push(batchAnalysisResults);

      console.log(
        `Batch analysis complete. Remaining images: ${remainingImages.length}`
      );
    }

    // Combine all batch analyses
    console.log('Combining all analyses...');
    const combinedAnalyses = combineAnalyses(allAnalysisResults);
    console.log('All analyses combined');

    // Generate combine and summarize prompt
    console.log('Generating combine and summarize prompt...');
>>>>>>> 64027e7216e212dfee3722ff636c989fa6dc9ab9
    const combineAndSummarizeAnalysisPrompt =
      generateCombineAndSummarizeAnalysisPrompt();

    const analyses = [];
    for (const imageUrl of imageUrls) {
      const base64Image = await processImages([imageUrl]);
      if (base64Image.length > 0) {
        const analysis = await analyzeImagesWithVision(
          base64Image[0],
          analysisPrompt
        );
        analyses.push(analysis);
      } else {
        console.error(`Failed to process image: ${imageUrl}`);
      }
    }

    const combinedAnalysis = analyses.join('\n\n');
    const summary = await summarizeAnalyses(
      combinedAnalysis,
      combineAndSummarizeAnalysisPrompt
    );

<<<<<<< HEAD
    res.json({ analyses, summary });
=======
    // Calculate and log final analysis tokens
    const finalAnalysisTokens = calculateMessageTokens([
      { content: finalAnalysis },
    ]);
    console.log('Final analysis tokens:', finalAnalysisTokens);

    // Parse and send response
    console.log('Parsing final analysis...');
    const parsedAnalysis = JSON.parse(finalAnalysis);
    console.log('Sending response');
    res.json(parsedAnalysis);
>>>>>>> 64027e7216e212dfee3722ff636c989fa6dc9ab9
  } catch (error) {
    console.error('Error in /analyze-images:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
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
