// frontend/src/api/chat.js

import axios from 'axios';

// Determine the API URL based on the environment
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || 3001;
const API_URL =
  process.env.NODE_ENV === 'production'
    ? '/api'
    : `http://localhost:${BACKEND_PORT}/api`;

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// Add this at the top of the file
let contextData = null;

/**
 * Creates a user message object.
 * @param {string} content - The content of the message.
 * @returns {Object} - Message object with role 'user'.
 */
export const createUserMessage = (content) => ({
  role: 'user',
  content,
});

/**
 * Creates an assistant message object.
 * @param {string} content - The content of the message.
 * @returns {Object} - Message object with role 'assistant'.
 */
export const createAssistantMessage = (content) => ({
  role: 'assistant',
  content,
});

/**
 * Function to handle chat with the Moola-Matic Assistant
 * @param {string} message - The message to send to the assistant
 * @param {string} itemId - The ID of the item associated with this chat
 * @returns {Promise<Object>} - Assistant's response content, updated context, and status
 */
export const handleChatWithAssistant = async (message, itemId) => {
  try {
    console.log('Sending message to Moola-Matic:', message);

    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, itemId }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log('Received response from server:', data);

    return {
      content: data.message,
      context: data.context,
      itemId: data.itemId,
      status: 'success',
    };
  } catch (error) {
    console.error('Error in handleChatWithAssistant:', error);
    return {
      content:
        'I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.',
      context: null,
      itemId: null,
      status: 'error',
    };
  }
};

export const analyzeImagesWithAssistant = async (
  imageUrls,
  description,
  itemId,
  sellerNotes,
  contextData
) => {
  try {
    console.log('Sending images to analyze:', imageUrls);
    const payload = { images: imageUrls };
    console.log('Sending payload:', JSON.stringify(payload, null, 2));
    const response = await axios.post(
      `${API_BASE_URL}/api/analyze-images`,
      payload
    );
    console.log('Server response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in analyzeImagesWithAssistant: ', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    throw error;
  }
};
