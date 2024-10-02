// backend/chat/chatManager.js

import axios from 'axios';
import { processTextChat } from './chatService.js'; // Import the text chat processing function
import { processImageChat, processImageQuestion } from './chatService.js'; // Import image-related functions
import { createUserMessage, createAssistantMessage } from './chatAssistant.js';

/**
 * Configuration for API URLs
 * Ensures that API endpoints are dynamically set based on environment variables.
 */
const BACKEND_PORT = process.env.BACKEND_PORT || 3001;
const API_URL = `http://localhost:${BACKEND_PORT}/api`;

/**
 * Handles user messages by managing context and interacting with the Moola-Matic Assistant.
 * @param {String} userMessage - The message sent by the user.
 * @param {Object} session - The user's session object containing conversation history and draft images.
 * @returns {Promise<String>} - The assistant's response.
 */
export const handleUserMessage = async (userMessage, session) => {
  try {
    console.log('Handling user message:', userMessage);

    // Initialize session messages array if it doesn't exist
    if (!session.messages) {
      session.messages = [];
    }

    // Add user message to session using helper
    const userMsg = createUserMessage(userMessage);
    session.messages.push(userMsg);

    // Manage context: summarize if necessary
    const managedMessages = await processTextChat(session.messages);

    // Get assistant response
    const assistantResponseContent = await interactWithMoolaMaticAssistant(managedMessages, session);

    // Create assistant message using helper
    const assistantMsg = createAssistantMessage(assistantResponseContent);
    session.messages.push(assistantMsg);

    return assistantResponseContent;
  } catch (error) {
    console.error('Error in handleUserMessage:', error);
    throw new Error('Failed to handle user message. Please try again later.');
  }
};

/**
 * Handles image uploads by converting them to base64 and sending to the backend for analysis.
 * @param {Buffer} imageFileBuffer - Buffer of the uploaded image file.
 * @param {Array} messages - Current conversation messages.
 * @returns {Promise<String>} - The assistant's response after image analysis.
 */
export const handleImageUpload = async (imageFileBuffer, messages) => {
  try {
    console.log('Handling image upload.');

    // Process image chat by sending it to chatImages.js
    const assistantResponse = await processImageChat(imageFileBuffer, messages);

    return assistantResponse;
  } catch (error) {
    console.error('Error in handleImageUpload:', error);
    throw new Error('Failed to process image upload. Please try again later.');
  }
};

/**
 * Handles questions related to previously uploaded images by sending them to the backend for analysis.
 * @param {String} question - The user's question about the image.
 * @param {String} imageReference - The reference or URL of the previously saved image.
 * @returns {Promise<String>} - The assistant's response after analyzing the image question.
 */
export const handleImageQuestion = async (question, imageReference) => {
  try {
    console.log('Handling image-related question:', question);

    // Process image question by sending it to chatImages.js
    const assistantResponse = await processImageQuestion(question, imageReference);

    return assistantResponse;
  } catch (error) {
    console.error('Error in handleImageQuestion:', error);
    throw new Error('Failed to process image question. Please try again later.');
  }
};