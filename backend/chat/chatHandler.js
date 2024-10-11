// backend/chat/chatHandler.js

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import mongoose from 'mongoose';
import { DraftItem } from '../models/DraftItem.js'; // Import the DraftItem model
import {
  interactWithMoolaMaticAssistant as interactWithAssistant,
  createUserMessage,
  createAssistantMessage,
} from './chatAssistant.js';

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

// Setup multer for handling file uploads using memoryStorage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
});

/**
 * Constants
 */
const IMAGE_ANALYSIS_PROMPT = `
You are an expert assistant that helps users evaluate items for resale. Analyze the provided images and description collectively to extract the following details:

1. **Item Details**
   - **Type**: Provide a single, definitive type based on all images.
   - **Brand**: Identify the most prominent brand from all images.
   - **Condition**: Assess the overall condition considering all images (e.g., "new," "like new," "good," "fair," "poor").
   - **Rarity**: Determine the rarity of the item based on the combined visual information.
   - **Authenticity Confirmed**: Indicate Yes/No based on the overall assessment.
   - **Packaging and Accessories**: Summarize any packaging and accessories visible in any of the images.

2. **Financials**
   - **Purchase Price**: Provide a single value.
   - **Cleaning/Repair Costs**: Aggregate the total estimated costs.
   - **Estimated Shipping Costs**: Provide a single value.
   - **Platform Fees**: Provide a single value.
   - **Expected Profit**: Provide a single value.

3. **Market Analysis**
   - **Market Demand**: Provide a single assessment.
   - **Historical Price Trends**: Summarize the trend.
   - **Market Saturation**: Provide a single assessment.
   - **Sales Velocity**: Provide a single estimation.

4. **Final Recommendation**
   - **Purchase Recommendation**: Indicate Yes/No based on the overall analysis.
   - **Detailed Breakdown**: Provide a concise summary of the recommendation.

**Instructions:**
- Analyze all provided images and the description to derive each field.
- Ensure that each field has only one entry, aggregating information from all images.
- Provide the information in the following JSON format:

\`\`\`json
{
  "itemDetails": {
    "type": "",
    "brand": "",
    "condition": "",
    "rarity": "",
    "authenticityConfirmed": "",
    "packagingAccessories": ""
  },
  "financials": {
    "purchasePrice": 0,
    "cleaningRepairCosts": 0,
    "estimatedShippingCosts": 0,
    "platformFees": 0,
    "expectedProfit": 0
  },
  "marketAnalysis": {
    "marketDemand": "",
    "historicalPriceTrends": "",
    "marketSaturation": "",
    "salesVelocity": ""
  },
  "finalRecommendation": {
    "purchaseRecommendation": "",
    "detailedBreakdown": ""
  }
}
\`\`\`

**Notes:**
- **Consistency**: Ensure each field is populated once, reflecting a comprehensive analysis.
- **Clarity**: If certain fields cannot be determined, set them to \`null\`.
`;

/**
 * Helper Functions
 */

/**
 * Validates the assistant's JSON response.
 * @param {Object} response - The JSON response from the assistant.
 * @throws Will throw an error if any required field is missing.
 */
const validateAssistantResponse = (response) => {
  const requiredFields = [
    'itemDetails.type',
    'itemDetails.brand',
    'itemDetails.condition',
    'itemDetails.rarity',
    'itemDetails.authenticityConfirmed',
    'itemDetails.packagingAccessories',
    'financials.purchasePrice',
    'financials.cleaningRepairCosts',
    'financials.estimatedShippingCosts',
    'financials.platformFees',
    'financials.expectedProfit',
    'marketAnalysis.marketDemand',
    'marketAnalysis.historicalPriceTrends',
    'marketAnalysis.marketSaturation',
    'marketAnalysis.salesVelocity',
    'finalRecommendation.purchaseRecommendation',
    'finalRecommendation.detailedBreakdown',
  ];

  for (const field of requiredFields) {
    const keys = field.split('.');
    let value = response;
    for (const key of keys) {
      value = value[key];
      if (value === undefined || value === null) {
        throw new Error(`Missing field in assistant response: ${field}`);
      }
    }
  }

  return true;
};

