// frontend/src/api/chat.js

import axios from 'axios';
import { toast } from 'react-toastify';

// Determine the API URL based on the environment
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || 3001;
const API_URL =
  process.env.NODE_ENV === 'production' ? '/api' : `http://localhost:${BACKEND_PORT}/api`;

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

/**
 * Creates a user message object.
 * @param {string} content - The content of the message.
 * @returns {Object} - Message object with role 'user'.
 */
export const createUserMessage = content => ({
  role: 'user',
  content,
});

/**
 * Creates an assistant message object.
 * @param {string} content - The content of the message.
 * @returns {Object} - Message object with role 'assistant'.
 */
export const createAssistantMessage = content => ({
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
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
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

// Update the function signature to match how it's being called
export const handleAnalyzeImages = async (images, itemData, onProgressUpdate) => {
  console.log('handleAnalyzeImages called with:', { images, itemData });

  if (!itemData?.itemId) {
    console.error('No itemId provided for image analysis');
    toast.error('Error: No item ID provided for analysis.');
    return;
  }

  try {
    // Process the images array
    const imageUrls = images
      .map(image => {
        if (image.url) {
          return image.url.startsWith('http') ? image.url : `${API_BASE_URL}${image.url}`;
        } else if (image.filename) {
          return `${API_BASE_URL}/uploads/drafts/${itemData.itemId}/${image.filename}`;
        }
        console.error('No URL or filename for image:', image);
        return null;
      })
      .filter(Boolean);

    console.log('Image URLs for analysis:', imageUrls);

    if (imageUrls.length === 0) {
      toast.warning('No valid image URLs found for analysis.');
      return;
    }

    // Send the analysis request
    const analysisResponse = await axios.post(`${API_URL}/analyze-images`, {
      imageUrls,
      itemId: itemData.itemId,
      description: itemData.description || '',
      sellerNotes: itemData.sellerNotes || '',
      contextData: itemData.contextData || {},
      analysisDetails: itemData.analysisDetails || '',
    });

    // Call progress callback if provided
    if (onProgressUpdate) {
      onProgressUpdate(imageUrls.length, '', analysisResponse.data);
    }

    return analysisResponse.data;
  } catch (error) {
    console.error('Error in handleAnalyzeImages:', error);
    toast.error('An error occurred while analyzing the images. Please try again.');
    throw error;
  }
};

const sendMessageToOpenAI = async (messages, contextData = {}) => {
  try {
    /* const contextData = {
      // ... context data
    }; */

    const response = await axios.post('/api/chat', { messages, contextData });
    return response.data;
  } catch (error) {
    console.error('Error sending message to OpenAI:', error);
    throw error;
  }
};

export { sendMessageToOpenAI };
