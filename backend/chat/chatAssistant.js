// backend/chat/chatAssistant.js

import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import OpenAI from 'openai';
import { combineAnalyses } from './chatCombineAnalysis.js';

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

  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

  try {
    const buffer = Buffer.from(base64Data, 'base64');
    return buffer;
  } catch (error) {
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
    return Buffer.from(response.data, 'binary').toString('base64');
  } catch (error) {
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

    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const buffer = Buffer.from(base64Data, 'base64');

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

    const analysis = response.choices[0].message.content;

    // Log the analysis result for this image
    console.log('Image analysis result:', analysis);

    // Use combineAnalyses to parse and combine the analysis
    const combinedAnalysis = combineAnalyses([analysis]);

    return { analysis, combinedAnalysis };
  } catch (error) {
    throw error;
  }
};

/**
 * Summarizes combined analyses using gpt-4-turbo.
 * @param {string} combinedAnalysis - The combined analysis to summarize.
 * @param {string} summarizePrompt - The prompt for summarization.
 * @returns {Promise<string>} - The summarized analysis.
 */
const summarizeAnalyses = async (combinedAnalysis, summarizePrompt) => {
  try {
    if (!combinedAnalysis) {
      console.warn('No combined analysis to summarize');
      return null;
    }

    const analysisString = JSON.stringify(combinedAnalysis, null, 2);
    const fullPrompt = `${summarizePrompt}\n\nCombined Analysis:\n${analysisString}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const summary = response.choices[0].message.content;
    console.log('Analysis summary:', summary);

    return summary;
  } catch (error) {
    console.error('Error in summarizeAnalyses:', error);
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
    return response.choices[0].message.content;
  } catch (error) {
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
