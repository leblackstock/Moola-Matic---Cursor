// backend/chat/chatHandler.js

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { analyzeImagesWithVision, summarizeAnalyses } from './chatAssistant.js';
import {
  generateAnalysisPrompt,
  generateCombineAndSummarizeAnalysisPrompt,
} from './analysisAssistant.js';
import { processImages } from '../utils/imageProcessor.js';
import { combineAnalyses, parseAnalysis } from './chatCombineAnalysis.js';
import { DraftItem } from '../models/draftItem.js';
import winston from 'winston';

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.File({ filename: 'logs/api-errors.log' })],
});

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Validate essential environment variables
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'BACKEND_PORT',
  'SESSION_SECRET',
  'MONGODB_URI',
  'MOOLA_MATIC_ASSISTANT_ID',
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    logger.error(`Error: ${varName} is not defined in the .env file.`);
    process.exit(1);
  }
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => {
    logger.error('MongoDB connection error:', err);
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
    const { imageUrls, description, itemId, sellerNotes, context, analysisDetails } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      logger.warn('No valid image URLs provided');
      return res.status(400).json({ error: 'No valid image URLs provided' });
    }

    // Ensure analysisDetails is a string
    const cleanAnalysisDetails = (analysisDetails || '').trim();

    // Include analysisDetails in the prompts
    const analysisPrompt = generateAnalysisPrompt(
      description,
      itemId,
      sellerNotes,
      context,
      cleanAnalysisDetails // Add this parameter
    );
    const combineAndSummarizeAnalysisPrompt =
      generateCombineAndSummarizeAnalysisPrompt(cleanAnalysisDetails);

    const processedImages = await processImages(imageUrls);

    // Check for existing progress
    const existingDraft = await DraftItem.findOne({ itemId });
    const startIndex = existingDraft?.analysisProgress?.completedImages || 0;
    const remainingImages = processedImages.slice(startIndex);

    const analysisPromises = remainingImages.map(async ({ base64Image, filename }, index) => {
      try {
        const currentIndex = startIndex + index;
        console.log(
          `Analyzing image ${currentIndex + 1} of ${processedImages.length}: ${filename}`
        );

        const analysis = await analyzeImagesWithVision(analysisPrompt, base64Image);
        const parsedAnalysis = parseAnalysis(analysis);

        // Save intermediate results
        await DraftItem.findOneAndUpdate(
          { itemId },
          {
            $set: {
              [`intermediateAnalysis.${currentIndex}`]: parsedAnalysis,
              analysisProgress: {
                totalImages: processedImages.length,
                completedImages: currentIndex + 1,
                currentImageName: filename,
              },
            },
          },
          { new: true, upsert: true }
        );

        return parsedAnalysis;
      } catch (error) {
        logger.error(`Failed to analyze image: ${filename}`, { error });
        return null;
      }
    });

    const analyses = await Promise.all(analysisPromises);
    const validAnalyses = [
      ...(existingDraft?.intermediateAnalysis || []).slice(0, startIndex),
      ...analyses.filter(analysis => analysis !== null),
    ];

    if (validAnalyses.length === 0) {
      throw new Error('All image analyses failed');
    }

    const combinedAnalysis = combineAnalyses(validAnalyses);
    logger.info('Combined analysis:', combinedAnalysis);
    console.log('Analyses combined, summarizing...');
    const summary = await summarizeAnalyses(combinedAnalysis, combineAndSummarizeAnalysisPrompt);
    const parsedSummary = parseAnalysis(summary);

    // Extract rawAnalysis from the first valid analysis (assuming it's the same for all)
    const rawAnalysis = validAnalyses[0]?.rawAnalysis || null;

    // Update DraftItem with the analysis results and details
    await DraftItem.findOneAndUpdate(
      { itemId: itemId },
      {
        $set: {
          // Main analysis results containing summary and its components
          analysisResults: {
            summary: parsedSummary,
            detailedBreakdown: parsedSummary.detailedBreakdown || '',
            sampleForSaleListing: parsedSummary.sampleForSaleListing || '',
          },
          // Store raw and combined analysis separately
          technicalAnalysis: {
            raw: rawAnalysis,
            combined: combinedAnalysis,
          },
          analysisDetails: cleanAnalysisDetails,
          // Clear progress after completion
          analysisProgress: null,
          isAnalyzing: false,
        },
      },
      { new: true, upsert: true }
    );

    // Log the update for debugging
    logger.info('Updating DraftItem with analysis results:', {
      itemId,
      hasResults: Boolean(parsedSummary),
      resultFields: Object.keys(parsedSummary || {}),
    });

    console.log(`DraftItem updated with analysis summary for itemId: ${itemId}`);

    res.json({
      analysisResults: {
        summary: parsedSummary,
        detailedBreakdown: parsedSummary.detailedBreakdown || '',
        sampleForSaleListing: parsedSummary.sampleForSaleListing || '',
      },
      technicalAnalysis: {
        raw: rawAnalysis,
        combined: combinedAnalysis,
      },
    });
  } catch (error) {
    logger.error('Error in /analyze-images:', { error });
    res.status(500).json({ error: 'An unexpected error occurred', details: error.message });
  }
});

/**
 * Route to handle text-only chat
 * POST /chat
 */
router.post('/chat', async (req, res) => {
  // Placeholder for future implementation
  res.status(501).json({ message: 'Chat functionality not implemented yet' });
});

// Export as both named and default export
export { router as chatHandler };
export default router;
