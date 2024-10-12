// backend/chat/chatAssistant.js

import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertImageToBase64 } from '../utils/imageProcessor.js';
import axios from 'axios';
import FormData from 'form-data'; // Import form-data
import fs from 'fs/promises';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

// Validate essential environment variables
const { OPENAI_API_KEY, MOOLA_MATIC_ASSISTANT_ID } = process.env;

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not defined in the .env file.');
  process.exit(1);
}

if (!MOOLA_MATIC_ASSISTANT_ID) {
  console.error(
    'Error: MOOLA_MATIC_ASSISTANT_ID is not defined in the .env file.'
  );
  process.exit(1);
}

// Initialize OpenAI Client with Assistants API support
const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

console.log('API Key loaded:', OPENAI_API_KEY ? 'Yes' : 'No');

/**
 * Creates a user message object.
 * @param {string} content - The content of the message.
 * @returns {Object} - Message object with role 'user'.
 */
const createUserMessage = (content) => ({
  role: 'user',
  content,
});

/**
 * Creates an assistant message object.
 * @param {string} content - The content of the message.
 * @returns {Object} - Message object with role 'assistant'.
 */
const createAssistantMessage = (content) => ({
  role: 'assistant',
  content,
});

/**
 * Validates all messages to ensure they contain 'role' and 'content'.
 * @param {Array} messages - Array of message objects.
 * @throws Will throw an error if any message is missing 'role' or 'content'.
 */
const validateMessages = (messages) => {
  messages.forEach((msg, index) => {
    if (!msg.role || !msg.content) {
      throw new Error(
        `Message at index ${index} is missing 'role' or 'content'.`
      );
    }
  });
};

/**
 * Creates a new thread with validated messages.
 * @param {Array} messages - Array of message objects.
 * @returns {Promise<String>} - Thread ID.
 */
const createThread = async (messages) => {
  try {
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const thread = await client.beta.threads.create({
      messages: formattedMessages,
    });
    console.log('Thread created:', thread);
    return thread.id;
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
};

/**
 * Adds a message to a thread with validation.
 * @param {String} threadId - ID of the thread.
 * @param {String} role - 'user' or 'assistant'.
 * @param {String} content - Message content.
 */
const addMessageToThread = async (threadId, role, content) => {
  try {
    await client.beta.threads.messages.create(threadId, {
      role: role,
      content: content,
    });
    console.log(
      `Message added to thread ${threadId}: { role: '${role}', content: '${content.substring(0, 50)}...' }`
    );
  } catch (error) {
    console.error('Error adding message to thread:', error);
    throw error;
  }
};

/**
 * Function to create a run
 * @param {String} threadId - ID of the thread
 * @param {String} assistantId - ID of the assistant
 * @returns {Promise<String>} - Run ID
 */
const createRun = async (threadId, assistantId) => {
  try {
    const run = await client.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });
    console.log('Run created:', run);
    return run.id;
  } catch (error) {
    console.error('Error creating run:', error);
    throw error;
  }
};

/**
 * Function to poll run status until completion
 * @param {String} threadId - ID of the thread
 * @param {String} runId - ID of the run
 * @returns {Promise<Object>} - Run object
 */
const waitForRunCompletion = async (threadId, runId) => {
  let runStatus;
  do {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    runStatus = await client.beta.threads.runs.retrieve(threadId, runId);
    console.log(`Run status: ${runStatus.status}`);

    if (runStatus.status === 'failed') {
      console.error('Run failed. Error:', runStatus.last_error);
      throw new Error(
        `Run failed with status: ${runStatus.status}. Error: ${runStatus.last_error?.message || 'Unknown error'}`
      );
    }
  } while (runStatus.status !== 'completed');
};

/**
 * Function to get assistant response from a thread
 * @param {String} threadId - ID of the thread
 * @param {String} runId - ID of the run
 * @returns {Promise<String>} - Assistant response content
 */
const getAssistantResponse = async (threadId, runId) => {
  try {
    console.log(
      `Retrieving assistant response for thread ${threadId} and run ${runId}`
    );
    const messages = await client.beta.threads.messages.list(threadId);
    const lastMessage = messages.data
      .filter(
        (message) => message.run_id === runId && message.role === 'assistant'
      )
      .pop();

    if (!lastMessage) {
      console.log(`No assistant message found for run ${runId}`);
      return null;
    }

    console.log(
      'Assistant response retrieved:',
      lastMessage.content[0].text.value
    );
    return lastMessage.content[0].text.value;
  } catch (error) {
    console.error('Error in getAssistantResponse:', error);
    throw error;
  }
};

/**
 * Function to retrieve the Moola-Matic assistant
 * @returns {Promise<Object>} - Assistant object
 */
