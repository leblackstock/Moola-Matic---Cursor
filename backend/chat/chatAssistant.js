// backend/chat/chatAssistant.js

import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import OpenAI from 'openai';

dotenv.config();

// Initialize OpenAI API Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================== Function Definitions ==============================

/**
 * Uploads a local image file to OpenAI and returns the file ID.
 * @param {string} imagePath - The local path to the image file.
 * @returns {Promise<string>} - The ID of the uploaded file.
 */
// const uploadLocalImage = async (imagePath) => {
//   try {
//     const fileStream = fs.createReadStream(imagePath);
//     const response = await openai.files.create({
//       file: fileStream,
//       purpose: 'vision',
//     });
//     console.log('Image uploaded successfully. File ID:', response.id);
//     return response.id;
//   } catch (error) {
//     console.error('Error uploading image:', truncateMessage(error.message));
//     throw error;
//   }
// };

/**
 * Uploads a base64-encoded image to OpenAI and returns the file ID.
 * @param {string} base64Image - The base64-encoded image string.
 * @param {string} originalFileName - The original filename of the image.
 * @returns {Promise<Buffer>} - The buffer of the image.
 */
const uploadBase64Image = async (base64Image, originalFileName) => {
  if (!base64Image || typeof base64Image !== 'string') {
    throw new Error('Invalid base64Image input');
  }

  // Remove the data URI prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

  try {
    const buffer = Buffer.from(base64Data, 'base64');
    console.log(
      `Processed image: ${originalFileName}, Size: ${buffer.length} bytes`
    );
    return buffer;
  } catch (error) {
    console.error('Error processing base64 image:', error);
    throw error;
  }
};

/**
 * Retrieves the content of a file from OpenAI using its file ID.
 * @param {string} fileId - The ID of the file to retrieve.
 * @returns {Promise<string>} - The content of the file in base64.
 */
const retrieveFileContent = async (fileId) => {
  try {
    const apiUrl = `https://api.openai.com/v1/files/${fileId}/content`;
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      responseType: 'arraybuffer',
    });
    console.log('OpenAI Response:', JSON.stringify(response.headers, null, 2));
    return Buffer.from(response.data, 'binary').toString('base64');
  } catch (error) {
    console.error('Error retrieving file content:', error.message);
    throw error;
  }
};

/**
 * Analyzes file content using gpt-4-turbo to identify the item.
 * @param {string} analysisPrompt - The prompt/question for analysis.
 * @param {string} base64Image - The base64-encoded image string to analyze.
 * @returns {Promise<string>} - The analysis result.
 */
const analyzeImagesWithVision = async (analysisPrompt, base64Image) => {
  try {
    if (!base64Image || typeof base64Image !== 'string') {
      throw new Error('Invalid base64Image input');
    }

    // Remove the data URI prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const buffer = Buffer.from(base64Data, 'base64');
    console.log(`Processing image, size: ${buffer.length} bytes`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: analysisPrompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    console.log(
      'Image analysis completed. Response length:',
      response.choices[0].message.content.length
    );
    return response.choices[0].message.content;
  } catch (error) {
    const truncatedMessage = truncateMessage(error.message);
    console.error('Error analyzing image:', truncatedMessage);
    throw error;
  }
};

/**
 * Summarizes combined analyses using gpt-4-turbo.
 * @param {string} combinedAnalyses - The combined analyses to summarize.
 * @param {string} summarizePrompt - The prompt for summarization.
 * @returns {Promise<string>} - The summarized analysis.
 */
const summarizeAnalyses = async (combinedAnalyses, summarizePrompt) => {
  try {
    const userContent = `${summarizePrompt}\n\nAnalyses to summarize:\n\n${JSON.stringify(combinedAnalyses)}`;
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
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
    console.log(
      'Analyses summarized. Summary length:',
      response.choices[0].message.content.length
    );
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error summarizing analyses:', error.message);
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
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
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
    console.log(
      'Assistant message created. Response length:',
      response.choices[0].message.content.length
    );
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error creating assistant message:', error.message);
    throw error;
  }
};

// =================================================================================

// Export functions
export {
  //uploadLocalImage,
  uploadBase64Image,
  retrieveFileContent,
  analyzeImagesWithVision,
  summarizeAnalyses,
  createAssistantMessage,
};

/**
 * Truncates a message to a specified length.
 * @param {string} message - The message to truncate.
 * @param {number} maxLength - The maximum length of the truncated message.
 * @returns {string} - The truncated message.
 */
const truncateMessage = (message, maxLength = 500) => {
  if (message.length <= maxLength) {
    return message;
  }
  return message.slice(0, maxLength) + '... (truncated)';
};
