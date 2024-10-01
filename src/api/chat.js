// frontend/src/api/chat.js

// Determine the API URL based on the environment
const API_URL = process.env.NODE_ENV === 'production'
  ? '/api'
  : `http://localhost:${process.env.REACT_APP_BACKEND_PORT || 3001}/api`;

/**
 * Function to handle chat with the Moola-Matic Assistant
 * @param {Array} messages - Array of message objects { role: 'user' | 'assistant', content: '...' }
 * @returns {Promise<String>} - Assistant's response content
 */
export const handleChatWithAssistant = async (messages) => {
  try {
    console.log('Sending messages to Moola-Matic:', messages);

    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
      credentials: 'include', // Include cookies for session management
    });

    if (!response.ok) {
      throw new Error('Failed to get response from assistant');
    }

    const data = await response.json();

    if (data.status === 'completed') {
      return data.content;
    } else {
      throw new Error('Chat response failed or is incomplete');
    }
  } catch (error) {
    console.error('Error in handleChatWithAssistant:', error);
    throw error;
  }
};

/**
 * Function to analyze an image with GPT-4 Turbo
 * @param {File} imageFile - The image file to analyze
 * @param {Array} messages - Array of message objects { role: 'user' | 'assistant', content: '...' }
 * @returns {Promise<Object>} - Object containing image analysis and financial advice
 */
export const analyzeImageWithGPT4Turbo = async (imageFile, messages) => {
  try {
    console.log('Analyzing image with GPT-4 Turbo...');
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('messages', JSON.stringify(messages));
    formData.append('detail', 'auto'); // Options: 'low', 'high', 'auto'

    const response = await fetch(`${API_URL}/analyze-image`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Include cookies for session management
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'completed') {
      return {
        assistantResponse: data.advice
      };
    } else {
      throw new Error('Image analysis failed or is incomplete');
    }
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
