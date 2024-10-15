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
const uploadLocalImage = async (imagePath) => {
  try {
    const fileStream = fs.createReadStream(imagePath);
    const response = await openai.files.create({
      file: fileStream,
      purpose: 'vision',
    });
    console.log('OpenAI Response:', JSON.stringify(response, null, 2));
    return response.id;
  } catch (error) {
    console.error('Error in uploadLocalImage:', error.message);
    if (error.response) {
      console.error('OpenAI API Error:', error.response.data);
    }
    throw error;
  }
};

/**
 * Uploads a base64-encoded image to OpenAI and returns the file ID.
 * @param {string} base64Image - The base64-encoded image string.
 * @param {string} originalFileName - The original filename of the image.
 * @returns {Promise<string>} - The ID of the uploaded file.
 */
const uploadBase64Image = async (base64Image, originalFileName) => {
  // try {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  // const response = await openai.files.create({
  //   file: buffer,
  //   purpose: 'vision',
  //   filename: originalFileName,
  //});
  //console.log('OpenAI Response:', JSON.stringify(response, null, 2));
  //return response.id;
  // }
  //catch (error) {
  // console.error('Error in uploadBase64Image:', error.message);
  //throw error;
  //}
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
const analyzeImagesWithVision = async (buffer, analysisPrompt, base64Image) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
          type: 'image',
          image: {
            data: buffer,
            content_type: 'image/jpeg',
          },
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: { type: 'text' },
    });
    console.log('OpenAI Response:', JSON.stringify(response, null, 2));
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in analyzeImagesWithVision:', error.message);
    if (error.response) {
      console.error('OpenAI API Error:', error.response.data);
    }
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
    console.log('OpenAI Response:', JSON.stringify(response, null, 2));
    return response.choices[0].message.content;
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
    console.log('OpenAI Response:', JSON.stringify(response, null, 2));
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in createAssistantMessage:', error.message);
    throw error;
  }
};

// =================================================================================

// Export functions
export {
  uploadLocalImage,
  uploadBase64Image,
  retrieveFileContent,
  analyzeImagesWithVision,
  summarizeAnalyses,
  createAssistantMessage,
};
