// backend/chat/chatAssistant.js

import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
//import path from 'path';
//import { fileURLToPath } from 'url';
//import { dirname } from 'path';
//import { Buffer } from 'buffer';
import OpenAI from 'openai';

dotenv.config();

// Initialize OpenAI API Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Determine the current directory path
//const __filename = fileURLToPath(import.meta.url);
//const __dirname = dirname(__filename);

/**
 * Uploads a base64-encoded image to OpenAI and returns the file ID.
 * @param {string} base64Image - The base64-encoded image string.
 * @param {string} originalFileName - The original filename of the image.
 * @returns {Promise<string>} - The ID of the uploaded file.
 */
// const uploadBase64Image = async (base64Image, originalFileName) => {
//   try {
//     console.log('Preparing base64 image data for upload');

//     if (!originalFileName) {
//       throw new Error('Original filename is required');
//     }

//     // Convert the base64 string to a buffer
//     const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
//     const buffer = Buffer.from(base64Data, 'base64');
//     console.log('Buffer Size:', buffer.length);

//     // Upload file using the OpenAI SDK
//     const response = await openai.files.create({
//       file: buffer,
//       purpose: 'vision',
//       filename: originalFileName,
//     });

//     const fileId = response.id;
//     console.log(
//       'File uploaded successfully. File ID:',
//       fileId.substring(0, 10) + '...'
//     );

//     return fileId;
//   } catch (error) {
//     console.error('Error in uploadBase64Image:', error.message);
//     throw error;
//   }
// };

/**
 * Summarizes combined analyses using GPT-4o.
 * @param {string} combinedAnalyses - The combined analyses to summarize.
 * @param {string} summarizePrompt - The prompt for summarization.
 * @returns {Promise<string>} - The summarized analysis.
 */
const summarizeAnalyses = async (combinedAnalyses, summarizePrompt) => {
  try {
    console.log('Preparing to summarize analyses');

    const userContent = `${summarizePrompt}\n\nAnalyses to summarize:\n\n${combinedAnalyses}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.5,
      max_tokens: 1024,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: { type: 'text' },
    });

    const summary = response.choices[0].message.content;
    console.log('Received summary from OpenAI API', { summary });

    return summary;
  } catch (error) {
    console.error('Error in summarizeAnalyses:', error.message);
    throw error;
  }
};

/**
 * Creates an assistant message based on the user's input.
 * @param {string} userMessage - The user's message.
 * @returns {Promise<string>} - The assistant's response.
 */
const createAssistantMessage = async (userMessage) => {
  try {
    console.log('Sending user message to OpenAI:', { userMessage });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: { type: 'text' },
    });

    const assistantResponse = response.choices[0].message.content;
    console.log('Received assistant response:', { assistantResponse });

    return assistantResponse;
  } catch (error) {
    console.error('Error in createAssistantMessage:', error.message);
    throw error;
  }
};

/**
 * Retrieves the content of a file from OpenAI using its file ID.
 * @param {string} fileId - The ID of the file to retrieve.
 * @returns {Promise<string>} - The content of the file.
 */
const retrieveFileContent = async (fileId) => {
  try {
    console.log(
      'Retrieving file content for file ID:',
      fileId.substring(0, 10) + '...'
    );
    const apiUrl = `https://api.openai.com/v1/files/${fileId}/content`;

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    console.log('File content retrieved successfully');
    return response.data;
  } catch (error) {
    console.error('Error retrieving file content:', error.message);
    throw error;
  }
};

/**
 * Analyzes file content using GPT-4o to identify the item.
 * @param {string} analysisPrompt - The prompt/question for analysis.
 * @param {string} fileId - The ID of the file to analyze.
 * @returns {Promise<string>} - The analysis result.
 */
const analyzeImagesWithVision = async (analysisPrompt, fileId) => {
  try {
    console.log('Action: Preparing to analyze image', {
      fileId: fileId.substring(0, 10) + '...',
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: analysisPrompt },
            {
              type: 'image_url',
              image_url: {
                url: `https://api.openai.com/v1/files/${fileId}/content`,
              },
            },
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: { type: 'text' },
    });
    console.log('Action: Sent analysis request to OpenAI', {
      fileId: fileId.substring(0, 10) + '...',
    });

    const analysis = response.choices[0].message.content;
    console.log('File content analysis completed');

    return analysis;
  } catch (error) {
    console.error('Error in analyzeImagesWithVision:', error.message);
    console.log('Action: Encountered error during image analysis', {
      fileId: fileId.substring(0, 10) + '...',
    });
    if (error.response) {
      console.error('OpenAI API Error:', error.response.data);
    }
    throw error;
  }
};

/**
 * Uploads a local image file to OpenAI and returns the file ID.
 * @param {string} imagePath - The local path to the image file.
 * @param {string} originalFileName - The original filename of the image.
 * @returns {Promise<string>} - The ID of the uploaded file.
 */
const uploadLocalImage = async (imagePath) => {
  try {
    console.log('Preparing local image data for upload');
    console.log('Action: Received image path for upload', { imagePath });

    if (!fs.existsSync(imagePath)) {
      console.log('Action: Checked file existence', { imagePath });
      throw new Error(`File not found: ${imagePath}`);
    }

    // Create a read stream for the image file
    const fileStream = fs.createReadStream(imagePath);
    console.log('Action: Created read stream for file', { imagePath });

    // Upload the file using OpenAI SDK
    const response = await openai.files.create({
      file: fileStream,
      purpose: 'vision',
    });
    console.log('Action: Uploaded file to OpenAI', { imagePath });

    const fileId = response.id;
    console.log('Action: Retrieved file ID from response', {
      fileId: fileId.substring(0, 10) + '...',
    });

    console.log(
      'File uploaded successfully. File ID:',
      fileId.substring(0, 10) + '...'
    );

    return fileId;
  } catch (error) {
    console.error('Error in uploadLocalImage:', error.message);
    console.log('Action: Encountered error during file upload', { imagePath });
    if (error.response) {
      console.error('OpenAI API Error:', error.response.data);
    }
    throw error;
  }
};

// Export functions
export {
  uploadLocalImage,
  analyzeImagesWithVision,
  summarizeAnalyses,
  createAssistantMessage,
  retrieveFileContent,
};
