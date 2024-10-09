// backend/chat/chatAssistant.js

import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

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
const waitForRunCompletion = async (threadId, runId, timeout = 60000) => {
  // 60 seconds timeout
  try {
    const interval = 1000; // 1 second
    let elapsed = 0;

    let run = await client.beta.threads.runs.retrieve(threadId, runId);

    while (run.status === 'queued' || run.status === 'in_progress') {
      if (elapsed >= timeout) {
        throw new Error('Run timed out while waiting for completion.');
      }
      await new Promise((resolve) => setTimeout(resolve, interval)); // Wait for 1 second
      run = await client.beta.threads.runs.retrieve(threadId, runId);
      elapsed += interval;
    }

    if (run.status === 'completed') {
      return run;
    } else {
      throw new Error(`Run failed with status: ${run.status}`);
    }
  } catch (error) {
    console.error('Error waiting for run completion:', error);
    throw error;
  }
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
const interactWithMoolaMaticAssistant = async (messages, contextData) => {
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

    // Create a run using the retrieved assistant
    const runId = await createRun(threadId, assistant.id);
    await waitForRunCompletion(threadId, runId);

    // Pass both threadId and runId to getAssistantResponse
    const assistantResponse = await getAssistantResponse(threadId, runId);

    // Update contextData directly here
    if (contextData) {
      contextData.lastInteraction = new Date().toISOString();
      // Add any other context updates here
    }

    return assistantResponse; // Just return the response content
  } catch (error) {
    console.error('Error interacting with Moola-Matic assistant:', error);
    throw new Error('Failed to interact with Moola-Matic Assistant.');
  }
};

// Consolidated export at the bottom
export {
  interactWithMoolaMaticAssistant,
  createUserMessage,
  createAssistantMessage,
  waitForRunCompletion,
  getAssistantResponse,
  formatContextData, // Add this line
};
