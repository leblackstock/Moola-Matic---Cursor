// backend/chat/chatService.js

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processTextChat } from './chatAssistant.js'; // Import the chat processing function

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Validate essential environment variables
const { SESSION_SECRET } = process.env;

if (!SESSION_SECRET) {
  console.error('Error: SESSION_SECRET is not defined in the .env file.');
  process.exit(1);
}

/**
 * Function to manage and summarize large text context
 * Delegates summarization to Moola-Matic Assistant via chatAssistant.js
 * @param {Array} messages - Array of message objects { role: 'user' | 'assistant', content: '...' }
 * @returns {Promise<Array>} - Updated messages array with summarized context if necessary
 */
export const manageContext = async (messages) => {
  try {
    console.log('Managing conversation context.');

    // Estimate the token count (Simple estimation: 1 token per word)
    const estimatedTokens = messages.reduce(
      (acc, msg) => acc + msg.content.split(' ').length,
      0
    );

    const TOKEN_LIMIT = 4096; // Example token limit for GPT-4 Turbo

    if (estimatedTokens > TOKEN_LIMIT * 0.8) { // If context exceeds 80% of the limit
      console.log('Context is large. Summarizing to maintain efficiency.');

      // Prepare a summary request
      const summaryMessages = [
        { role: 'system', content: 'You are an assistant that summarizes conversation history when it becomes too lengthy.' },
        { role: 'user', content: 'Please provide a concise summary of the following conversation to maintain context.' },
        { role: 'assistant', content: JSON.stringify(messages) }, // Send the entire conversation as a JSON string
      ];

      // Delegate summarization to Moola-Matic Assistant
      const summary = await processTextChat(summaryMessages);

      console.log('Summary generated:', summary);

      // Replace the existing context with the summary
      const summarizedMessages = [
        { role: 'system', content: 'You are Moola-Matic, an intelligent assistant that manages treasure items.' },
        { role: 'assistant', content: summary },
      ];

      return summarizedMessages;
    }

    // If context is manageable, return as is
    return messages;
  } catch (error) {
    // Log the error details for debugging
    console.error('Error in manageContext:', error);

    // Return the original messages if summarization fails
    return messages;
  }
};

/**
 * NOTE: Image handling is now managed by chatManager.js.
 * The function below has been disabled to prevent image processing within chatService.js.
 * Future implementations of image handling should utilize chatManager.js or dedicated modules.
 */

/**
 * Function to save image references for future use
 * @param {String} imageData - Base64 encoded image data
 * @returns {Promise<String>} - Reference or URL to the stored image
 */
// export const saveImageReference = async (imageData) => {
//   try {
//     console.log('Saving image reference.');
//
//     // Implement your image storage logic here.
//     // For example, store the image in a cloud storage and return the URL.
//
//     // Placeholder: Returning an error message as image handling is not allowed.
//     throw new Error('Image handling is not allowed in chatService.js.');
//
//   } catch (error) {
//     console.error('Error in saveImageReference:', error);
//     throw new Error('Failed to save image reference. Image handling is not permitted.');
//   }
// };