/**
 * Uploads a single image to the Assistant API's Vision capabilities.
 * @param {Buffer} imageBuffer - The image buffer.
 * @param {string} filename - The name of the image file.
 * @returns {Promise<string>} - The file ID returned by the Assistant API.
 */
const uploadImageToAssistant = async (imageBuffer, filename) => {
  try {
    // Use the Assistant API's file upload method
    const file = await interactWithAssistant({
      action: 'upload_file',
      purpose: 'vision',
      file: imageBuffer,
      filename: filename,
    });

    return file.id; // Adjust based on the actual response structure
  } catch (error) {
    console.error(
      'Error uploading image to Assistant:',
      error.response?.data || error.message
    );
    throw new Error('Failed to upload image to Assistant.');
  }
};

/**
 * Interacts with the Assistant API to send messages and retrieve responses.
 * @param {Array<Object>} messages - Array of message objects to send.
 * @returns {Promise<Object>} - Assistant's response.
 */
const sendMessagesToAssistant = async (messages) => {
  try {
    const response = await interactWithAssistant(messages);
    return response;
  } catch (error) {
    console.error(
      'Error interacting with Assistant:',
      error.response?.data || error.message
    );
    throw new Error('Failed to interact with Assistant.');
  }
};

/**
 * Analyzes images and retrieves financial advice based on the analysis.
 * @param {Array<Buffer>} imageBuffers - Array of image buffers.
 * @param {string} description - Description of the items.
 * @param {string} itemId - Unique identifier for the item.
 * @returns {Promise<Object>} - The assistant's JSON response.
 */
const analyzeImages = async (imageBuffers, description, itemId) => {
  console.log('analyzeImages: Analyzing images for item with ID:', itemId);
  try {
    // Step 1: Upload all images to Assistant and collect file IDs
    const uploadPromises = imageBuffers.map((buffer, index) =>
      uploadImageToAssistant(buffer, `image_${itemId}_${index}.jpg`)
    );
    const fileIds = await Promise.all(uploadPromises);
    console.log('Uploaded images to Assistant. File IDs:', fileIds);

    // Step 2: Create a new thread
    const threadId = await interactWithAssistant({
      action: 'create_thread',
      assistant_id: MOOLA_MATIC_ASSISTANT_ID,
    });
    console.log('Thread created with ID:', threadId);

    // Step 3: Add messages to the thread, referencing the uploaded images
    const imageMessages = fileIds.map((fileId) => ({
      role: 'user',
      content: [{ type: 'image_file', image_file: { file_id: fileId } }],
    }));

    // Add description message
    const descriptionMessage = {
      role: 'user',
      content: [{ type: 'text', text: `Description: ${description}` }],
    };

    // Combine all messages
    const allMessages = [...imageMessages, descriptionMessage];

    // Add messages to the thread
    for (const msg of allMessages) {
      await interactWithAssistant({
        action: 'add_message',
        thread_id: threadId,
        role: msg.role,
        content: msg.content,
      });
    }

    // Step 4: Initiate a run
    const runId = await interactWithAssistant({
      action: 'create_run',
      thread_id: threadId,
      assistant_id: MOOLA_MATIC_ASSISTANT_ID,
    });
    console.log('Run created with ID:', runId);

    // Step 5: Poll for the run's completion
    const assistantResponse = await interactWithAssistant({
      action: 'poll_run',
      thread_id: threadId,
      run_id: runId,
      timeout: 60000, // 60 seconds
    });
    console.log('Assistant response retrieved:', assistantResponse);

    // Parse and validate the assistant's JSON response
    const parsedResponse = JSON.parse(assistantResponse);
    validateAssistantResponse(parsedResponse);

    return parsedResponse;
  } catch (error) {
    console.error('Error during image analysis integration:', error);
    throw error;
  }
};