const retrieveMoolaMaticAssistant = async () => {
  try {
    const assistant = await client.beta.assistants.retrieve(
      MOOLA_MATIC_ASSISTANT_ID
    );
    console.log('Retrieved Moola-Matic assistant:', assistant);
    return assistant;
  } catch (error) {
    console.error('Error retrieving Moola-Matic assistant:', error);
    throw error;
  }
};

/**
 * Helper function to format context data for the thread
 * @param {Object} contextData - The context data to be formatted
 * @returns {Object|null} - Formatted message object for the thread or null if no valid data
 */
const formatContextData = (contextData) => {
  if (!contextData) return null;

  // Extract relevant information from contextData
  const relevantData = {
    lastInteraction: contextData.lastInteraction,
    userPreferences: contextData.userPreferences,
    // Add other relevant properties here
  };

  // Filter out undefined or null values
  const filteredData = Object.fromEntries(
    Object.entries(relevantData).filter(([_, v]) => v != null)
  );

  // Only return a message if there's actual content
  if (Object.keys(filteredData).length > 0) {
    return {
      role: 'assistant', // Changed from 'system' to 'assistant'
      content: JSON.stringify(filteredData),
    };
  }

  return null; // Return null if there's no valid data to send
};

/**
 * Interacts with the Moola-Matic Assistant API.
 * @param {Array} messages - Array of message objects { role: 'user' | 'assistant', content: '...' }
 * @param {Object} session - Express session object
 * @returns {Promise<string>} - Moola-Matic's response content
 */
const interactWithMoolaMaticAssistant = async (
  messages,
  contextData,
  imagePaths = []
) => {
  try {
    // Retrieve the Moola-Matic assistant first
    const assistant = await retrieveMoolaMaticAssistant();

    // Ensure messages is an array and only contains user messages
    const userMessages = Array.isArray(messages)
      ? messages
          .filter((msg) => msg.role === 'user')
          .map(({ content }) => ({ role: 'user', content }))
      : [{ role: 'user', content: messages }];

    const threadId = await createThread(userMessages);

    // Add context data as a system message
    const formattedContextData = formatContextData(contextData);
    if (formattedContextData) {
      await addMessageToThread(
        threadId,
        formattedContextData.role,
        formattedContextData.content
      );
    }

    // Process and upload images
    if (imagePaths.length > 0) {
      const fileIds = await Promise.all(imagePaths.map(uploadImage));
      const validFileIds = fileIds.filter((id) => id !== null);
      console.log('Uploaded file IDs:', validFileIds);

      // Add image analysis request to the thread
      if (validFileIds.length > 0) {
        const imageContent = validFileIds.map((fileId) => ({
          type: 'image_file',
          image_file: { file_id: fileId },
        }));

        await client.beta.threads.messages.create(threadId, {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze these images and provide details about the item(s) shown.',
            },
            ...imageContent,
          ],
        });
      }
    }

    // Create a run using the retrieved assistant
    const runId = await createRun(threadId, assistant.id);
    await waitForRunCompletion(threadId, runId);

    // Pass both threadId and runId to getAssistantResponse
    const assistantResponse = await getAssistantResponse(threadId, runId);

    // Ensure contextData is an object
    const context =
      typeof contextData === 'string' ? JSON.parse(contextData) : contextData;

    // Update contextData
    if (context && typeof context === 'object') {
      context.lastInteraction = new Date().toISOString();
    } else {
      console.warn('contextData is not an object, skipping update');
    }

    return assistantResponse; // Just return the response content
  } catch (error) {
    console.error('Error interacting with Moola-Matic assistant:', error);
    throw new Error('Failed to interact with Moola-Matic Assistant.');
  }
};

async function uploadImage(imagePath) {
  const fileName = path.basename(imagePath);
  console.log(`Attempting to upload image: ${fileName}`);

  try {
    const base64String = await convertImageToBase64(imagePath);
    console.log(`Image converted to base64: ${fileName}`);

    const formData = new FormData();
    const buffer = Buffer.from(base64String, 'base64');
    formData.append('file', buffer, {
      filename: fileName,
      contentType: 'image/jpeg', // Adjust if using different image types
    });
    formData.append('purpose', 'vision');

    console.log('Sending request to OpenAI API...');
    const response = await axios.post(
      'https://api.openai.com/v1/files',
      formData,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
      }
    );

    console.log('Response received from OpenAI API');
    const fileId = response.data.id;
    console.log(`Image ${fileName} uploaded successfully. File ID: ${fileId}`);
    return fileId;
  } catch (error) {
    console.error(
      `Error uploading image ${fileName}:`,
      error.response ? error.response.data : error.message
    );
    return null;
  }
}

// Consolidated export at the bottom
export {
  interactWithMoolaMaticAssistant,
  createUserMessage,
  createAssistantMessage,
  waitForRunCompletion,
  getAssistantResponse,
  formatContextData,
};
