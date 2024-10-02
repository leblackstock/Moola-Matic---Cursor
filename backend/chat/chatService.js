// backend/chat/chatService.js

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { interactWithMoolaMaticAssistant } from './chatAssistant.js'; // Updated import statement

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Validate essential environment variables
const { SESSION_SECRET } = process.env;

if (!SESSION_SECRET) {
  console.error('Error: SESSION_SECRET is not defined in the .env file.');
  process.exit(1);
}

/**
 * Function to manage context
 * @param {Array} messages - Array of message objects { role: 'user' | 'assistant', content: '...' }
 * @returns {Promise<Array>} - Returns the original messages array
 */
export const manageContext = async (messages) => {
  try {
    console.log('Managing conversation context.');
    // For now, we're just returning the original messages without any summarization
    return messages;
  } catch (error) {
    console.error('Error in manageContext:', error);
    return messages;
  }
};

/**
 * Function to handle chat interactions
 * @param {Array} messages - Array of message objects
 * @param {Object} session - Express session object
 * @returns {Promise<String>} - Assistant's response
 */
export const handleMoolaMaticChat = async (messages, session) => {
  try {
    // Interact with the assistant, passing the session
    const assistantResponse = await interactWithMoolaMaticAssistant(messages, session);
    return assistantResponse;
  } catch (error) {
    console.error('Error in handleMoolaMaticChat:', error);
    throw error;
  }
};
