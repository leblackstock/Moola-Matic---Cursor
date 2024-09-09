const API_URL = process.env.NODE_ENV === 'production'
  ? '/api'
  : 'http://localhost:3001/api';

export const handleChatRequest = async (messages) => {
  try {
    console.log('Sending messages to server:', messages);
    console.log('API URL:', API_URL);

    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    console.log('Received response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error response:', errorData);
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Parsed response data:', data);
    
    // Return the response content directly
    return data.response;
  } catch (error) {
    console.error('Error in handleChatRequest:', error);
    throw error;
  }
};

export const handleImageUpload = async (imageFile) => {
  // Implement your image upload logic here
  // This might involve saving the file to disk or cloud storage
  // and returning the URL where the image can be accessed
  console.log('Backend: Image upload requested for:', imageFile.name);
  // Return the URL where the image is stored
  return `https://your-backend-url.com/uploads/${imageFile.name}`;
};
