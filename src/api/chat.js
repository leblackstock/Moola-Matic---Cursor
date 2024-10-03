// frontend/src/api/chat.js

// Determine the API URL based on the environment
const API_URL = process.env.NODE_ENV === 'production'
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
    let messageArray;
    if (typeof messageInput === 'string') {
      // If it's a string, convert it to a single-message array
      messageArray = [{ role: 'user', content: messageInput }];
    } else if (Array.isArray(messageInput)) {
      // If it's already an array, use it as is
      messageArray = messageInput;
    } else {
      // If it's neither a string nor an array, throw an error
      throw new Error('Invalid message format. Expected a string or an array of message objects.');
    }

    console.log('Sending messages to Moola-Matic:', messageArray);

    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: messageArray, contextData }),
      credentials: 'include', // Include cookies for session management
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from server:', data);

    // Update contextData here if needed
    contextData = data.contextData || null;

    return { content: data.content, status: data.status };
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
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from server:', data);

    // Update contextData here if needed
    contextData = data.contextData || null;

    return {
      assistantResponse: data.advice,
      status: data.status,
      contextData: data.contextData
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
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response for image question:', data);
    return data.content;
  } catch (error) {
    console.error('Error in askQuestionAboutImage:', error);
    throw error;
  }
};