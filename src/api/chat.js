import OpenAI from 'openai';
import axios from 'axios';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const ASSISTANT_ID = 'asst_4nMAXSwdqUcvfzfiYlBdzfYO';

export async function handleChatRequest(messages, onDataCallback) {
  console.log("handleChatRequest function called");
  console.log("Messages:", messages);

  const safeCallback = typeof onDataCallback === 'function' 
    ? onDataCallback 
    : (content, isComplete) => console.log('Received content:', content, 'Is complete:', isComplete);

  let accumulatedContent = '';

  try {
    const thread = await openai.beta.threads.create(); // Create thread
    console.log("Thread created:", thread.id);

    // Ensure messages is defined and processed correctly
    if (messages && messages.length) {
      // Add all messages to the thread
      for (const message of messages) {
        await openai.beta.threads.messages.create(thread.id, {
          role: message.role,
          content: message.content
        });
      }

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: ASSISTANT_ID,
        stream: true
      });

      for await (const chunk of run) {
        if (chunk.event === 'thread.message.delta' && chunk.data.delta.content) {
          const content = chunk.data.delta.content[0].text.value;
          accumulatedContent += content;
          safeCallback(content, false);
        }
      }

      safeCallback(accumulatedContent, true);
    } else {
      console.error("Messages array is empty or undefined.");
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    safeCallback('Sorry, an error occurred. Please try again later.', true);
  }
}

export const handleImageUpload = async (imageFile) => {
  if (!(imageFile instanceof File)) {
    throw new Error('Invalid image file');
  }

  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    console.log('Sending image upload request');
    console.log('Image file:', imageFile);
    console.log('FormData contents:', Array.from(formData.entries()));

    const response = await axios.post('http://localhost:5000/api/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Image upload response:', response.data);
    return response.data.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    throw error;
  }
};