/**
 * Route to handle multiple image-based chat interactions using uploaded image files
 * POST /api/analyze-images
 * Expects multipart/form-data with 'images' (array of files), 'description', and 'itemId' fields
 */
router.post(
  '/analyze-images',
  upload.array('images', 10), // Allow up to 10 images; adjust as needed
  async (req, res) => {
    console.log('analyze-images route: Received request body:', req.body);
    console.log('analyze-images route: Received files:', req.files);

    const { description, itemId } = req.body;

    // Validate required fields
    if (!description || !itemId) {
      console.error('Missing description or itemId:', { description, itemId });
      return res.status(400).json({ error: 'Missing description or itemId.' });
    }

    // Retrieve uploaded images
    const files = req.files;
    if (!files || files.length === 0) {
      console.error('No images provided.');
      return res.status(400).json({ error: 'No images provided.' });
    }

    // Extract image buffers
    const imageBuffers = files.map((file) => file.buffer);

    try {
      // Step 1: Upload images to the assistant
      const fileIds = await Promise.all(
        imageBuffers.map((buffer, index) =>
          uploadImageToAssistant(buffer, `image_${itemId}_${index}.jpg`)
        )
      );

      // Step 2: Create a new thread
      const threadId = await interactWithAssistant({
        action: 'create_thread',
        assistant_id: MOOLA_MATIC_ASSISTANT_ID,
      });

      // Step 3: Add image messages to the thread
      for (const fileId of fileIds) {
        await interactWithAssistant({
          action: 'add_message',
          thread_id: threadId,
          role: 'user',
          content: [{ type: 'image_file', image_file: { file_id: fileId } }],
        });
      }

      // Step 4: Add the image analysis prompt
      await interactWithAssistant({
        action: 'add_message',
        thread_id: threadId,
        role: 'user',
        content: [{ type: 'text', text: IMAGE_ANALYSIS_PROMPT }],
      });

      // Step 5: Run the assistant
      const runId = await interactWithAssistant({
        action: 'create_run',
        thread_id: threadId,
        assistant_id: MOOLA_MATIC_ASSISTANT_ID,
      });

      // Step 6: Wait for the run to complete and get the response
      const assistantResponse = await interactWithAssistant({
        action: 'poll_run',
        thread_id: threadId,
        run_id: runId,
        timeout: 60000, // 60 seconds timeout
      });

      // Parse and validate the assistant's JSON response
      const parsedResponse = JSON.parse(assistantResponse);
      validateAssistantResponse(parsedResponse);

      // Create a new DraftItem document
      const newDraftItem = new DraftItem({
        itemId: itemId,
        name: parsedResponse.itemDetails.type,
        description: description,
        itemDetails: parsedResponse.itemDetails,
        images: files.map((file, index) => ({
          id: fileIds[index],
          filename: file.originalname,
          isNew: true,
        })),
        financials: parsedResponse.financials,
        marketAnalysis: parsedResponse.marketAnalysis,
        finalRecommendation: parsedResponse.finalRecommendation,
        isDraft: true,
      });

      // Save to MongoDB
      await newDraftItem.save();

      // Send the response to the frontend
      res.json({
        advice: parsedResponse.finalRecommendation.detailedBreakdown,
        status: 'completed',
        item: newDraftItem,
      });
    } catch (error) {
      console.error('Error processing image uploads:', error);
      res.status(500).json({
        error: 'Internal Server Error: Failed to process image uploads.',
      });
    }
  }
);

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
    const response = await interactWithAssistant([userMessage], contextData);
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

// Export the router and the interactWithMoolaMaticAssistant function
export {
  router as chatHandler,
  interactWithAssistant as interactWithMoolaMaticAssistant,
};
export default router;
