// backend/chat/chatAssistant.js

import express from 'express';
import bodyParser from 'body-parser';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Validate essential environment variables
const { OPENAI_API_KEY, MOOLA_MATIC_ASSISTANT_ID, BACKEND_PORT } = process.env;

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not defined in the .env file.');
  process.exit(1);
}

if (!MOOLA_MATIC_ASSISTANT_ID) {
  console.error('Error: MOOLA_MATIC_ASSISTANT_ID is not defined in the .env file.');
  process.exit(1);
}

if (!BACKEND_PORT) {
  console.error('Error: BACKEND_PORT is not defined in the .env file.');
  process.exit(1);
}

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Initialize Express Router
const router = express.Router();

// Parse JSON bodies
router.use(bodyParser.json());

/**
 * Function to interact with the Moola-Matic Assistant API
 * @param {Array} messages - Array of message objects { role: 'user' | 'assistant', content: '...' }
 * @returns {Promise<String>} - Moola-Matic's response content
 */
const interactWithMoolaMaticAssistant = async (messages) => {
  try {
    console.log('Interacting with Moola-Matic Assistant:', messages);

    // Use the Assistant ID from the environment variable
    const assistantId = MOOLA_MATIC_ASSISTANT_ID;

    // Create a chat completion using OpenAI's Assistant Chat API for Moola-Matic
    const response = await openai.assistants.chat({
      assistantId: assistantId,
      messages: messages,
      temperature: 1,       // Set temperature for more creative responses
      max_tokens: 2048,     // Adjust max_tokens as needed
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: "text",
    });

    // Extract the assistant's response from the API response
    const assistantResponse = response.choices[0].message?.content.trim();

    if (!assistantResponse) {
      console.error('No content received from Moola-Matic Assistant.');
      throw new Error('No response from Moola-Matic.');
    }

    console.log('Moola-Matic response:', assistantResponse);

    return assistantResponse;
  } catch (error) {
    console.error('Error in interactWithMoolaMaticAssistant:', error);
    throw new Error('An error occurred while processing your request with Moola-Matic.');
  }
};

/**
 * Route to handle text-only chat interactions
 * POST /api/chat
 * Body: { messages: Array }
 */
router.post('/chat', async (req, res) => {
  const { messages } = req.body;

  // Error handling for invalid message format
  if (!messages || !Array.isArray(messages)) {
    console.error('Invalid messages format received.');
    return res.status(400).json({ error: 'Invalid messages format. Expected an array of messages.' });
  }

  try {
    // Get response from Moola-Matic
    const assistantResponse = await interactWithMoolaMaticAssistant(messages);

    // Optionally, save conversation history here using your preferred method
    // Example: saveConversation(req.session.userId, messages, assistantResponse);

    return res.json({ content: assistantResponse });
  } catch (error) {
    console.error('Error in /chat:', error);
    // Provide a user-friendly error message without exposing technical details
    return res.status(500).json({ error: 'Failed to process chat with Moola-Matic. Please try again later.' });
  }
});

/**
 * Route to handle image-based chat interactions
 * POST /api/analyze-image
 * This route is intentionally disabled to prevent any image data from being processed or sent.
 */
router.post('/analyze-image', (req, res) => {
  console.error('Attempted to send image data to /api/analyze-image. This operation is not allowed.');
  return res.status(400).json({ error: 'Image processing is not allowed. Only text-based interactions are supported.' });
});

export default router;

// Add this export at the end of the file
export { interactWithMoolaMaticAssistant };
