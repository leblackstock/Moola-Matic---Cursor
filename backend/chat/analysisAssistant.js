// backend/chat/analysisAssistant.js

/**
 * This module defines the analysis prompt used to instruct the GPT assistant.
 * It also includes a function to send multiple base64-encoded images along with
 * a description to the assistant and receive a consolidated JSON response.
 */

import {
  interactWithMoolaMaticAssistant,
  createUserMessage,
} from './chatAssistant.js';
import { processImages } from '../utils/imageProcessor.js';
//import OpenAI from 'openai';
//import fs from 'fs';
//import { promises as fsPromises } from 'fs';
//import path from 'path';
//import { rateLimitedRequest } from '../utils/rateLimiter.js';
import axios from 'axios';
//import { DraftItem } from '../models/draftItem.js';

// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const uploadImageToOpenAI = async (base64String, fileName) => {
//   let tempFilePath;
//   try {
//     const tempDir = path.join(process.cwd(), 'temp');
//     await fsPromises.mkdir(tempDir, { recursive: true });
//     tempFilePath = path.join(tempDir, fileName);

//     // Remove the data URL prefix if present
//     const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
//     const buffer = Buffer.from(base64Data, 'base64');
//     await fsPromises.writeFile(tempFilePath, buffer);

//     const file = await rateLimitedRequest(() =>
//       client.files.create({
//         file: fs.createReadStream(tempFilePath),
//         purpose: 'vision',
//       })
//     );

//     return file.id;
//   } catch (error) {
//     console.error('Error uploading image to OpenAI:', error);
//     throw error;
//   } finally {
//     if (tempFilePath) {
//       try {
//         await fsPromises.unlink(tempFilePath);
//         console.log(`Temporary file ${tempFilePath} cleaned up`);
//       } catch (cleanupError) {
//         console.error('Error cleaning up temporary file:', cleanupError);
//       }
//     }
//   }
// };

/**
 * Sends multiple base64-encoded images and a description to the GPT assistant
 * and retrieves a consolidated JSON response.
 *
 * @param {Array<string>} imagePaths - Array of image file paths.
 * @param {string} description - Description of the items.
 * @param {string} itemId - Unique identifier for the item.
 * @param {string} [sellerNotes] - Optional seller notes.
 * @param {Object} [contextData] - Optional contextual data.
 * @returns {Promise<Object>} - The assistant's JSON response mapped to DraftItem structure.
 */
async function sendAnalysisRequest(data) {
  console.log(
    'Received data in sendAnalysisRequest:',
    JSON.stringify(data, null, 2)
  );

  const { images, description, itemId, sellerNotes } = data;

  if (!Array.isArray(images) || images.length === 0) {
    throw new Error('Invalid or missing image paths');
  }

  const analysisPrompt = `
Analyze the provided images to fill out the specified JSON structure with detailed information.

# Steps

1. Review each image carefully to gather details about the item.
2. For each attribute in the JSON structure, assess all images to determine the appropriate value.
3. If an attribute cannot be determined or is not applicable, assign it a value of \`null\`.
4. Use additional information such as the description, item ID, and seller notes if provided, to assist in filling out the JSON.

# Output Format

Provide the output strictly in the following JSON format with each field filled out accordingly:

{
  "type": "string",
  "brand": "string",
  "condition": "string",
  "rarity": "string",
  "authenticityConfirmed": "Yes/No",
  "packagingAccessories": "string",
  "purchasePrice": 0,
  "cleaningRepairCosts": 0,
  "estimatedShippingCosts": 0,
  "platformFees": 0,
  "expectedProfit": 0,
  "marketDemand": "string",
  "historicalPriceTrends": "string",
  "marketSaturation": "string",
  "salesVelocity": "string",
  "purchaseRecommendation": "Yes/No",
  "detailedBreakdown": "string"
}

# Notes

- Ensure all numbers are provided without quotes and any unavailable or undetermined fields are set to \`null\`.
- Utilize any supplementary details such as description, item ID, and seller notes, even if they are not directly visible in the images.
- If relevant, the provided number of images should be considered during the analysis process for context.

Additional Information:
Description: ${description || 'N/A'}
Item ID: ${itemId || 'N/A'}
Seller Notes: ${sellerNotes || 'N/A'}

Note: ${images.length} images were provided for analysis.
`;

  console.log('Image paths before processing:', images);
  const processedImages = await processImages(images);
  console.log('Number of processed images:', processedImages.length);

  const validProcessedImages = processedImages.filter(
    (img) => img && img.base64
  );
  console.log('Number of valid processed images:', validProcessedImages.length);

  if (validProcessedImages.length === 0) {
    throw new Error('No valid images were processed');
  }

  const messages = [
    createUserMessage(analysisPrompt),
    ...validProcessedImages.map((img) => {
      console.log(`Creating message for image: ${img.original_path}`);
      return {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this image:' },
          { type: 'image_url', image_url: { url: img.base64 } },
        ],
      };
    }),
  ];

  console.log('Number of messages created:', messages.length);

  try {
    const analysisResponse = await interactWithMoolaMaticAssistant(messages);
    return analysisResponse; // Return the raw response without parsing
  } catch (error) {
    console.error('Error sending analysis request:', error);
    throw error;
  }
}

/**
 * Sends an array of JSON analysis objects to the backend endpoint /api/combine-image-analyses.
 * @param {Array<Object>} analysisJSONs - Array of analysis JSON objects.
 * @returns {Promise<Object>} The combined and summarized JSON response from the backend.
 * @throws Will throw an error if the request fails or the response status is unexpected.
 */
const sendToBackend = async (analysisJSONs) => {
  try {
    const backendUrl =
      process.env.BACKEND_URL ||
      'http://localhost:3001/api/combine-image-analyses';

    const response = await axios.post(backendUrl, analysisJSONs, {
      headers: {
        'Content-Type': 'application/json',
        // Include authentication headers if required
        // 'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
      },
      timeout: 5000, // 5 seconds timeout
    });

    if (response.status === 200) {
      console.log('Combined analysis received:', response.data);
      return response.data;
    } else {
      console.error(`Unexpected response status: ${response.status}`);
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    if (error.isAxiosError) {
      console.error(
        'Axios error while sending analyses to backend:',
        error.message
      );
    } else {
      console.error(
        'Unexpected error while sending analyses to backend:',
        error.message
      );
    }
    throw error;
  }
};

export { sendAnalysisRequest, sendToBackend };
