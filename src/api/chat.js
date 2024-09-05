import OpenAI from 'openai';
import axios from 'axios';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const ASSISTANT_ID = 'asst_4nMAXSwdqUcvfzfiYlBdzfYO';

export async function handleChatRequest(messages, onDataCallback, imageFile) {
  console.log("handleChatRequest function called");
  console.log("Messages:", messages);

  const safeCallback = typeof onDataCallback === 'function' 
    ? onDataCallback 
    : (content, isComplete) => console.log('Received content:', content, 'Is complete:', isComplete);

  let accumulatedContent = '';

  try {
    // If there's an image file, upload it first
    let imageFileId = null;
    if (imageFile) {
      imageFileId = await handleImageUpload(imageFile);
    }

    const thread = await openai.beta.threads.create();
    console.log("Thread created:", thread.id);

    // Add all messages to the thread, including any potential image reference
    for (const message of messages) {
      const messageContent = message.content;
      if (imageFileId && message.role === 'user') {
        messageContent.push({
          type: 'image_file',
          image_file: { file_id: imageFileId }
        });
      }
      await openai.beta.threads.messages.create(thread.id, {
        role: message.role,
        content: messageContent
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
  } catch (error) {
    console.error('OpenAI API error:', error);
    safeCallback('Sorry, an error occurred. Please try again later.', true);
  }
}

export const handleImageUpload = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await axios.post('http://localhost:5000/api/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url; // Return the URL of the uploaded image
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

