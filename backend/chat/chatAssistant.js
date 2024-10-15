// backend/chat/chatAssistant.js

import dotenv from 'dotenv';
import OpenAI from 'openai';
import winston from 'winston';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/chat_assistant.log' }),
  ],
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadBase64Image = async (base64Image) => {
  try {
    // Ensure base64Image is a string
    if (typeof base64Image !== 'string') {
      throw new Error('base64Image must be a string');
    }

    // Log the base64 image data being sent (first 100 characters)
    logger.info('Preparing base64 image data for upload', {
      base64ImagePreview: base64Image.substring(0, 100) + '...',
      base64ImageLength: base64Image.length,
    });

    // Create a temporary file
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, `${uuidv4()}.png`);

    // Write base64 data to the temporary file
    fs.writeFileSync(
      tempFilePath,
      Buffer.from(base64Image.split(',')[1], 'base64')
    );

    // Create a FormData object and append the file
    const form = new FormData();
    form.append('file', fs.createReadStream(tempFilePath));
    form.append('purpose', 'vision');

    const apiUrl = 'https://api.openai.com/v1/files';

    const response = await axios.post(apiUrl, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);

    logger.info('Uploaded file to OpenAI', { fileId: response.data.id });

    return response.data.id;
  } catch (error) {
    logger.error('Error in uploadBase64Image', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

const analyzeImagesWithVision = async (base64Image, analysisPrompt) => {
  try {
    logger.info('Preparing image data for analysis');

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
                url: `data:image/jpeg;base64,${base64Image.split(',')[1]}`,
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
    });

    logger.info('Received response from OpenAI API', {
      responseStatus: 'success',
      responseData: response.choices[0].message.content,
    });

    return response.choices[0].message.content;
  } catch (error) {
    logger.error('Error in analyzeImagesWithVision', {
      error: error.message,
      stack: error.stack,
    });
    if (error.response) {
      logger.error('API Error:', error.response.data);
    }
    throw error;
  }
};

const createUserMessage = async (threadId, analysisPrompt, fileIds = []) => {
  try {
    return await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: analysisPrompt,
      file_ids: fileIds,
    });
  } catch (error) {
    console.error('Error in createUserMessage:', error);
    throw error;
  }
};

const summarizeAnalyses = async (
  combinedAnalyses,
  combineAndSummarizeAnalysisPrompt
) => {
  try {
    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `${combineAndSummarizeAnalysisPrompt}\n\nAnalyses to combine and summarize:\n\n${JSON.stringify(combinedAnalyses, null, 2)}`,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.MOOLA_MATIC_ASSISTANT_ID,
    });

    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    return messages.data[0].content[0].text.value;
  } catch (error) {
    console.error('Error in summarizeAnalyses:', error);
    throw error;
  }
};

/**
 * Creates an assistant message for text-only interactions.
 * @param {string} userMessage - The user's message.
 * @returns {Promise<string>} - The assistant's response.
 */
const createAssistantMessage = async (userMessage) => {
  try {
    // Log the user message being sent
    logger.info('Sending user message to OpenAI', { userMessage });

    const thread = await openai.beta.threads.create();

    // Add the user's message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: userMessage,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.MOOLA_MATIC_ASSISTANT_ID,
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Retrieve the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantResponse = messages.data[0].content[0].text.value;

    // Log the assistant's response
    logger.info('Received assistant response', { assistantResponse });

    return assistantResponse;
  } catch (error) {
    logger.error('Error in createAssistantMessage', { error: error.message });
    throw error;
  }
};

// Update the exports at the bottom of the file
export {
  analyzeImagesWithVision,
  createUserMessage,
  summarizeAnalyses,
  createAssistantMessage,
  uploadBase64Image,
};
