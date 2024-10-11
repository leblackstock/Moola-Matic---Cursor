// frontend/src/api/chat.js

// Determine the API URL based on the environment
const API_URL =
  process.env.NODE_ENV === 'production'
    ? '/api'
    : `http://localhost:${process.env.REACT_APP_BACKEND_PORT || 3001}/api`;

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
 * @param {string|Array} messageInput - A single message string or an array of message objects
 * @returns {Promise<Object>} - Assistant's response content and status
 */
export const handleChatWithAssistant = async (messageInput) => {
  try {
    let message;
    if (typeof messageInput === 'string') {
      message = messageInput;
    } else if (Array.isArray(messageInput) && messageInput.length > 0) {
      message = messageInput[messageInput.length - 1].content;
    } else {
      throw new Error('Invalid message format.');
    }

    console.log('Sending message to Moola-Matic:', message);

    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, contextData }),
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

    // Update contextData
    contextData = data.contextData || null;

    return { content: data.message.content, status: 'success' };
  } catch (error) {
    console.error('Error in handleChatWithAssistant:', error);
    return {
      content:
        'I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.',
      status: 'error',
    };
  }
};

/**
 * Function to analyze an image with GPT-4 Turbo
 * @param {File} imageFile - The image file to analyze
 * @param {Array} messages - Array of message objects { role: 'user' | 'assistant', content: '...' }
 * @returns {Promise<Object>} - Object containing image analysis and financial advice
 */
export const analyzeImageWithGPT4Turbo = async (imageFile, message, itemId) => {
  try {
    console.log('Analyzing image with GPT-4 Turbo...');
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('message', message);
    formData.append('itemId', itemId);

    const response = await fetch(`${API_URL}/analyze-image`, {
      method: 'POST',
      body: formData,
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

    // Update contextData here if needed
    contextData = data.contextData || null;

    return {
      assistantResponse: data.advice,
      status: data.status,
      contextData: data.contextData,
    };
  } catch (error) {
    console.error('Error in analyzeImageWithGPT4Turbo:', error);
    throw error;
  }
};

/**
 * Function to ask questions about the uploaded image
 * @param {String} question - The question to ask about the image
 * @returns {Promise<String>} - Assistant's response content
 */
export const askQuestionAboutImage = async (question) => {
  try {
    console.log('Asking question about image:', question);

    const response = await fetch(`${API_URL}/question-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
      credentials: 'include', // Include cookies for session management
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log('Received response for image question:', data);
    return data.content;
  } catch (error) {
    console.error('Error in askQuestionAboutImage:', error);
    throw error;
  }
};

export const handleImageChat = async (
  message,
  base64Image,
  itemId,
  isInitialAnalysis
) => {
  // ... implementation of handleImageChat (formerly chatImages)
};

export const analyzeImagesWithAssistant = async (formData) => {
  try {
    // Log the formData entries (without logging the actual image data)
    for (let [key, value] of formData.entries()) {
      if (key !== 'base64Images') {
        console.log(key, value);
      } else {
        console.log(key, 'Base64 image data (not logged)');
      }
    }

    const response = await fetch(`${API_URL}/analyze-images`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in analyzeImagesWithAssistant:', error);
    throw error;
  }
};
