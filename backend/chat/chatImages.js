// backend/chat/chatImages.js

import express from 'express';
import bodyParser from 'body-parser';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid'; // For generating unique identifiers

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Validate essential environment variables
const { OPENAI_API_KEY, BACKEND_PORT, SESSION_SECRET } = process.env;

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

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Initialize Express Router
const router = express.Router();

// Parse JSON bodies
router.use(bodyParser.json());

/**
 * Directory to store draft images
 * Ensure this directory exists and is secured
 */
const DRAFT_IMAGES_DIR = path.join(__dirname, '..', 'uploads', 'drafts');

// Create the drafts directory if it doesn't exist
if (!fs.existsSync(DRAFT_IMAGES_DIR)) {
  fs.mkdirSync(DRAFT_IMAGES_DIR, { recursive: true });
}

/**
 * Route to handle image-based chat interactions using base64 image data
 * POST /api/analyze-image
 * Body: { imageData: String, messages: Array }
 */
router.post('/analyze-image', async (req, res) => {
  const { imageData, messages } = req.body;

  // Access session data
  const session = req.session;
  if (!session) {
    console.error('No session found for the request.');
    return res.status(401).json({ error: 'Unauthorized: No active session.' });
  }

  // Error handling for missing image data or messages
  if (!imageData || typeof imageData !== 'string') {
    console.error('Invalid or missing image data provided. Expected a base64 string.');
    return res.status(400).json({ error: 'Invalid or missing image data. Expected a base64 string.' });
  }

  if (!messages || !Array.isArray(messages)) {
    console.error('Invalid messages format received. Expected an array of messages.');
    return res.status(400).json({ error: 'Invalid messages format. Expected an array of messages.' });
  }

  try {
    console.log('Processing image-based chat with base64 image data.');

    // Generate a unique identifier for the draft image
    const imageId = uuidv4();
    const imageFilename = `draft_${imageId}.png`; // Assuming PNG; adjust as needed
    const imagePath = path.join(DRAFT_IMAGES_DIR, imageFilename);

    // Decode base64 image data and save to the drafts directory
    const buffer = Buffer.from(imageData, 'base64');
    fs.writeFileSync(imagePath, buffer);
    console.log(`Draft image saved as ${imageFilename} at ${imagePath}.`);

    // Store the draft image reference in the session
    if (!session.draftImages) {
      session.draftImages = [];
    }
    session.draftImages.push({
      id: imageId,
      filename: imageFilename,
      path: imagePath,
      uploadedAt: new Date(),
    });
    console.log('Draft image reference added to the session.');

    // Construct a prompt or message including the base64 image data
    const analysisPrompt = [
      ...messages,
      { role: 'system', content: 'The user has provided the following image data for analysis.' },
      { role: 'assistant', content: `Image data (base64): ${imageData}` } // Including the base64 image data
    ];

    // Create a chat completion using OpenAI's API with the base64 image data
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: analysisPrompt,
      temperature: 1,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: "text",
    });

    // Extract the assistant's response from the API response
    const assistantResponse = response.choices[0].message?.content.trim();

    if (!assistantResponse) {
      console.error('No content received from OpenAI API for image analysis.');
      throw new Error('No response received for image analysis.');
    }

    console.log('Image analysis response:', assistantResponse);

    return res.json({ content: assistantResponse });
  } catch (error) {
    console.error('Error in /api/analyze-image:', error);
    return res.status(500).json({ error: 'Failed to process image analysis chat. Please try again later.' });
  }
});

export default router;
