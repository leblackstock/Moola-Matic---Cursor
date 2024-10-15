// backend/chat/chatAssistant.js

import dotenv from 'dotenv';
import axios from 'axios';
//import fs from 'fs';
//import path from 'path';
//import { fileURLToPath } from 'url';
//import { dirname } from 'path';
import { Buffer } from 'buffer';
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
const uploadBase64Image = async (base64Image, originalFileName) => {
  try {
    console.log('Preparing base64 image data for upload');

    if (!originalFileName) {
      throw new Error('Original filename is required');
    }

    // Convert the base64 string to a buffer
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload file using the OpenAI SDK
    const response = await openai.files.create({
      file: buffer,
      purpose: 'vision',
      filename: originalFileName,
    });

    const fileId = response.id;
    console.log(
      'File uploaded successfully. File ID:',
      fileId.substring(0, 10) + '...'
    );

    return fileId;
  } catch (error) {
    console.error('Error in uploadBase64Image:', error.message);
    throw error;
  }
};

/**
 * Summarizes combined analyses using GPT-4-turbo.
 * @param {string} combinedAnalyses - The combined analyses to summarize.
 * @param {string} summarizePrompt - The prompt for summarization.
 * @returns {Promise<string>} - The summarized analysis.
 */
const summarizeAnalyses = async (combinedAnalyses, summarizePrompt) => {
  try {
    console.log('Preparing to summarize analyses');

    const userContent = `${summarizePrompt}\n\nAnalyses to summarize:\n\n${combinedAnalyses}`;

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
 * Analyzes file content using GPT-4-turbo to identify the item.
 * @param {string} fileContent - The content of the file to analyze.
 * @returns {Promise<string>} - The analysis result.
 * @param {string} analysisPrompt - The prompt/question for analysis.
 */
const analyzeImagesWithVision = async (
  base64Image,
  analysisPrompt,
  filename
) => {
  try {
    console.log('Analyzing file content with GPT-4-turbo');
    const uploadedFile = await uploadBase64Image(base64Image, filename);

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'user',
          content: `Please identify the item in the following content: ${uploadedFile}, ${analysisPrompt}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: { type: 'text' },
    });

    const analysis = response.choices[0].message.content;
    console.log('File content analysis completed');
    return analysis;
  } catch (error) {
    console.error('Error in analyzeFileContent:', error.message);
    throw error;
  }
};

// Export functions
export {
  uploadBase64Image,
  analyzeImagesWithVision,
  summarizeAnalyses,
  createAssistantMessage,
  retrieveFileContent,
};
