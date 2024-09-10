const API_URL = process.env.NODE_ENV === 'production'
  ? '/api'
  : `http://localhost:${process.env.BACKEND_PORT || 3001}/api`;

const MOOLA_MATIC_ASSISTANT_ID = process.env.REACT_APP_MOOLA_MATIC_ASSISTANT_ID;

export const handleChatRequest = async (messages) => {
  try {
    console.log('Sending messages to Moola-Matic assistant:', messages);

    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: MOOLA_MATIC_ASSISTANT_ID,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from Moola-Matic assistant:', data);
    
    return data.content;
  } catch (error) {
    console.error('Error in handleChatRequest:', error);
    throw error;
  }
};

export const handleImageUpload = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${API_URL}/upload-image`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Image upload failed');
  }

  const data = await response.json();
  return data.url;
};

export const handleChatWithAssistant = async (messages) => {
  try {
    console.log('Sending messages to Moola-Matic assistant:', messages);

    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: MOOLA_MATIC_ASSISTANT_ID,
        messages: messages
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from Moola-Matic assistant:', data);
    
    return data.content;
  } catch (error) {
    console.error('Error in handleChatWithAssistant:', error);
    throw error;
  }
};

export const analyzeImageWithGPT4Turbo = async (imageFile, messages) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('messages', JSON.stringify(messages));

  try {
    const response = await fetch(`${API_URL}/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Image analysis failed');
    }

    const data = await response.json();
    return data.ai_analysis;
  } catch (error) {
    console.error('Error in analyzeImageWithGPT4Turbo:', error);
    throw error;
  }
};
