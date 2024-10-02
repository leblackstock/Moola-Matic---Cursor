// backend/chat/chatImages.js

import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid'; // For generating unique identifiers
import multer from 'multer';
import { 
  interactWithMoolaMaticAssistant, 
  waitForRunCompletion, 
  getAssistantResponse, 
  createUserMessage, 
  createAssistantMessage 
} from './chatAssistant.js';

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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Initialize Express Router
const router = express.Router();

// Parse JSON bodies
router.use(express.json({ limit: '10mb' })); // Increased limit for large images

// Setup multer for handling file uploads using memoryStorage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

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
 * Function to delete a file
 * @param {string} filePath - Path to the file to be deleted
 */
const deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Failed to delete file ${filePath}:`, err);
    } else {
      console.log(`File ${filePath} deleted successfully.`);
    }
  });
};

/**
 * Analyzes an image and retrieves financial advice based on the analysis.
 * @param {string} imageBase64 - The base64 encoded image string.
 * @param {Array} originalMessages - The original array of chat messages.
 * @param {Object} session - The Express session object.
 * @returns {Promise<string>} - The final response from the Moola-Matic assistant.
 */
async function analyzeImage(imageBase64, message, contextData, session) {
  try {
    // Step 1: Analyze the image using OpenAI's GPT-4-Turbo model
    const openAIResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: "text",
              text: message || "What is this?",
            },
          ],
        },
      ],
      temperature: 1,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: {
        type: "text",
      },
    });

    // Extract the image analysis result
    const imageAnalysis = openAIResponse.choices[0].message.content.trim();
    
    console.log('Image analysis result:', imageAnalysis);

    // Step 2: Interact with Moola-Matic Assistant
    const assistantResponse = await interactWithMoolaMaticAssistant(
      `Image Analysis: ${imageAnalysis}\nBased on the above image analysis, can you provide financial advice?`,
      contextData
    );

    return assistantResponse;
  } catch (error) {
    console.error("Error during image analysis integration:", error);
    throw error;
  }
}

/**
 * Route to handle image-based chat interactions using uploaded image files
 * POST /api/analyze-image
 * Expects multipart/form-data with 'image' and 'messages' fields
 */
router.post('/analyze-image', upload.single('image'), async (req, res) => {
  const { message } = req.body;
  let contextData = req.body.contextData;
  const imageFile = req.file;

  // Access session data
  const session = req.session;
  if (!session) {
    console.error('No session found for the request.');
    return res.status(401).json({ error: 'Unauthorized: No active session.' });
  }

  // Error handling for missing image file
  if (!imageFile) {
    console.error('No image file uploaded.');
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  // Parse contextData if it's a string
  if (typeof contextData === 'string') {
    try {
      contextData = JSON.parse(contextData);
    } catch (err) {
      console.error('Invalid contextData format received:', err);
      return res.status(400).json({ error: 'Invalid contextData format. Expected a valid JSON string.' });
    }
  }

  try {
    console.log('Processing image-based chat with uploaded image file.');

    // Generate a unique identifier for the draft image
    const imageId = uuidv4();
    const imageExtension = path.extname(imageFile.originalname) || '.png';
    const imageFilename = `draft_${imageId}${imageExtension}`;
    const imagePath = path.join(DRAFT_IMAGES_DIR, imageFilename);

    // Save the image file to the drafts directory
    fs.writeFileSync(imagePath, imageFile.buffer);
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

    // Convert image to base64 for OpenAI API
    const base64Image = imageFile.buffer.toString('base64');

    // Call the analyzeImage function to process the image and get financial advice
    const assistantResponse = await analyzeImage(base64Image, message, contextData, session);

    // Send the assistant's response and updated contextData to the frontend
    res.json({
      advice: assistantResponse,
      status: 'completed',
      contextData: contextData,
    });
  } catch (error) {
    console.error('Error processing image upload:', error);
    res.status(500).json({ error: 'Internal Server Error: Failed to process image upload.' });
  }
});

export default router;